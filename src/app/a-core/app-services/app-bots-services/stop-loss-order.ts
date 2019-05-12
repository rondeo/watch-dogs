import {VOBalance, VOOrder, WDType} from '../../../amodels/app-models';
import * as _ from 'lodash';
import {VOCandle} from '../../../amodels/api-models';
import {MATH} from '../../../acom/math';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {Observable} from 'rxjs/internal/Observable';
import {filter} from 'rxjs/operators';
import {Subject} from 'rxjs/internal/Subject';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {StorageService} from '../../services/app-storage.service';

export interface StopLossSettings {
  stopLossPercent: number
  sellPercent: number
}



export class StopLossOrder {
  stopLossPercent = -3;
  sellPercent = -2;
  inProgerss: string;

  ma$: BehaviorSubject<number> = new BehaviorSubject(0);
  priceStopLoss$: BehaviorSubject<number> = new BehaviorSubject(0);
  priceSell$: BehaviorSubject<number> = new BehaviorSubject(0);

  stopLossOrder$: BehaviorSubject<VOOrder> = new BehaviorSubject(null);

  constructor(
    private market: string,
    private apiPrivate: ApiPrivateAbstaract,
    private potSize: number,
    openOrders$: Observable<VOOrder[]>,
    balance$: Observable<VOBalance>,
    candles$: Observable<VOCandle[]>,
    mas$: Observable<{ ma3: number, ma7: number,  ma25: number, ma99: number}>,
    private wdType: WDType,
    private storage: StorageService
  ) {

    this.storage.select(market + '-stop-loss-settings').then((set: StopLossSettings)=> {
      this.stopLossPercent = set.stopLossPercent;
      this.sellPercent = set.sellPercent;
    })

    combineLatest(openOrders$.pipe(filter(v => !!v)),balance$, mas$)
      .subscribe(([openOrders, balance, mas]) => {
        const bal = balance.balance;

        if(bal < (potSize / 5)) {
          console.log(' balance too small  ');
          return;
        }

        const stopLosses = openOrders.filter(function (item) {
          return item.stopPrice;
        });

        console.log(openOrders, balance, mas);
        switch(wdType) {
          case WDType.OFF:
            break;
            case WDType.LONG:
              const ma = mas.ma25;
              this.ma$.next(+ma.toFixed(8));
              const stopLossPrice = ma+ (ma * (this.stopLossPercent/100));
              this.priceStopLoss$.next(+stopLossPrice.toFixed(8));
              const sellPrice = +(stopLossPrice + (stopLossPrice * (this.sellPercent / 100))).toFixed(8);
              this.priceSell$.next(+sellPrice.toFixed(8));

              if(stopLosses.length > 1) {
                this.combineStopLosses(stopLosses);
                this.stopLossOrder$.next(null);
                this.priceStopLoss$.next(0);
                return;
              }

              if(stopLosses.length === 0) {
                const available = balance.available;
                if(available < (potSize / 5)) {
                  console.log(' available very little ')
                  return;
                }


                this.setStopLoss(available);
                this.stopLossOrder$.next(null);
                this.priceStopLoss$.next(0);
                return;
              } else {
                const stopLoss = stopLosses[0];
                this.stopLossOrder$.next(stopLoss);
                this.priceStopLoss$.next(stopLoss.stopPrice);
              }



              break;
              case WDType.SHORT:
                break;
          default:
            break

        }


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
  }





 /* private resetStopLoss(candles: VOCandle[] , stopLoss: VOOrder){
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
*/
//  percentStopLoss = -2;
 // percentStopLoss2 = -3;
 // prevValue: number;


  log(data: { action: string, reason: string }) {
    console.log(data.action + ' ' + data.reason)
  }

  calculatePrice(candles: VOCandle[]): number {
    const closes = CandlesAnalys1.closes(candles);
    return _.mean(_.takeRight(closes, 35));
  }

  async cancelOrder(uuid: string) {
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

  async setStopLoss( qty: number) {

   const stopLossPrice = this.priceStopLoss$.getValue();
    const sellPrice = this.priceSell$.getValue();

    try {
     const result = await this.apiPrivate.stopLoss(this.market, qty, stopLossPrice, sellPrice);
     const reason = ' set stop loss ';
      this.log({action: 'STOP_LOSS RESULT ', reason: result.uuid});
    } catch (e) {
      console.error(e);
    }
  }

  destroy() {

  }

  private combineStopLosses(stopLosses: VOOrder[]) {
    console.log(' combine stop losses ', stopLosses);
  }

  save() {
    this.storage.upsert(this.market + '-stop-loss-settings', this.toJSON())

  }

  toJSON(): StopLossSettings {
    return {
      stopLossPercent: this.stopLossPercent,
      sellPercent: this.sellPercent

    }
  }
}
