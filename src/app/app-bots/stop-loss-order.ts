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
import {Subscription} from 'rxjs/internal/Subscription';

export interface StopLossSettings {
  stopLossPercent: number;
  sellPercent: number;
  resetStopLossAt: number;
  disabled: boolean
}


export class StopLossOrder {
  subs: Subscription[] = [];
  stopLossOrder$: BehaviorSubject<VOOrder> = new BehaviorSubject(null);
  inProgress = false;

  static getStopPrice(ma: number, stopPercent: number): number {
    return +(ma + (ma * (stopPercent / 100))).toPrecision(6);
  }

  static getSellPrice(stopPrice: number, sellPercent: number): number {
    return +(stopPrice + (stopPrice * (sellPercent / 100))).toPrecision(6);
  }

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
    private settings: StopLossSettings,
    private apiPrivate: ApiPrivateAbstaract,
    private bus: BotBus
    // private storage: StorageService
  ) {


    console.log(market + '  creating new stop loss controller ');


    let sub = bus.mas$.pipe(withLatestFrom(bus.balanceCoin$, bus.ordersOpen$))

      .subscribe(([mas, balanceCoin, openOrders]) => {
       // console.log(this.market + ' open orders ', openOrders);

        const stopLosses = openOrders.filter(function (item) {
          return item.stopPrice;
        });


        if (stopLosses.length === 0) {
          console.log(this.market + ' NEED STOP_LOSS ');
          const pending = balanceCoin.pending;
          if (pending) {
            console.log(' error pending but no open orders ');
            this.apiPrivate.refreshAllOpenOrders();
            return;
          }

          const available = balanceCoin.available;
          if (!available) {
            console.log(' ERROR no available ', balanceCoin);
            return;
          }

          const prices = StopLossOrder.getStopLossPrices(mas, this.settings.stopLossPercent, this.settings.sellPercent);
          this.apiPrivate.stopLoss(this.market, available, prices.stopPrice, prices.sellPrice)
            .then(res => {
              this.bus.log('STOP_LOSS RESULT ' + JSON.stringify(res));
              console.log(market + ' STOP LOSS RESULT ', res);
            }).catch(err => {
            this.bus.log('STOP_LOSS ERROR ' + err.message);
            console.error(market, err)

          }).finally(() => {
            this.inProgress = false;
          });

          UTILS.wait(20).then(() => {
            this.apiPrivate.refreshBalancesNow();
          });

          return;
        }

        if (stopLosses.length > 1) {
          console.log(this.market + ' ERROR  DOUBLE STOP_LOSS ');

          const uids = stopLosses.map(function (item) {
            return item.uuid;
          });

          this.cancelOrders(uids);
          return;
        }

        const stopLoss = stopLosses[0];

        if (MATH.percent(stopLoss.amountCoin, balanceCoin.balance) < -1) {
          console.log(this.market + ' ERROR  not all balance in STOP_LOSS ' + MATH.percent(stopLoss.amountCoin, balanceCoin.balance));
          return;
        }


        const b = balanceCoin.balance;

        if (!b) {
          console.log(market + ' no balance  ');
          return;
        }

        const prices = StopLossOrder.getStopLossPrices(mas, this.settings.stopLossPercent, this.settings.sellPercent);

        if (!stopLoss) return;

        const diff = MATH.percent(prices.stopPrice, stopLoss.stopPrice);
        console.log('%c ' + market + ' STOP_LOSS diff ' + diff, 'color: green ');
        if (diff > this.settings.resetStopLossAt) {
          this.inProgress = true;
          UTILS.wait(20).then(() => {
            this.inProgress = false;
          });

          this.bus.log('CANCEL OLD STOP_LOSS diff: ' + diff + '  resetStopLossAt ' + this.settings.resetStopLossAt)
          console.log('%c ' + this.market + ' reset stopLoss ', 'color:red');   //  this.priceStopLoss$.next(0)
          this.cancelOrders([stopLoss.uuid]).then(res => {
            this.bus.log('CANCEL OLD STOP_LOSS RESULT ' + JSON.stringify(res))
            console.log(' cancel order result', res);
          }).catch(console.error)
        }
      });
    this.subs.push(sub);
  }

  log(data: { action: string, reason: string }) {
    console.log(data.action + ' ' + data.reason)
  }

  async cancelOrders(uuids: string[]) {
   const uuid = uuids.shift();
   if(!uuid) return;
    setTimeout(() =>this.cancelOrders(uuids), 20000);
    console.log(this.market + ' CANCEL STOP LOSS ' + uuid);
    const ar = this.market.split('_');
    return this.apiPrivate.cancelOrder(uuid, ar[0], ar[1]).toPromise();
  }

  destroy() {
    this.apiPrivate = null;
    this.bus = null;
    this.subs.forEach(function (item) {
      item.unsubscribe();
    })

  }
}
