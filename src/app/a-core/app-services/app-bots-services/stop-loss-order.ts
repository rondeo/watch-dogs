import {OrderType, VOBalance, VOOrder} from '../../../amodels/app-models';
import * as _ from 'lodash';
import {VOCandle} from '../../../amodels/api-models';
import {MATH} from '../../../acom/math';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {Observable} from 'rxjs/internal/Observable';
import {filter} from 'rxjs/operators';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Subject} from 'rxjs/internal/Subject';
import {CandlesUtils} from '../candles/candles-utils';

export class StopLossOrder {
  stopLossPercent = 3;

  inProgerss: string;
  triggered$: Subject<VOOrder> = new Subject();
  constructor(
    private market: string,
    private apiPrivate: ApiPrivateAbstaract,
    openOrders: Observable<VOOrder[]>,
    candles$: Observable<VOCandle[]>,
    balance$: Observable<VOBalance>,
    private isLive
  ) {



    combineLatest(openOrders.pipe(filter(v => !!v)), candles$)
      .subscribe(([stopLoss, candles]) => {



        /*const stopLosses = orders.filter(function (item) {
          return item.orderType === OrderType.STOP_LOSS
        });

        stopLosses.forEach(function (item) {
          if(!item.stopPrice) item.stopPrice = item.rate
        });

        if(stopLosses.length > 1) {
          const old = stopLosses[0];
          if(!isLive) {
            orders.splice(orders.indexOf(old), 1);
            ordersHisory$.next(orders);
            stopLosses.shift();
          } else {
            this.inProgerss = 'CANCEL_EXTRA_STOP_LOSS';
            this.apiPrivate.cancelOrder2(old.uuid, market).then(cancelResult => {
              console.warn(' cancel order result ', cancelResult);
              this.inProgerss = null;
            })
          }
        }

        if(stopLosses.length) {
          const last3 = candles.slice(candles.length - 3);
          if(this.isStopLossTriggered(last3, stopLosses[0])) {
            this.triggered$.next(stopLosses[0]);
          } else {
            this.resetStopLoss(candles.slice(candles.length - 25), stopLosses[0])
          }
        }*/
     // console.log(orders, candles)
    });


    if(isLive) {
      balance$.subscribe(balance => {
        console.log(balance);
      })
    }



  }

  private resetStopLoss(candles: VOCandle[] , stopLoss: VOOrder){
    const stopPrice = stopLoss.stopPrice;
    const closes = candles.map(function (item) {
      return item.close;
    });
    const ma = MATH.mean(closes);
   const percent =  MATH.percent(stopPrice, ma);
   console.log(this.market + ' stop loss percent ' + percent);
  }

  private isStopLossTriggered(candles: VOCandle[], stopLoss: VOOrder) {
    const triggetPrice = stopLoss.stopPrice;
    const mins = candles.map(function (item) {
      return item.low;
    });
    const min = Math.min(...mins);
    return min < triggetPrice;
  }

  percentStopLoss = -2;
  percentStopLoss2 = -3;
  prevValue: number;


  log(data: { action: string, reason: string }) {
    console.log(data.action + ' ' + data.reason)
  }

  calculatePrice(candles: VOCandle[]): number {
    const closes = CandlesAnalys1.closes(candles);
    return _.mean(_.takeRight(closes, 35));
  }

  private async cancelOrder(uuid: string) {
    this.log({action: 'CANCELING ORDER ', reason: uuid});
    const ar = this.market.split('_');
    return this.apiPrivate.cancelOrder(uuid, ar[0], ar[1]).toPromise();
  }

  async cancelSopLossOrders() {
   /*
    if (!this.orders.length) return Promise.resolve();
    return new Promise(async (resolve, reject) => {
      Promise.all(this.orders.map((order) => {
        return this.cancelOrder(order.uuid)
      })).then(result => {
        setTimeout(() => {
          this.apiPrivate.refreshAllOpenOrders();
          setTimeout(() => resolve(result), 5000);
        }, 2000);

      }, reject);
    })*/
  }


  async checkStopLoss(price: number, qty: number) {
   /* if (!this.orders.length) throw new Error('no stop loss');
    let order = this.orders[0];
    // const last_ma99 = MATH.percent(lastPrice, ma99);
    const diff = MATH.percent(order.stopPrice, price);
    const message = ' STOP_LOSS ' + this.percentStopLoss + ' diff ' + diff;
    console.log(this.market + message);
    this.prevValue = diff;
    if (diff < (this.percentStopLoss - 3)) {
      this.percentStopLoss = this.percentStopLoss2;
      this.log({action: 'RESETTING STOP_LOSS', reason: ' price ' + price});
      return this.cancelSopLossOrders();
    }*/
  }

  async setStopLoss(lastPrice: number, qty: number) {
   /* const orders = this.orders;
    if (orders.length) return Promise.reject('ERROR REMOVE ORDER FIRST ' + JSON.stringify(orders));
    return new Promise(async (resolve, reject) => {
      const newStopLoss: number = +(lastPrice + (lastPrice * this.percentStopLoss / 100)).toFixed(8);
      const sellPrice = +(newStopLoss + (newStopLoss * -0.01)).toFixed(8);
      this.log({action: ' setStopLoss ', reason: ' P ' + newStopLoss + ' qty: ' + qty + ' Ps ' + sellPrice});

      const api = this.apiPrivate;
      let result;
      try {
        result = await api.stopLoss(this.market, qty, newStopLoss, sellPrice);
        this.log({action: 'RESULT SL', reason: result.uuid});
      } catch (e) {
        reject(e.toString());
      }

      this.apiPrivate.refreshAllOpenOrders();
      setTimeout(() => {
        resolve(result);
      }, 2000);

    })*/


  }

  destroy() {

  }
}
