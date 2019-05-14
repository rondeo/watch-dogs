import {VOBalance, VOOrder, WDType} from '../../../amodels/app-models';
import * as _ from 'lodash';
import {VOCandle} from '../../../amodels/api-models';
import {MATH} from '../../../acom/math';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {Observable} from 'rxjs/internal/Observable';
import {withLatestFrom} from 'rxjs/operators';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {StorageService} from '../../services/app-storage.service';

export interface StopLossSettings {
  stopLossPercent: number;
  sellPercent: number;
  resetStopLossAt: number;
}


export class StopLossOrder {
  stopLossPercent = -3;
  sellPercent = -2;
  resetStopLossAt = 3;
  inProgerss: string;
  ma$: BehaviorSubject<number> = new BehaviorSubject(0);
  priceStopByCanles$: BehaviorSubject<number> = new BehaviorSubject(0);
  priceSell$: BehaviorSubject<number> = new BehaviorSubject(0);


  stopLossOrder$: BehaviorSubject<VOOrder> = new BehaviorSubject(null);

  constructor(
    private market: string,
    private apiPrivate: ApiPrivateAbstaract,
    private potSize: number,
    openOrders$: Observable<VOOrder[]>,
    balance$: Observable<VOBalance>,
    candles$: Observable<VOCandle[]>,
    mas$: Observable<{ ma3: number, ma7: number, ma25: number, ma99: number }>,
    wdType$: BehaviorSubject<WDType>,
    private storage: StorageService
  ) {

    this.storage.select(market + '-stop-loss-settings').then((set: StopLossSettings) => {
      if (set) {
        this.stopLossPercent = set.stopLossPercent;
        this.sellPercent = set.sellPercent;
        this.resetStopLossAt = set.resetStopLossAt || 3;

      }
    });

    wdType$.subscribe(type => {
      if(type === WDType.LONG) {

      } else {
        this.stopLossOrder$.next(null);
      }
    })


    mas$.subscribe(mas => {
      const ma = mas.ma25;
      this.ma$.next(+ma.toFixed(8));
    });

    this.ma$.subscribe(ma => {
      const newStopPrice = this.stopPrice;
      const stopPrice = this.stopPrice;
      this.priceStopByCanles$.next(stopPrice);
      const sellPrice = StopLossOrder.getStopPrice(ma, this.stopLossPercent);
      this.priceSell$.next(sellPrice);

      const wdType = wdType$.getValue();
      if (wdType !== WDType.LONG) return;

      const stopLoss: VOOrder = this.stopLossOrder$.getValue();
      if (!stopLoss) return;

      const diff = MATH.percent(newStopPrice, stopLoss.stopPrice);
      console.log(market + ' stop diff ' + diff);

      if (diff > this.resetStopLossAt) {
        //  this.priceStopLoss$.next(0)
        this.cancelOrder(stopLoss.uuid).then(res => {
          console.log(' cancel order result', res);
        }).catch(console.error)
      }
    });
    openOrders$.subscribe(openOrders => {
      const wdType = wdType$.getValue();
      if (wdType !== WDType.LONG) return;

      if (openOrders.length) {
        const stopLosses = openOrders.filter(function (item) {
          return item.stopPrice;
        });

        if (stopLosses.length === 1) {
          this.stopLossOrder$.next(stopLosses[0]);
        } else {
          this.stopLossOrder$.next(null);
          //  this.priceStopLoss$.next(0);
        }
      } else {
        this.stopLossOrder$.next(null);
        // this.priceStopLoss$.next(0);
      }

      console.log(market, openOrders);
    });

    balance$.pipe(withLatestFrom(openOrders$))
    // combineLatest(openOrders$.pipe(filter(v => !!v)), balance$)
      .subscribe(([balance, openOrders]) => {
        if (!balance) return;

        const wdType = wdType$.getValue();
        if (wdType !== WDType.LONG) return;

        console.log(openOrders);
        const bal = balance.balance;


        const err = openOrders.some(function (item) {
          return item.market !== market;
        });
        if (err) {
          console.error(' not my orders ');
          return;
        }
        if (bal < (potSize / 5)) {
          console.log(' balance too small  ');
          return;
        }

        const stopLosses = openOrders.filter(function (item) {
          return item.stopPrice;
        });

        const available = balance.available;

        if (stopLosses.length === 0) {
          this.stopLossOrder$.next(null);
          // this.priceStopLoss$.next(0);

          if (available < (potSize / 5)) {
            console.log(' available very little ');
            return;
          }

          this.setStopLoss(available);
        } else if (stopLosses.length > 1) {
          this.combineStopLosses(stopLosses);
          this.stopLossOrder$.next(null);
          // this.priceStopLoss$.next(0);
          return;
        } else {
          const stopLoss = stopLosses[0];
          const k = available / potSize;
          if (k > 0.3) {
            console.log('%c cancel stop_loss because balance available ' + k, 'color:red');
            this.stopLossOrder$.next(null);
            // this.priceStopLoss$.next(0);
            this.cancelOrder(stopLoss.uuid).then(res => {
              console.log('CANCEL STOP LOSS result', res);
              this.apiPrivate.refreshBalances();
            });

            return;
          }

          this.stopLossOrder$.next(stopLoss);
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

    console.log(this.market + ' CANCEL STOP LOSS ' + uuid);
    const ar = this.market.split('_');
    return this.apiPrivate.cancelOrder(uuid, ar[0], ar[1]).toPromise();
  }

  async cancelSopLossOrder() {
    const order = this.stopLossOrder$.getValue();
    if (!order) return Promise.resolve()
    else return this.cancelOrder(order.uuid);
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

  setCurrentPrices() {

  }


  static getStopPrice(ma: number, stopPercent: number): number {
    return +(ma + (ma * (stopPercent / 100))).toPrecision(6);
  }

  static getSellPrice(stopPrice: number, sellPercent: number): number {
    return +(stopPrice + (stopPrice * (sellPercent / 100))).toPrecision(6);
  }

  get stopPrice() {
    const ma = this.ma$.getValue();
    return StopLossOrder.getStopPrice(ma, this.stopLossPercent);
  }


  async setStopLoss(qty: number) {
    const stopPrice = this.stopPrice;
    const sellPrice = StopLossOrder.getSellPrice(stopPrice, this.sellPercent);
    try {
      const result = await this.apiPrivate.stopLoss(this.market, qty, this.stopPrice, sellPrice);
      const reason = ' set stop loss ';
      this.log({action: 'STOP_LOSS RESULT ', reason: result.uuid});
    } catch (e) {
      console.error(e);
    }
  }

  destroy() {
    this.storage.remove(this.market + '-stop-loss-settings');
  }

  private combineStopLosses(stopLosses: VOOrder[]) {
    console.log(' combine stop losses ', stopLosses);
  }

  save() {
    const data = this.toJSON();
    console.log(this.market + ' save ', data);
    this.storage.upsert(this.market + '-stop-loss-settings', this.toJSON());
  }

  toJSON(): StopLossSettings {
    return {
      stopLossPercent: this.stopLossPercent,
      sellPercent: this.sellPercent,
      resetStopLossAt: this.resetStopLossAt

    }
  }
}
