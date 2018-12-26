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
  macd: MACD;
  states: VOSignal[] = [];
  // lastClose: number;
  reason: string;

  lastCandle: VOCandle;
  state$: BehaviorSubject<BuySellState> = new BehaviorSubject(BuySellState.NONE);

  constructor(market: string, candlesService: CandlesService) {
    if(candlesService){
      candlesService.closes15m$(market).asObservable().subscribe(closes =>{
        if(!closes.length) return;
        const state = this.tick(closes);
        console.log('%c ' + market + '  ' + state, 'color:blue');

      })
    }
  }

  getHists3(closes: number[]) {
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

  tick(closes: number[]): BuySellState {
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


    const prevState = this.state$.getValue();
    let newState = BuySellState.NONE;
    this.reason = ' prev ' + prev.histogram.toPrecision(3) + ' last ' + last.histogram.toPrecision(3);

    if (last.histogram > 0 && prev.histogram < 0) newState = BuySellState.BUY_NOW;
    else if (prev.histogram < last.histogram) newState = BuySellState.BUY;
    else if (last.histogram < 0 && prev.histogram > 0) newState = BuySellState.SELL_NOW;
    else if (prev.histogram > last.histogram) newState = BuySellState.SELL;

    if (prevState !== newState) this.state$.next(newState);


    return newState;
  }
}
