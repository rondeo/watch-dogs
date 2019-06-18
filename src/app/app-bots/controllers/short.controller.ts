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
import {RsiMacdSignal} from './rsi-macd.signal';

export enum ShortSignal {
  NONE = '[ShortSignal] NONE',
  TIME_TO_BUY = '[ShortSignal] TIME_TO_BUY',
  CANCELLING_ORDRERS = '[ShortSignal] CANCELLING_ORDERS',
  SELLING_BALANCE = '[ShortSignal] SELLING_BALANCE',
  SOLD = '[ShortSignal] SOLD',
  CROSS_UP = '[ShortSignal] CROSS_UP'
}

export class ShortController {
  private config: VOWatchdog;
  signal$: BehaviorSubject<ShortSignal> = new BehaviorSubject(ShortSignal.NONE);
  private subs: Subscription[] = [];
  lastStoch: { stochRSI: number, k: number, d: number };
  isSold: boolean;

  rsiMacdSignal: RsiMacdSignal;
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
    let sub: Subscription;

    this.rsiMacdSignal = new RsiMacdSignal(this.bus);
    sub = this.rsiMacdSignal.stoch$.subscribe(signal => {
      if(signal === RsiMacdSignal.RSI_BUY) {
       this.signal$.next(ShortSignal.TIME_TO_BUY);
      }
    });
    this.subs.push(sub);

    sub = combineLatest(this.rsiMacdSignal.stoch$, this.rsiMacdSignal.macd$).subscribe(([rsi,macd]) =>{
      console.log(this.config.id,rsi,macd)
    });
    this.subs.push(sub);


    sub = this.bus.potsBalance$.subscribe(async potsBalance => {
      if (this.signal$.getValue() === ShortSignal.TIME_TO_BUY) {
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
        this.isSold = true;
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
