import {
  Action,
  BuyOrderSet,
  ControllerType,
  SetBuyOrder,
  Shorting,
  TaskController,
  TaskDone,
  TaskName,
  TaskNone,
  TimeToBuy
} from './models';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {BotBus} from '../bot-bus';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {ApiPrivateAbstaract} from '../../a-core/apis/api-private/api-private-abstaract';
import {Subscription} from 'rxjs/internal/Subscription';
import {CandlesUtils} from '../../a-core/app-services/candles/candles-utils';
import {StochasticRSI} from '../../trader/libs/techind';
import {VOWatchdog, WDType} from '../../amodels/app-models';
import {filter, withLatestFrom} from 'rxjs/operators';
import {BuySellCommands} from './buy-sell.commands';

export enum ShortSignal {
  NONE = '[ShortSignal] NONE',
  TIME_TO_BUY = '[ShortSignal] TIME_TO_BUY',
  CANCELLING_ORDRERS= '[ShortSignal] CANCELLING_ORDERS',
  SELLING_BALANCE =  '[ShortSignal] SELLING_BALANCE',
  SOLD = '[ShortSignal] SOLD'
}

export class ShortController {
  private config: VOWatchdog;
  signal$: BehaviorSubject<ShortSignal> = new BehaviorSubject(ShortSignal.NONE);
  private subs: Subscription[] = [];
  lastStoch: { stochRSI: number, k: number, d: number };

  private buyStrength: number;

  constructor(private bus: BotBus, private commands: BuySellCommands) {
    console.log('%c ' + bus.id + ' ShortController ', 'color:red');
    const sub = bus.config$.subscribe(config => this.config = config);
    this.subs.push(sub);
    if (this.config.wdType !== WDType.SHORT) throw new Error(' not my type');
    this.init();
  }


  private init() {
    console.log('%c STARTING SHORT ' + this.bus.market, 'color:red');
    let sub = this.bus.candles$.subscribe(candles5m => {
      const closes5m = CandlesUtils.closes(candles5m);
      const closes15m = CandlesUtils.convertCloses5mTo15min(closes5m);

      // const closes30m =  CandlesUtils.convertCloses5mto30min(closes5m);

      const input = {
        values: closes15m,
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3
      };

      const stochRSI = new StochasticRSI(input);
      const results: { stochRSI: number, k: number, d: number }[] = stochRSI.getResult();

      const lastStoch = results[results.length - 1];
      const preLastStoch = results[results.length - 2];
      const prepreLastStoch = results[results.length - 3];

      // console.log('%c ' + preLastStoch.d + '   ' + lastStoch.d, 'color:red');
      // console.log('%c ' + preLastStoch.k + '   ' + lastStoch.k, 'color:blue');
      if (preLastStoch.d > preLastStoch.k && lastStoch.d < lastStoch.k && lastStoch.d < 50) {
        console.log('%c  ' + this.config.id + ' TIME_TO_BUY ', 'color:red');
          if(this.signal$.getValue() === ShortSignal.SOLD) this.signal$.next(ShortSignal.TIME_TO_BUY);
      }
      /*
       const macd30m  = CandlesUtils.macd(closes30m);
       const last = macd30m[macd30m.length - 1];
       const preLast = macd30m[macd30m.length - 2];

        if(last.histogram > 0 && preLast.histogram < 0) {
          this.status.next('BUY_NOW');
        } if(last.histogram < 0 && preLast.histogram > 0) {
          this.status.next('SELL_NOW');
        } else if(last.histogram > preLast.histogram) {
          this.status.next('GOING_UP');
        } else {
          this.status.next('GOING_DOWN')
        }
  */

    });

    this.subs.push(sub);
    sub = this.bus.potsBalance$.subscribe(async potsBalance => {
      if(this.signal$.getValue() === ShortSignal.TIME_TO_BUY) {
        console.log(' not selling because time to buy ');
        return
      }
      if (potsBalance) {
        if (this.bus.openOrders.length) {
          console.log(' cancelling all open orders ');
          this.signal$.next(ShortSignal.CANCELLING_ORDRERS);
          await this.commands.cancelOrdersPromise(this.bus.openOrders);
        }

        const market = this.config.market;
        console.log(' Selling balance on short');
        this.signal$.next(ShortSignal.SELLING_BALANCE);
        this.commands.sellCoinInstant(market, this.bus.balanceCoin.available).then(res => {
          console.log(' balance sold result ', res);
        })
      } else {
        this.signal$.next(ShortSignal.SOLD);
      }
    });

    this.subs.push(sub);
  }


  destroy(reason: string): void {
    console.log(' destroy ' + reason);
    this.subs.forEach(function (sub) {
      sub.unsubscribe();
    });

    this.bus = null;
    this.commands = null;
  }

}
