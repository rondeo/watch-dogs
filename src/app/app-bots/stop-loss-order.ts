import {VOBalance, VOOrder, WDType} from '../amodels/app-models';
import * as _ from 'lodash';
import {VOCandle} from '../amodels/api-models';
import {MATH} from '../acom/math';
import {CandlesAnalys1} from '../a-core/app-services/scanner/candles-analys1';
import {ApiPrivateAbstaract} from '../a-core/apis/api-private/api-private-abstaract';
import {Observable} from 'rxjs/internal/Observable';
import {skip, withLatestFrom} from 'rxjs/operators';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {StorageService} from '../a-core/services/app-storage.service';
import {Utils} from 'tslint';
import {UTILS} from '../acom/utils';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {BotBus} from './bot-bus';

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

  static getStopLossPrices(mas, stopLossPercent, sellPercent) {
    const ma25 = mas.ma3;
    const last = mas.last;
    const lowerPrice = last < ma25? last : ma25;
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
    openOrders$: Observable<VOOrder[]>,
    private balanceCoin$: Observable<VOBalance>,
    candles$: Observable<VOCandle[]>,
    public mas$: Observable<{last: number, ma3: number, ma7: number, ma25: number, ma99: number }>,
    protected wdType$: BehaviorSubject<WDType>,
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

    wdType$.pipe(skip(2)).subscribe(type => {
      if (type === WDType.LONG) {
        this.disabled = false;
      } else {
        this.disabled = true;
        // this.stopLossOrder$.next(null);
      }
      this.save();
    });

    this.mas$.pipe(skip(2), withLatestFrom(balanceCoin$, this.stopLossOrder$))
      .subscribe(([mas, balanceCoin, stopLoss]) => {

      if (this.disabled) return;
      const wdType = wdType$.getValue();
      if (wdType !== WDType.LONG) return;
      const b = balanceCoin.balance;

      if(!b) {
        console.log(market + ' no balance  ');
        return;
      }

      const prices = StopLossOrder.getStopLossPrices(mas, this.stopLossPercent, this.sellPercent);
      if(!stopLoss) {
        const available = balanceCoin.available;
        if(!available) {
          console.warn(this.market + ' not  available ' + available);
          return;
        }
        console.warn(this.market + '  setting stop loss ', prices);

        this.setStopLoss(available, prices.stopPrice, prices.sellPrice).then(res => {
          console.log(' set stop loss result ', res)
        });
        console.log(' no stopLoss ' + this.market );
        return;
      }

      const diff = MATH.percent(prices.stopPrice, stopLoss.stopPrice);
      console.log(market + 'STOP_LOSS diff ' + diff, 'color: green ');

      if (diff > this.resetStopLossAt) {
        console.log('%c ' + this.market + ' reset stopLoss ', 'color:red' )
        //  this.priceStopLoss$.next(0)
        this.cancelOrder(stopLoss.uuid).then(res => {
          console.log(' cancel order result', res);
        }).catch(console.error)
      }
    });

    openOrders$.subscribe(openOrders => {
      const stopLosses = openOrders.filter(function (item) {
        return item.stopPrice;
      });

      if(stopLosses.length === 0) this.stopLossOrder$.next(null);
      else {
        this.stopLossOrder$.next(stopLosses[0]);
        if(stopLosses.length > 1) {
          console.warn(' stop loss orders more then one ');
          Promise.all(openOrders.map((order) => {
            return this.cancelOrder(order.uuid);
          })).then(results => {
            console.log(results);
          });
        }
      }
    });

  }


  log(data: { action: string, reason: string }) {
    console.log(data.action + ' ' + data.reason)
  }

  calculatePrice(candles: VOCandle[]): number {
    const closes = CandlesAnalys1.closes(candles);
    return _.mean(_.takeRight(closes, 35));  }

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

  async setStopLoss(qty: number, stopPrice: number, sellPrice: number) {
    if (stopPrice === 0 || sellPrice === 0) {
      console.error(' stop price 0');
      return
    }
    console.log(this.market + '  SET STOP LOSS ')
    let result;
    try {
      result = await this.apiPrivate.stopLoss(this.market, qty, stopPrice, sellPrice);
      const reason = ' set stop loss ';
      this.log({action: 'STOP_LOSS RESULT ', reason: result.uuid});
    } catch (e) {
      console.error(e);
    }
    return result
  }

  destroy() {
    this.storage.remove(this.market + '-stop-loss-settings');
  }

  private combineStopLosses(stopLosses: VOOrder[]) {
    console.log(' combine stop losses ', stopLosses);
  }

  save() {

    const data = this.toJSON();
    console.log(this.market + ' save stop loss settings  ', data);
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
