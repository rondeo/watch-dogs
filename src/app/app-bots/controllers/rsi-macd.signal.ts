import {BotBus} from '../bot-bus';
import {Subscription} from 'rxjs/internal/Subscription';
import {VOWatchdog} from '../../amodels/app-models';
import {CandlesUtils} from '../../a-core/app-services/candles/candles-utils';
import {StochasticRSI} from '../../trader/libs/techind';
import {Subject} from 'rxjs/internal/Subject';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';


export class RsiMacdSignal {
  static NONE = '[RsiMacdSignal] NONE';
  static RSI_BUY = '[RsiMacdSignal] RSI_BUY';
  static RSI_SELL = '[RsiMacdSignal] RSI_SELL';
  static RSI_CROSS_UP = '[RsiMacdSignal] RSI_CROSS_DOWN';
  static RSI_CROSS_DOWN = '[RsiMacdSignal] RSI_CROSS_DOWN';
  static MACD_NEGATIVE = '[RsiMacdSignal] MACD_NEGATIVE';
  static MACD_POSITIVE = '[RsiMacdSignal] MACD_POSITIVE';
  static MACD_CROSS_UP = '[RsiMacdSignal] MACD_CROSS_UP';
  static MACD_CROSS_DOWN = '[RsiMacdSignal] MACD_CROSS_DOWN';

  private subs: Subscription[] = [];
  private config: VOWatchdog;
  stoch$: BehaviorSubject<string> = new BehaviorSubject(RsiMacdSignal.NONE);
  macd$: BehaviorSubject<string> = new BehaviorSubject(RsiMacdSignal.NONE);
  constructor(private bus: BotBus) {
    const sub = bus.config$.subscribe(cfg => this.config = cfg);
    this.subs.push(sub);
    this.init();
  }

  init() {
    let sub = this.bus.candles$.subscribe(candles5m => {
      const closes5m = CandlesUtils.closes(candles5m);
      const closes15m = CandlesUtils.convertCloses5mTo15min(closes5m);
      this.signalRSI(closes15m);
      this.signalMacd(closes15m);
      // const closes30m =  CandlesUtils.convertCloses5mto30min(closes5m);


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

  }

  private signalMacd(closes: number[]) {
    const macd = CandlesUtils.macd(closes);
    const macd_1 = macd[macd.length - 1];
    const macd_2 = macd[macd.length - 2];
    const macd_3 = macd[macd.length - 3];
    // console.log(macd_1.histogram, macd_2.histogram)
    if(macd_1.histogram > macd_2.histogram) {
      this.macd$.next(RsiMacdSignal.MACD_POSITIVE)
    } else {
      this.macd$.next(RsiMacdSignal.MACD_NEGATIVE);
    }
  }


  private signalRSI(closes: number[]){
    const rsi = CandlesUtils.rsi(closes);
    const rsi_1 = rsi[rsi.length - 1];
    const rsi_2 = rsi[rsi.length - 2];
    const rsi_3 = rsi[rsi.length - 3];
    // console.log('%c ' + rsi_2.d + '   ' + rsi_1.d, 'color:red');
    // console.log('%c ' + rsi_2.k + '   ' + rsi_1.k, 'color:blue');

    if(rsi_2.d > rsi_2.k && rsi_1.d < rsi_1.k)  {
      if(rsi_1.d < 30) this.stoch$.next(RsiMacdSignal.RSI_BUY);
      else this.stoch$.next(RsiMacdSignal.RSI_CROSS_UP);

    }
    if(rsi_2.d < rsi_2.k && rsi_1.d > rsi_1.k)  {
      if(rsi_1.d > 70) this.stoch$.next(RsiMacdSignal.RSI_SELL);
      else this.stoch$.next(RsiMacdSignal.RSI_CROSS_DOWN);
    }

  }
  private unsubscribe() {
    this.subs.forEach(function (item) {
      item.unsubscribe();
    })
  }

  destroy(reason: string) {
    this.unsubscribe();
    this.bus = null
  }

}
