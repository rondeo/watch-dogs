import {MACD} from '../../../trader/libs/techind';
import {MACDOutput} from '../../../trader/libs/techind/moving_averages/MACD';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {VOCandle} from '../../../amodels/api-models';
import {CandlesService} from '../candles/candles.service';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import {BuySellState} from './models';


export class MacdSignal {

  static fastPeriod = 12;
  static slowPeriod = 26;
  static signalPeriod = 9;

  // lastClose: number;
  reason: string;
  lastCandle: VOCandle;

  static getState(hists: MACDOutput[]) {
    const L = hists.length;
    const last = hists[L - 1];
    const prev = hists[L - 2];
    if (last.histogram > 0 && prev.histogram < 0) return BuySellState.BUY_NOW;
    if (last.histogram < 0 && prev.histogram > 0) return BuySellState.SELL_NOW;
    if (prev.histogram < last.histogram) return BuySellState.BUY;
    if (last.histogram < prev.histogram) return BuySellState.SELL;
  }

  private macd15m: BehaviorSubject<MACDOutput[]> = new BehaviorSubject([]);

  get macd15m$() {
    return this.macd15m.asObservable();
  }

  private macd1h: BehaviorSubject<MACDOutput[]> = new BehaviorSubject([]);

  get macd1h$() {
    return this.macd1h.asObservable();
  }

  private macd5m: BehaviorSubject<MACDOutput[]> = new BehaviorSubject([]);

  get macd5m$() {
    return this.macd5m.asObservable();
  }

  private macd30m: BehaviorSubject<MACDOutput[]> = new BehaviorSubject([]);

  get macd30m$() {
    return this.macd30m.asObservable();
  }

  static macdInput(closes) {
    return {
      values: closes,
      fastPeriod: MacdSignal.fastPeriod,
      slowPeriod: MacdSignal.slowPeriod,
      signalPeriod: MacdSignal.signalPeriod,
      SimpleMAOscillator: true,
      SimpleMASignal: false
    }
  }

  get state() {
    return this._state.getValue();
  }

  _state: BehaviorSubject<BuySellState> = new BehaviorSubject(BuySellState.NONE);

  get state$() {
    return this._state.asObservable()
  }

  constructor(market: string, candlesService: CandlesService) {

    if (candlesService) {
      /* this.macd15m = new BehaviorSubject([]);
       this.macd1h = new BehaviorSubject([]);
       this.macd30m = new BehaviorSubject<MACDOutput[]>([]);
       this.macd5m = new BehaviorSubject([]);*/

      candlesService.candles1h$(market).subscribe(candles => {

        const closes = CandlesAnalys1.closes(candles);
        const macd: MACDOutput[] = (new MACD(MacdSignal.macdInput(closes))).getResult();

        const state = MacdSignal.getState(macd);

        console.log(market + ' ' + state);

        this.reason = ' by1h ' + state;
        let newState;

        const prevState = this.state;
        if(prevState === BuySellState.BUY && newState === BuySellState.SELL) newState = BuySellState.CHANGE_SELL;
        else if(prevState === BuySellState.SELL && newState === BuySellState.BUY) newState = BuySellState.CHANGE_BUY;
        if (prevState !== newState) this._state.next(newState);
        //  console.log('%c ' + market + '  ' + state, 'color:blue');


      })

      /*candlesService.candles5m$(market).subscribe(candles => {
        const closes = CandlesAnalys1.closes(candles);
        this.macd5m.next((new MACD(this.macdInput(closes))).getResult());

        // console.log(candles);
      });*/

      /* candlesService.candles15min$(market).subscribe(candles => {
         if (!candles.length) return;

         const closes = candlesService.closes(market);

         if (closes.length < 190) throw new Error(' length not enough' + closes.length);


         const macd15m: MACDOutput[] = (new MACD(this.macdInput(closes))).getResult();
         // const macd1h: MACDOutput[] = (new MACD(this.macdInput(closes1h))).getResult();

         const closes1h = CandlesAnalys1.from15mTo1h(closes);
         const macd2: MACDOutput[] = (new MACD(this.macdInput(closes1h))).getResult();

         this.macd15m.next(macd15m);

         this.macd1h.next(macd2);
         // this.macd30m.next(macd30m);


         const state15m = MacdSignal.getState(macd15m);
         const state2 = MacdSignal.getState(macd2);

         this.reason = ' by15m ' + state15m + ' by1h ' + state2;
         let newState;
         if (state15m === BuySellState.BUY_NOW && state2 !== BuySellState.BUY)
           newState = BuySellState.BUY;
         else if (state15m === BuySellState.BUY_NOW && state2 == BuySellState.BUY_NOW)
           newState = BuySellState.BUY_NOW;
         else  if(state2 === BuySellState.SELL_NOW && state15m === BuySellState.SELL ){
           newState = BuySellState.SELL_NOW;
         }
         else {
           newState = state15m;
         }
         const prevState = this.state;

         if(prevState === BuySellState.BUY && newState === BuySellState.SELL) newState = BuySellState.CHANGE_SELL;
         else if(prevState === BuySellState.SELL && newState === BuySellState.BUY) newState = BuySellState.CHANGE_BUY;


         if (prevState !== newState) this._state.next(newState);
         //  console.log('%c ' + market + '  ' + state, 'color:blue');

       })
     }*/
    }
  }

  static getMacd(closes: number[]):  MACDOutput[] {
    const macd = new MACD(MacdSignal.macdInput(closes));
    return macd.getResult();
  }


  /*getHists3(closes: number[]) {
    let macdInput = {
      values: closes,
      fastPeriod: this.fastPeriod,
      slowPeriod: this.slowPeriod,
      signalPeriod: this.signalPeriod,
      SimpleMAOscillator: true,
      SimpleMASignal: false
    };

    this.macd = new MACD(macdInput);
    const result: MACDOutput[] = this.macd.getResult();
    const L = result.length;
    return [result[L - 1].histogram, result[L - 2].histogram, result[L - 3].histogram];
  }

  static tick(closes: number[]) {
    let macdInput = {
      values: closes,
      fastPeriod: this.fastPeriod,
      slowPeriod: this.slowPeriod,
      signalPeriod: this.signalPeriod,
      SimpleMAOscillator: true,
      SimpleMASignal: false
    };

    this.macd = new MACD(macdInput);
    const result: MACDOutput[] = this.macd.getResult();
    const L = result.length;
    const last = _.last(result);
    const prev = result[L - 2];


    const prevState = this.state;
    let newState = BuySellState.NONE;
    this.reason = ' prev ' + prev.histogram.toPrecision(3) + ' last ' + last.histogram.toPrecision(3);

    if (last.histogram > 0 && prev.histogram < 0) newState = BuySellState.BUY_NOW;
    else if (prev.histogram < last.histogram) newState = BuySellState.BUY;
    else if (last.histogram < 0 && prev.histogram > 0) newState = BuySellState.SELL_NOW;
    else if (prev.histogram > last.histogram) newState = BuySellState.SELL;

    if (prevState !== newState) this._state.next(newState);


    return {last, prev};
  }*/
}
