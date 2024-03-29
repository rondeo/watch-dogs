import { CandleData } from '../StockData';
import { Indicator, IndicatorInput } from '../indicator/indicator';

export class TrueRangeInput extends IndicatorInput {
  low: number[];
  high: number[];
  close: number[];
}

export class TrueRange extends Indicator {
  constructor(input: TrueRangeInput) {
    super(input);
    let lows = input.low;
    let highs = input.high;
    let closes = input.close;
    let format = this.format;

    if (lows.length !== highs.length) {
      throw new Error(('Inputs(low,high) not of equal size'));
    }

    this.result = [];

    this.generator = (function* () {
      let current: CandleData = yield;
      let previousClose, result;
      while (true) {
        if (previousClose === undefined) {
          previousClose = current.close;
          current = yield result;
        }
        result = Math.max(
            current.high - current.low,
            isNaN(Math.abs(current.high - previousClose)) ? 0 : Math.abs(current.high - previousClose),
            isNaN(Math.abs(current.low - previousClose)) ? 0 : Math.abs(current.low - previousClose)
        );
        previousClose = current.close;
        if (result !== undefined) {
          result = format(result);
        }
        current = yield result;
      }
    })();

    this.generator.next();

    lows.forEach((tick, index) => {
      let result = this.generator.next({
        high : highs[index],
        low  : lows[index],
        close: closes[index]
      });
      if (result.value !== undefined) {
        this.result.push(result.value);
      }
    });
  }


  static calculate = truerange;
  result: number[];
  generator: IterableIterator<number | undefined>;

  nextValue(price: CandleData): number | undefined {
     return this.generator.next(price).value;
  }
}

export function truerange(input: TrueRangeInput): number[] {
    Indicator.reverseInputs(input);
    let result = new TrueRange(input).result;
    if (input.reversedInput) {
        result.reverse();
    }
    Indicator.reverseInputs(input);
    return result;
}
