import {MACD} from '../../trader/libs/techind';
import {MACDOutput} from '../../trader/libs/techind/moving_averages/MACD';
import * as _ from 'lodash';

export interface VOSignal {
  action: string;
  reason: string;
}


export class MacdSignal {
  fastPeriod = 12;
  slowPeriod = 26;
  signalPeriod = 9;
  macd: MACD;
  states: VOSignal[] = [];
  lastClose: number;

  tick(closes: number[], time: string): VOSignal {
    const lastClose = _.last(closes);
    const prevClose = closes[closes.length - 2];
    if (lastClose === this.lastClose) return null;
    this.lastClose = lastClose;
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
    const last = result[L - 1];
    const prev = result[L - 2];
    let action: string = null;
    let reason: string = null;

    if (last.histogram > 0 && prev.histogram < 0) {
      action = 'BUY';
      const buyPrice = +((lastClose - prevClose) / 2).toFixed(8);
      reason = time + ' P ' + buyPrice + ' hist ' + last.histogram + ' prev ' + prev.histogram;
    } else if (last.histogram < 0 && prev.histogram > 0) {
      action = 'SELL';
      reason = time + ' hist ' + last.histogram + ' prev ' + prev.histogram;
    }

    if (action) {
      this.states.push({action, reason});
      return {
        action,
        reason,
      };
    }
    return null
    //console.log(result);
  }
}
