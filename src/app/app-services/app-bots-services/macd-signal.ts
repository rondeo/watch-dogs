import {MACD} from '../../trader/libs/techind';
import {MACDOutput} from '../../trader/libs/techind/moving_averages/MACD';
import * as _ from 'lodash';
import {BoundEvent} from '@angular/compiler/src/render3/r3_ast';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {VOCandle} from '../../models/api-models';
import * as moment from 'moment';

export interface VOSignal {
  action: string;
  reason: string;
}

export enum BuySellState {
  NONE = 'NONE',
  BUY = 'BUY',
  SELL = 'SELL',
  BUY_NOW = 'BUY_NOW',
  SELL_NOW = 'SELL_NOW'
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


  price: number;

  tick(closes: number[], lastCandle: VOCandle): BuySellState {

    if (this.lastCandle && this.lastCandle.to === lastCandle.to) {
      return;
    }
    if(this.lastCandle){
      const diff = moment(lastCandle.to).diff(this.lastCandle.to, 'minutes');
      console.log(' diff ', diff);
      if (diff > 16) {
        console.error(this.lastCandle, lastCandle)
      }
    }

    this.lastCandle = lastCandle;

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


    this.reason = ' prev ' + prev.histogram.toPrecision(3) + ' last ' + last.histogram.toPrecision(3) + ' ' + moment(lastCandle.to).format('HH:mm');
    this.price = +((lastCandle.close + lastCandle.open) / 2).toFixed(8);

    if (last.histogram > 0 && prev.histogram < 0) newState = BuySellState.BUY_NOW;
    else if (prev.histogram < last.histogram) newState = BuySellState.BUY;
    else if (last.histogram < 0 && prev.histogram > 0) newState = BuySellState.SELL_NOW;
    else if (prev.histogram > last.histogram) newState = BuySellState.SELL;


    if (prevState !== newState) this.state$.next(newState);


    return newState;
  }
}
