import {BotBus} from '../bot-bus';
import {TaskName, TimeToBuy} from './models';
import {CandlesUtils} from '../../a-core/app-services/candles/candles-utils';
import {StochasticRSI} from '../../trader/libs/techind';
import {Subject} from 'rxjs/internal/Subject';



export class BuySignal {
  signal$: Subject<string> = new Subject();
  candlesSub
  constructor(private bus: BotBus) {
    console.log('%c ' + bus.id + ' BuySignal  ', 'color:red');

    this.candlesSub =  bus.candles$.subscribe(candles5m => {

      const closes5m = CandlesUtils.closes(candles5m);
      const closes15m = CandlesUtils.convertCloses5mTo15min(closes5m);
       const closes30m =  CandlesUtils.convertCloses5mto30min(closes5m);

      const inputRSI = {
        values: closes15m,
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3
      };


      const results = CandlesUtils.rsi(closes15m);

      const lastStoch = results[results.length -1];
      const preLastStoch = results[results.length -2];

    //  console.log('%c ' + preLastStoch.d + '   ' + lastStoch.d, 'color:red');
     // console.log('%c ' + preLastStoch.k + '   ' + lastStoch.k, 'color:blue');

      const macd30m  = CandlesUtils.macd(closes30m);

      const lastMACD = macd30m[macd30m.length - 1];
      const preLastMACD = macd30m[macd30m.length - 2];

      if(lastMACD.histogram > 0 && preLastMACD.histogram < 0) {
       console.log(' buy now by MACD')
      } if(lastMACD.histogram < 0 && preLastMACD.histogram > 0) {
        console.log('SELL_NOW');
      } else if(lastMACD.histogram > preLastMACD.histogram) {
        console.log('GOING_UP');
      } else {
        console.log('GOING_DOWN');
      }


      if(preLastStoch.d > preLastStoch.k &&  lastStoch.d < lastStoch.k ) {
        console.log('%c  ' + bus.id +  ' BUY ', 'color:red');
        this.signal$.next('BUY_NOW');
      } else {

        this.signal$.next('d' + preLastStoch.d.toFixed(1) + ' -> '
          + lastStoch.d.toFixed(1) +' k' + preLastStoch.k.toFixed(1)
          + ' -> ' + lastStoch.k.toFixed(1));
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
  }

  destroy() {
    this.bus = null;
    this.candlesSub.unsubscribe();
  }
}
