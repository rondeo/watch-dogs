import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {OrderType, VOBalance, VOOrder} from '../../../models/app-models';
import {UtilsBooks} from '../../com/utils-books';
import {reject} from 'q';
import {ApisPrivateService} from '../../apis/api-private/apis-private.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOMovingAvg} from '../../com/moving-average';
import * as moment from 'moment';
import {WatchDogStatus, IWatchDog} from './watch-dog-status';
import {Subject} from 'rxjs';


export class SellCoinFilling {

  id: string;
  oredr: VOOrder;
  private apiPrivate: ApiPrivateAbstaract;
  private apiPublic: ApiPublicAbstract;

  private statusChangesSub: Subject<{ status: WatchDogStatus, message: string }> = new Subject();

  statusChanged$() {
    return this.statusChangesSub.asObservable();
  }

  constructor(
    public watchDog: IWatchDog
  ) {
    this.id = watchDog.id;
    this.init();
  }

  async init() {
    this.apiPrivate = ApisPrivateService.instance.getExchangeApi(this.watchDog.exchange);
    this.apiPublic = ApisPublicService.instance.getExchangeApi(this.watchDog.exchange);
  }

  sell(): Promise<WatchDogStatus> {
    console.log(moment().format('HH:mm') + ' ' + this.watchDog.wdId + ' SELL ')
    this.watchDog.log('SELL command');
    if (this.watchDog.status === WatchDogStatus.SOLD_OUT || this.watchDog.status === WatchDogStatus.SOLD) {
      return;
    }

    const base: string = this.watchDog.base;
    const coin = this.watchDog.coin;
    const balanceCoin = this.watchDog.balanceCoin;


    this.statusChangesSub.next({
      status: WatchDogStatus.SELLING_IN_PROGRESS,
      message: 'downloading books'
    });
    this.watchDog.log('start selling');

    this.apiPublic.downloadBooks(base, coin).subscribe(books => {
      console.log(books);

      let rate = UtilsBooks.getRateForAmountCoin(books.buy, balanceCoin);
      rate = (rate - rate * 0.02);
      if (rate > 0.001) rate = +rate.toFixed(8);
      else if (rate > 1) rate = +rate.toFixed(5);
      else if (rate > 100) rate = +rate.toFixed(0);

      this.watchDog.log('downloaded books rate: ' + rate);

      return this.apiPrivate.sellLimit(base, coin, balanceCoin, rate).then(order => {
        console.log(order);
        this.watchDog.log('order result : ' + JSON.stringify(order));
        this.oredr = order;
        this.statusChangesSub.next({
          status: WatchDogStatus.SELLING_IN_PROGRESS,
          message: JSON.stringify(order)
        });
        if (order.uuid) {
          if (order.isOpen) {
            setTimeout(() => this.checkOrder(), 10 * 1000);
          } else {
            this.statusChangesSub.next({
              status: WatchDogStatus.SELLING_ORDER_CLOSED,
              message: JSON.stringify(order)
            });
          }
        } else {
          this.watchDog.onError('respond: '+ JSON.stringify(order))
          this.statusChangesSub.next({
            status: WatchDogStatus.ERROR_SELLING,
            message: JSON.stringify(order)
          });
          setTimeout(() => this.sell(), 50 * 1000);
        }
      }, error => {
        this.watchDog.onError(error);
        this.statusChangesSub.next({
          status: WatchDogStatus.ERROR_SELLING,
          message: JSON.stringify(error)
        });
      })
    }, error => {
      this.statusChangesSub.next({
        status: WatchDogStatus.ERROR_SELLING,
        message: JSON.stringify(error)
      });
    });
  }



  private checkOrderCounter = 0;

  async checkOrder() {
    this.watchDog.log('checking order ' + this.oredr.uuid);
    this.statusChangesSub.next({
      status: WatchDogStatus.CHECKING_ORDER,
      message: 'checkOrder ' + this.checkOrderCounter
    });
    this.checkOrderCounter++;
    if (this.checkOrderCounter > 10) {
      this.statusChangesSub.next({
        status: WatchDogStatus.ERROR_SELLING,
        message: 'checkOrder ' + this.checkOrderCounter
      });
      return
    }
    try {
      const order: VOOrder = await this.apiPrivate.getOrder(this.oredr.uuid, this.watchDog.base, this.watchDog.coin).toPromise();
      this.watchDog.log('order ' + JSON.stringify(order));
      if (order.isOpen) {
        this.statusChangesSub.next({
          status: WatchDogStatus.CHECKING_ORDER,
          message: JSON.stringify(order)
        });
        setTimeout(() => this.checkOrder(), 10000);
      } else {
        this.statusChangesSub.next({
          status: WatchDogStatus.SELLING_ORDER_CLOSED,
          message: JSON.stringify(order)
        });
      }
    } catch (e) {
      this.watchDog.onError(e);
      this.statusChangesSub.next({
        status: WatchDogStatus.ERROR_SELLING,
        message: JSON.stringify(e)
      });

      setTimeout(() => this.checkOrder(), 30000);
    }

  }

  dectroy() {
    this.watchDog = null;
    this.apiPrivate = null;
    this.apiPublic = null;
  }
}
