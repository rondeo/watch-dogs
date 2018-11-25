import { Indicator, IndicatorInput } from '../indicator/indicator';
/**
 * Created by AAravindan on 5/8/16.
 */

import { WEMA } from '../moving_averages/WEMA';
import { TrueRange } from './TrueRange';

export class ATRInput extends IndicatorInput {
  low: number[];
  high: number[];
  close: number[];
  period: number;
}

export class ATR extends Indicator {
  constructor(input: ATRInput) {
    super(input);
    let lows = input.low;
    let highs = input.high;
    let closes = input.close;
    let period = input.period;
    let format = this.format;

    if (!((lows.length === highs.length) && (highs.length === closes.length) )) {
      throw new Error(('Inputs(low,high, close) not of equal size'));
    }

    let trueRange = new TrueRange({
      low : [],
      high: [],
      close: []
    });


    let wema = new WEMA({period : period, values : [], format : (v) => v});


    this.result = [];

    this.generator = (function* () {
      let tick = yield;
      let avgTrueRange, trange;
      while (true) {
        trange = trueRange.nextValue({
          low : tick.low,
          high : tick.high,
          close : tick.close
        });
        if (trange === undefined) {
          avgTrueRange = undefined;
        } else {
          avgTrueRange = wema.nextValue(trange);
        }
        tick = yield avgTrueRange;
      }
    })();

    this.generator.next();

    lows.forEach((tick, index) => {
      let result = this.generator.next({
        high : highs[index],
        low  : lows[index],
        close : closes[index]
      });
      if (result.value !== undefined) {
        this.result.push(format(result.value));
      }
    });
  }


  static calculate = atr;
  result: number[];
  generator: IterableIterator<number | undefined>;

  nextValue(price: number): number | undefined {
      return this.generator.next(price).value;
  }}


export function atr(input: ATRInput): number[] {
  Indicator.reverseInputs(input);
  let result = new ATR(input).result;
  if (input.reversedInput) {
      result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
