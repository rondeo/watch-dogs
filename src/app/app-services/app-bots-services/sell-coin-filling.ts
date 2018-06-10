import {WatchDogStatus, WatchDog} from '../../models/watch-dog';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {OrderType, VOBalance, VOOrder} from '../../models/app-models';
import {UtilsBooks} from '../../com/utils-books';
import {Subject} from 'rxjs/Subject';
import {reject} from 'q';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApisPublicService} from '../../apis/apis-public.service';

export class SellCoinFilling {

  id:string;
  private apiPrivate: ApiPrivateAbstaract;
  private apiPublic: ApiPublicAbstract;
  constructor(
    private watchDog: WatchDog,
    apiPrivates: ApisPrivateService,
    apiPublics: ApisPublicService
  ) {
    this.apiPrivate = apiPrivates.getExchangeApi(watchDog.exchange);
    this.apiPublic = apiPublics.getExchangeApi(watchDog.exchange);
    this.id = watchDog.id;
  }

  sell(): Promise<WatchDogStatus> {
    return new Promise((resolve, reject) => {
      if (!this.watchDog.coinMC || !this.watchDog.baseMC) {
        reject('MC value required')
        return;
      }
      if (this.watchDog.status === WatchDogStatus.SOLD_OUT || this.watchDog.status === WatchDogStatus.SOLD) {
        resolve(this.watchDog.status);
        return;
      }
      this.watchDog.status = WatchDogStatus.SELLING_START;


      this.apiPrivate.downloadBalance(this.watchDog.coin).subscribe((balance: VOBalance) => {
        const base: string = this.watchDog.base;
        const coin = this.watchDog.coin;
        this.watchDog.balanceCoin = balance.balance;
        if (balance.balance === 0) {
          this.watchDog.status = WatchDogStatus.SOLD_OUT;
          resolve(WatchDogStatus.SOLD_OUT);
          return;
        }

        this.apiPublic.downloadBooks(base, coin).subscribe(books => {
          let rate = UtilsBooks.getRateForAmountCoin(books.buy, balance.balance);
          rate = (rate - rate * 0.02);
          if (rate > 0.001) rate = +rate.toFixed(8);
          else if (rate > 1) rate = +rate.toFixed(5);
          else if (rate > 100) rate = +rate.toFixed(0);
          return this.apiPrivate.sellLimit(base, coin, balance.balance, rate).subscribe(order => {
            if (order.uuid) {
              this.watchDog.orderID = order.uuid;
              if (order.isOpen) {
                this.watchDog.status = WatchDogStatus.SELLING_GOT_ORDER;
                this.checkOrder(resolve, reject);
              } else {
                resolve(this.watchDog.status)
                this.watchDog.status = WatchDogStatus.SOLD;
              }
            }
          })
        })

      })
    })
  }

  private checkOrderCounter = 0;

  async checkOrder(onSuccess: (v: WatchDogStatus) => void, onError: Function) {
    this.checkOrderCounter++;
    if (this.checkOrderCounter > 10) {
      reject(' check order counter > 10')
      return
    }
    try {
      const order: VOOrder = await this.apiPrivate.getOrder(this.watchDog.orderID, this.watchDog.base, this.watchDog.coin).toPromise()
      if (order.isOpen) {
        setTimeout(() => this.checkOrder(onSuccess, onError), 10000);
      } else {
        this.watchDog.status = WatchDogStatus.SELLING_ORDER_CLOSED;
        onSuccess(WatchDogStatus.SELLING_ORDER_CLOSED);
      }
    } catch (e) {
      setTimeout(() => this.checkOrder(onSuccess, onError), 30000);
    }

  }

  dectroy() {
    this.watchDog = null;
    this.apiPrivate = null;
    this.apiPublic = null;
  }
}
