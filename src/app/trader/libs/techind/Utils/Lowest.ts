
import { Indicator, IndicatorInput } from '../indicator/indicator';
import FixedSizedLinkedList from './FixedSizeLinkedList';
import { CandleData } from '../StockData';

export class LowestInput extends IndicatorInput {
  values: number[];
  period: number;
}

export class Lowest extends Indicator {
    constructor (input: LowestInput) {
      super(input);
      let values     = input.values;
      let period     = input.period;

      this.result = [];

      let periodList = new FixedSizedLinkedList(period, false, true, false);

      this.generator = (function* () {
        let result;
        let tick;
        let high;
        tick = yield;
        while (true) {
          periodList.push(tick);
          if (periodList.totalPushed >= period) {
            high = periodList.periodLow;
          }
          tick = yield high;
        }
      })();

      this.generator.next();

      values.forEach((value, index) => {
        let result = this.generator.next(value);
        if (result.value !== undefined) {
          this.result.push(result.value);
        }
      });
  }


  static calculate = lowest;
  generator: IterableIterator<number | undefined>;

  nextValue(price: number): number | undefined {
     let result =  this.generator.next(price);
     if (result.value !== undefined) {
        return result.value;
      }
  }}

export function lowest(input: LowestInput): number[] {
      Indicator.reverseInputs(input);
      let result = new Lowest(input).result;
      if (input.reversedInput) {
          result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
  }
