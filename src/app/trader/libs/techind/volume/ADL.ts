/**
 * Created by AAravindan on 5/17/16.
 */
import { Indicator, IndicatorInput } from '../indicator/indicator';
import { CandleData } from '../StockData';

export class ADLInput extends IndicatorInput {
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

export class ADL extends Indicator {
    constructor (input: ADLInput) {
      super(input);
      let highs       = input.high;
      let lows        = input.low;
      let closes      = input.close;
      let volumes     = input.volume;

      if (!((lows.length === highs.length) && (highs.length === closes.length) && (highs.length === volumes.length) )) {
        throw new Error(('Inputs(low,high, close, volumes) not of equal size'));
      }

      this.result = [];

      this.generator = (function* () {
        let result = 0;
        let tick;
        tick = yield;
        while (true) {
          let moneyFlowMultiplier = ((tick.close  -  tick.low) - (tick.high - tick.close)) / (tick.high - tick.low);
          moneyFlowMultiplier = isNaN(moneyFlowMultiplier) ? 1 : moneyFlowMultiplier;
          let moneyFlowVolume = moneyFlowMultiplier * tick.volume;
          result = result + moneyFlowVolume;
          tick = yield Math.round(result);
        }
      })();

      this.generator.next();

      highs.forEach((tickHigh, index) => {
        let tickInput = {
          high    : tickHigh,
          low     : lows[index],
          close   : closes[index],
          volume  : volumes[index]
        };
        let result = this.generator.next(tickInput);
        if (result.value !== undefined) {
          this.result.push(result.value);
        }
      });
  }


  static calculate = adl;
  generator: IterableIterator<number | undefined>;

  nextValue(price: CandleData): number | undefined {
     return this.generator.next(price).value;
  }}

export function adl(input: ADLInput): number[] {
      Indicator.reverseInputs(input);
      let result = new ADL(input).result;
      if (input.reversedInput) {
          result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
  }
