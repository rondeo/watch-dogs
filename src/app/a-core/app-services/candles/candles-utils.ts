import {VOCandle} from '../../../amodels/api-models';
import {MATH} from '../../../acom/math';
import * as _ from 'lodash';
import {MACD, StochasticRSI} from '../../../trader/libs/techind';
import {MACDOutput} from '../../../trader/libs/techind/moving_averages/MACD';

export class CandlesUtils {

  static volumes(candles: VOCandle[]): number[] {
    return candles.map(function (o) {
      return o.Volume;
    })
  }

  static closes(candles: VOCandle[]): number[] {
    return candles.map(function (o) {
      return o.close;
    })
  }

  static vols(volumes: number[]) {
    const med = MATH.median(_.takeRight(volumes, 99));
    const last = _.last(volumes);
    const v7 = _.mean(_.takeRight(volumes, 7));
    const v3 = _.mean(_.takeRight(volumes, 3));
    const v25 = _.mean(_.takeRight(volumes, 25));

    return {
      v3,
      v7,
      v25,
      med,
      last
    };
  }

  static mas(closes: number[]) {
    const ma99 = _.mean(_.takeRight(closes, 99));
    const ma7 = _.mean(_.takeRight(closes, 7));
    const ma3 = _.mean(_.takeRight(closes, 3));
    const ma25 = _.mean(_.takeRight(closes, 25));

    return {
      last: _.last(closes),
      ma3,
      ma7,
      ma25,
      ma99
    };
  }

  static convertCloses5mto30min(closes: number[]) {
    closes.reverse();
    const out = [];
    for(let i = 0, n = closes.length; i<n; i+=6) {
      out.push(closes[i]);
    }
    out.reverse();
    return out;
  }

  static convertCloses5mTo15min(closes: number[]) {
    closes.reverse();
    const out = [];
    for(let i = 0, n = closes.length; i<n; i+=3) {
      out.push(closes[i]);
    }
    out.reverse();
    return out;
  }

  static rsi(values: number[], rsiPeriod=14, stochasticPeriod=14, kPeriod=3, dPeriod=3): {stochRSI: number, k: number, d: number}[] {
    const inputRSI = {
      values,
      rsiPeriod,
      stochasticPeriod,
      kPeriod,
      dPeriod
    };
    const stochRSI = new StochasticRSI(inputRSI);
    return  stochRSI.getResult();
  }

  static macd(values: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): MACDOutput[] {
    let macdInput = {
      values,
      fastPeriod,
      slowPeriod,
      signalPeriod,
      SimpleMAOscillator: true,
      SimpleMASignal: false
    };

    let macd = new MACD(macdInput);
    return macd.getResult();
  }
}



