import {VOBalance, VOOrder, WDType} from '../amodels/app-models';
import * as _ from 'lodash';
import {VOCandle} from '../amodels/api-models';
import {MATH} from '../acom/math';
import {CandlesAnalys1} from '../a-core/app-services/scanner/candles-analys1';
import {ApiPrivateAbstaract} from '../a-core/apis/api-private/api-private-abstaract';
import {Observable} from 'rxjs/internal/Observable';
import {filter, skip, withLatestFrom} from 'rxjs/operators';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {StorageService} from '../a-core/services/app-storage.service';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {BotBus, StopLossState} from './bot-bus';
import {Utils} from 'tslint';
import {UTILS} from '../acom/utils';

export interface StopLossSettings {
  stopLossPercent: number;
  sellPercent: number;
  resetStopLossAt: number;
  disabled: boolean
}


export class StopLossOrder {
  stopLossPercent = -3;
  sellPercent = -2;
  resetStopLossAt = 3;
  disabled = false;
  stopLossOrder$: BehaviorSubject<VOOrder> = new BehaviorSubject(null);
  inProgress = false;
  static getStopLossPrices(mas, stopLossPercent, sellPercent) {
    const ma25 = mas.ma3;
    const last = mas.last;
    const lowerPrice = last < ma25 ? last : ma25;
    const stopPrice = StopLossOrder.getStopPrice(lowerPrice, stopLossPercent);
    const sellPrice = StopLossOrder.getSellPrice(stopPrice, sellPercent);
    return {
      stopPrice,
      sellPrice
    }
  }

  constructor(
    private market: string,
    private apiPrivate: ApiPrivateAbstaract,
    private bus: BotBus,
    private storage: StorageService
  ) {

    this.storage.select(market + '-stop-loss-settings').then((set: StopLossSettings) => {
      if (set) {
        this.stopLossPercent = set.stopLossPercent;
        this.sellPercent = set.sellPercent;
        this.resetStopLossAt = set.resetStopLossAt || 3;
        this.disabled = set.disabled
      }
    });

    combineLatest(bus.stopLossState$, bus.balanceCoin$, bus.mas$)
      .pipe(filter(([state, balance, mas]) => {
        return state === StopLossState.NEED && balance.available !== 0 && !!mas
      }))
      .subscribe(([state, balance, mas]) => {
        if (this.inProgress) return;
        console.log(market, state, balance, mas);
        const available = balance.available;

        const prices = StopLossOrder.getStopLossPrices(mas, this.stopLossPercent, this.sellPercent);
        this.inProgress = true;

        console.log(market + ' NEED SET STOP_LOSS ');
        this.bus.log('NEED SET STOP_LOSS ' + [available , prices.stopPrice, prices.sellPrice].join(','));

        this.apiPrivate.stopLoss(this.market, available, prices.stopPrice, prices.sellPrice)
          .then(res => {
            this.bus.log('STOP_LOSS RESULT ' + JSON.stringify(res));
            console.log(market + ' STOP LOSS RESULT ', res);
          }).catch(err => {
          this.bus.log('STOP_LOSS ERROR ' + err.message);
         console.error(market, err)
        }).finally(() =>{
          this.inProgress = false;
        });

        UTILS.wait(20).then(() => {
          this.apiPrivate.refreshBalancesNow();
        })
      });

    bus.wdType$.pipe(skip(2)).subscribe(type => {
      if (type === WDType.LONG) {
        this.disabled = false;
      } else {
        this.disabled = true;
        // this.stopLossOrder$.next(null);
      }
    //   console.warn(this.market);
     //  this.save();
    });

    bus.mas$.pipe(skip(2), withLatestFrom(bus.balanceCoin$, this.stopLossOrder$))

      .subscribe(([mas, balanceCoin, stopLoss]) => {

        if (this.disabled) return;
        const wdType = bus.wdType$.getValue();
        if (wdType !== WDType.LONG) return;
        const b = balanceCoin.balance;

        if (!b) {
          console.log(market + ' no balance  ');
          return;
        }

        const prices = StopLossOrder.getStopLossPrices(mas, this.stopLossPercent, this.sellPercent);

        if (!stopLoss) return;

        const diff = MATH.percent(prices.stopPrice, stopLoss.stopPrice);
        console.log(market + 'STOP_LOSS diff ' + diff, 'color: green ');

        if (diff > this.resetStopLossAt) {
          this.inProgress = true;
          UTILS.wait(20).then(() => {
            this.inProgress = false;
          });

          this.bus.log('CANCEL OLD STOP_LOSS diff: '+ diff + '  resetStopLossAt ' + this.resetStopLossAt)
          console.log('%c ' + this.market + ' reset stopLoss ', 'color:red');   //  this.priceStopLoss$.next(0)
          this.cancelOrder(stopLoss.uuid).then(res => {
            this.bus.log('CANCEL OLD STOP_LOSS RESULT '+ JSON.stringify(res))
            console.log(' cancel order result', res);
          }).catch(console.error)
        }
      });
  }

  log(data: { action: string, reason: string }) {
    console.log(data.action + ' ' + data.reason)
  }

  calculatePrice(candles: VOCandle[]): number {
    const closes = CandlesAnalys1.closes(candles);
    return _.mean(_.takeRight(closes, 35));
  }

  async cancelOrder(uuid: string) {
    if (this.disabled) return;
    console.log(this.market + ' CANCEL STOP LOSS ' + uuid);
    const ar = this.market.split('_');

    return this.apiPrivate.cancelOrder(uuid, ar[0], ar[1]).toPromise();
  }

  async cancelSopLossOrder() {
    const order = this.stopLossOrder$.getValue();
    if (!order) return Promise.resolve();
    else return this.cancelOrder(order.uuid);
  }


  static getStopPrice(ma: number, stopPercent: number): number {
    return +(ma + (ma * (stopPercent / 100))).toPrecision(6);
  }

  static getSellPrice(stopPrice: number, sellPercent: number): number {
    return +(stopPrice + (stopPrice * (sellPercent / 100))).toPrecision(6);
  }

  /*get stopPrice() {
    const ma = this.ma$.getValue();
    return StopLossOrder.getStopPrice(ma, this.stopLossPercent);
  }*/

  /*async setStopLoss(qty: number, stopPrice: number, sellPrice: number) {
    if (stopPrice === 0 || sellPrice === 0) {
      console.error(' stop price 0');
      throw new Error(' price errors  stopPrice '+ stopPrice+ ' sellPrice ' + sellPrice)
    }
    console.log(this.market + '  SET STOP LOSS ')
    let result;
    try {

      result = await this.apiPrivate.stopLoss(this.market, qty, stopPrice, sellPrice);

      console.log({action: 'STOP_LOSS RESULT ', reason: result.uuid});
    } catch (e) {
      console.error(e);
      throw new Error(' price errors  stopPrice '+ stopPrice+ ' sellPrice ' + sellPrice)
    }
    return result
  }
*/
  destroy() {
    this.storage.remove(this.market + '-stop-loss-settings');
  }

  private combineStopLosses(stopLosses: VOOrder[]) {
    console.log(' combine stop losses ', stopLosses);
  }

  save() {
    const data = this.toJSON();
    console.warn(this.market + ' save stop loss settings  ', data);
    this.storage.upsert(this.market + '-stop-loss-settings', this.toJSON());
  }

  toJSON(): StopLossSettings {
    return {
      stopLossPercent: this.stopLossPercent,
      sellPercent: this.sellPercent,
      resetStopLossAt: this.resetStopLossAt,
      disabled: this.disabled

    }
  }
}
