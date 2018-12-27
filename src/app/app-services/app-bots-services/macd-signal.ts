import {MACD} from '../../trader/libs/techind';
import {MACDOutput} from '../../trader/libs/techind/moving_averages/MACD';
import * as _ from 'lodash';
import {BoundEvent} from '@angular/compiler/src/render3/r3_ast';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {VOCandle} from '../../models/api-models';
import * as moment from 'moment';
import {CandlesService} from '../candles/candles.service';
import {CandlesAnalys1} from '../scanner/candles-analys1';

export interface VOSignal {
  action: string;
  reason: string;
}

export enum BuySellState {
  NONE = 'NONE',
  BUY = 'BUY',
  SELL = 'SELL',
  BUY_NOW = 'BUY_NOW',
  SELL_NOW = 'SELL_NOW',
  SELL_ON_JUMP = 'SELL_ON_JUMP'
}

export class MacdSignal {
  fastPeriod = 12;
  slowPeriod = 26;
  signalPeriod = 9;

  // lastClose: number;
  reason: string;
  lastCandle: VOCandle;

  macdInput(closes){
    return {
      values: closes,
      fastPeriod: this.fastPeriod,
      slowPeriod: this.slowPeriod,
      signalPeriod: this.signalPeriod,
      SimpleMAOscillator: true,
      SimpleMASignal: false
    }
  }
  get state(){
    return this._state.getValue();
  }
  _state: BehaviorSubject<BuySellState> = new BehaviorSubject(BuySellState.NONE);
  get state$(){
    return this._state.asObservable()
  }

  constructor(market: string, candlesService: CandlesService) {
    if(candlesService){
      candlesService.candles15min$(market).asObservable().subscribe(candles =>{
        if(!candles.length) return;

        const closes = candlesService.closes(market);

        if(closes.length <190) throw new Error(' length not enough' + closes.length);
        const closes1h = CandlesAnalys1.from15mTo1h(closes);

        const macd15m: MACDOutput[] = (new MACD(this.macdInput(closes))).getResult();
        const macd1h: MACDOutput[] = (new MACD(this.macdInput(closes1h))).getResult();

        const L1 = macd15m.length;
        const L2 = macd1h.length;

        const last15m = macd15m[L1-1];
        const prev15m = macd15m[L1-2];
        const last1h = macd1h[L2-1];
        const prev1h = macd1h[L2-2];

        let newState = BuySellState.NONE;
        const prevState = this.state;

        this.reason = ' last '+(last15m.histogram > 0) + ' prev '
          +(prev15m.histogram < 0) +' 1h ' + (last1h.histogram > prev1h.histogram)
        + ' 15m ' +  (last15m.histogram > prev15m.histogram);
        console.log(market + this.reason);

        if (last15m.histogram > 0 && prev15m.histogram < 0 && last1h.histogram > prev1h.histogram) newState = BuySellState.BUY_NOW;
        else if (prev15m.histogram < last15m.histogram) newState = BuySellState.BUY;
        else if (last15m.histogram < 0 && prev15m.histogram > 0) newState = BuySellState.SELL_NOW;
        else if (last15m.histogram < prev15m.histogram) newState = BuySellState.SELL;

        if (prevState !== newState) this._state.next(newState);





       //  console.log('%c ' + market + '  ' + state, 'color:blue');

      })
    }
  }

  getHists3(closes: number[]) {
    const macd = new MACD(this.macdInput(closes));
    const result: MACDOutput[] = macd.getResult();
    const L = result.length;
    return [result[L - 1].histogram, result[L - 2].histogram, result[L - 3].histogram];
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
