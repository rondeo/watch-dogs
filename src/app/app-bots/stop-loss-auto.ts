import {VOBalance, VOOrder, VOWatchdog, WDType} from '../amodels/app-models';
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
import {cancelOrders} from './controllers/cancel-orders';
import {config} from 'rxjs/internal-compatibility';


export interface StopLossSettings {
  stopLossPercent: number;
  sellPercent: number;
  resetStopLossAt: number;
  disabled: boolean;
  auto: boolean;
}

export const STOP_LOSS_DEFAULT: StopLossSettings = {
  stopLossPercent: -3,
  sellPercent: -2,
  resetStopLossAt: 3,
  disabled: false,
  auto: false
};

export class StopLossAuto {
  color: string = 'color:blue';
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
    const stopPrice = StopLossAuto.getStopPrice(lowerPrice, stopLossPercent);
    const sellPrice = StopLossAuto.getSellPrice(stopPrice, sellPercent);
    return {
      stopPrice,
      sellPrice
    }
  }

  stopLossDefault: StopLossSettings = {
    stopLossPercent: -3,
    sellPercent: -2,
    resetStopLossAt: 3,
    disabled: false,
    auto: false
  };

  config: VOWatchdog;
  private market: string;
  private settings: StopLossSettings;
  state$: BehaviorSubject<string> = new BehaviorSubject('NONE');

  stopped: boolean;

  constructor(
    private apiPrivate: ApiPrivateAbstaract,
    private bus: BotBus
  ) {

     let market: string;
     bus.config$.subscribe(config => {
       market = config.market;
       this.config = config;
       this.settings = Object.assign(this.stopLossDefault, config.stopLoss);
       if(this.settings.auto) this.startCancelOnUP();
       else this.stopCancelOnUP();
     });

     this.market = market;
     console.log('%c  creating new stop loss auto ',this.color);

     let sub;
      sub = bus.mas$.pipe(withLatestFrom(bus.balanceCoin$, bus.ordersOpen$))

       .subscribe(([mas, balanceCoin, openOrders]) => {

         if(this.stopped) return;
         console.log('%c ' + this.config.id+ ' new  MAS  ', this.color);
         const stopLosses = openOrders.filter(function (item) {
           return item.stopPrice;
         });

         if (this.settings.disabled) {
           console.log('%c STOP_LOSS_DISABLED', this.color);
           if(stopLosses.length) cancelOrders(stopLosses, this.apiPrivate, this.bus).subscribe((r) => console.log(r))

           return;
         }
         if(balanceCoin.balance < this.config.potSize / 10) {
           console.log('%c ' + this.config.id + ' NO BALANCE ON COIN ', this.color);
           return;
         }



         if (stopLosses.length > 1) {
           console.log('%c ' + this.config.id + ' ERROR  DOUBLE STOP_LOSS ', this.color);
           cancelOrders(stopLosses, this.apiPrivate, this.bus).subscribe((r) => console.log(r))
           return;
         }


         const available = balanceCoin.available;

         if(available > (this.config.potSize / 10)) {

           console.log('%c ' + this.config.id + ' NEED STOP_LOSS', this.color);
           if(stopLosses.length) {
             console.log(this.config.id + ' CANCEL EXISTING  STOP_LOSS to create new ')
             cancelOrders(stopLosses, this.apiPrivate, this.bus).subscribe((r) => console.log(r));
             return;
           }

           console.log('%c ' + this.config.id + ' SENDING STOP_LOSS', this.color);

           const prices = StopLossAuto.getStopLossPrices(mas, this.settings.stopLossPercent, this.settings.sellPercent);

           if(this.config.liquidPrice) prices.stopPrice = this.config.liquidPrice;

           if(this.bus.isDirty) return;
           this.bus.isDirty = true;
           this.apiPrivate.stopLoss(this.market, available, prices.stopPrice, prices.sellPrice)
             .then(res => {

               console.log(market + ' STOP LOSS RESULT ', res);
             }).catch(err => {
            //  this.bus.log('STOP_LOSS ERROR ' + err.message);
             console.error(market, err)

           }).finally(() => {
             this.inProgress = false;
           });

           UTILS.wait(20).then(() => {
            // this.apiPrivate.refreshBalancesNow();
           });

           return;

         }

         if(stopLosses.length !== 1) {
           console.error(' ERROR STOP_LOSS SHOULD BE 1 ');
           return;
         }


         const stopLoss = stopLosses[0];

         if (MATH.percent(stopLoss.amountCoin, balanceCoin.balance) < -1) {
           console.log(this.market + ' ERROR  not all balance in STOP_LOSS ' + MATH.percent(stopLoss.amountCoin, balanceCoin.balance));
           return;
         }

       });
     this.subs.push(sub);
  }

  log(data: { action: string, reason: string }) {
    console.log(data.action + ' ' + data.reason)
  }

  subCreate: Subscription

  startCreatestopLoss() {

  }

  stopCreateCtopLoss() {
    if(this.subCreate) this.subCreate.unsubscribe();
  }

  subAuto: Subscription;
  stopCancelOnUP() {
    console.log(this.config.id + ' stop auto UP');
    if(this.subAuto) this.subAuto.unsubscribe()
    this.subAuto = null;
  }

  startCancelOnUP() {
    console.log(this.config.id + ' start auto UP');
    if(this.subAuto) this.subAuto.unsubscribe();
    if(!this.bus) return;
    this.subAuto =  this.bus.mas$.pipe(
      withLatestFrom(this.bus.balanceCoin$, this.bus.ordersOpen$)
    )
      .subscribe(([mas, balanceCoin, openOrders]) => {

        if(this.stopped) return;
        const stopLosses = openOrders.filter(function (item) {
          return item.stopPrice;
        });

        if(stopLosses.length !==1) {
          console.log(' ERROR move stop loss length: '+ stopLosses.length);
          return;
        }

        const stopLoss = stopLosses[0];

        const prices = StopLossAuto.getStopLossPrices(mas, this.settings.stopLossPercent, this.settings.sellPercent);

        if (!stopLoss) return;

        const diff = MATH.percent(prices.stopPrice, stopLoss.stopPrice);
        console.log('%c ' + this.config.id + ' STOP_LOSS diff ' + diff, 'color: green ');
        if (diff > this.settings.resetStopLossAt) {
          this.inProgress = true;
          UTILS.wait(20).then(() => {
            this.inProgress = false;
          });

          console.log('%c ' + this.market + ' reset stopLoss ', 'color:red');   //  this.priceStopLoss$.next(0)
          if(this.bus.isDirty) return;
          this.bus.isDirty = true;
          cancelOrders([stopLoss], this.apiPrivate, this.bus).subscribe(res => {
              console.log(' cancel order result', res);
            },
            err => {
              console.log('ERROR ', err)
            },
            () => {
              this.apiPrivate.refreshAllOpenOrders();
            }
          )
        }

      })
  }

  unsubscribe() {
    this.subs.forEach(function (item) {
      item.unsubscribe();
    })
    this.subs = [];
  }
  destroy() {
    this.apiPrivate = null;
    this.bus = null;
    this.unsubscribe();
  }

  cancelAndStop() {
    this.stopped = true;
    if(this.bus.stopLossOrders) {
      cancelOrders(this.bus.stopLossOrders, this.apiPrivate, this.bus)
    }

  }

  resume() {
    this.stopped = false;
  }
}
