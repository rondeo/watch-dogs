
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {OrderType, VOBalance, VOOrder} from '../../models/app-models';
import {UtilsBooks} from '../../com/utils-books';
import {Subject} from 'rxjs/Subject';
import {reject} from 'q';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOMovingAvg} from '../../com/moving-average';
import * as moment from 'moment';
import {WatchDogShared} from './watch-dog-shared';
import {WatchDogStatus} from './watch-dog-status';


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
    public shared: WatchDogShared
  ) {
    this.id = shared.id;
    this.init();
  }

  async init() {
    this.apiPrivate = ApisPrivateService.instance.getExchangeApi(this.shared.exchange);
    this.apiPublic = ApisPublicService.instance.getExchangeApi(this.shared.exchange);
  }

  sell(): Promise<WatchDogStatus> {
    console.log(moment().format('HH:mm') + ' ' + this.shared.wdId + ' SELL ')
    this.shared.addHistory('SELL command');
    if (this.shared.status === WatchDogStatus.SOLD_OUT || this.shared.status === WatchDogStatus.SOLD) {
      return;
    }

    const base: string = this.shared.base;
    const coin = this.shared.coin;
    const balanceCoin = this.shared.balanceCoin;

    this.statusChangesSub.next({
      status: WatchDogStatus.SELLING_IN_PROGRESS,
      message: 'downloading books'
    });

    this.apiPublic.downloadBooks(base, coin).subscribe(books => {
      console.log(books);
      let rate = UtilsBooks.getRateForAmountCoin(books.buy, balanceCoin);
      rate = (rate - rate * 0.02);
      if (rate > 0.001) rate = +rate.toFixed(8);
      else if (rate > 1) rate = +rate.toFixed(5);
      else if (rate > 100) rate = +rate.toFixed(0);


      return this.apiPrivate.sellLimit(base, coin, balanceCoin, rate).subscribe(order => {
        console.log(order);
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
          this.statusChangesSub.next({
            status: WatchDogStatus.ERROR_SELLING,
            message: JSON.stringify(order)
          });
          setTimeout(() => this.sell(), 50 * 1000);
        }
      }, error => {
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
      const order: VOOrder = await this.apiPrivate.getOrder(this.oredr.uuid, this.shared.base, this.shared.coin).toPromise();
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
      this.statusChangesSub.next({
        status: WatchDogStatus.ERROR_SELLING,
        message: JSON.stringify(e)
      });

      setTimeout(() => this.checkOrder(), 30000);
    }

  }

  dectroy() {
    this.shared = null;
    this.apiPrivate = null;
    this.apiPublic = null;
  }
}
