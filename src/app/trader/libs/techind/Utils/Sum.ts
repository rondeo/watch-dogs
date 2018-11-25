
import { Indicator, IndicatorInput } from '../indicator/indicator';
import FixedSizedLinkedList from './FixedSizeLinkedList';
import { CandleData } from '../StockData';

export class SumInput extends IndicatorInput {
  values: number[];
  period: number;
}

export class Sum extends Indicator {
    constructor (input: SumInput) {
      super(input);
      let values     = input.values;
      let period     = input.period;

      this.result = [];

      let periodList = new FixedSizedLinkedList(period, false, false, true);

      this.generator = (function* () {
        let result;
        let tick;
        let high;
        tick = yield;
        while (true) {
          periodList.push(tick);
          if (periodList.totalPushed >= period) {
            high = periodList.periodSum;
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


  static calculate = sum;
  generator: IterableIterator<number | undefined>;

  nextValue(price: number): number | undefined {
     let result =  this.generator.next(price);
     if (result.value !== undefined) {
        return result.value;
      }
  }}

export function sum(input: SumInput): number[] {
      Indicator.reverseInputs(input);
      let result = new Sum(input).result;
      if (input.reversedInput) {
          result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
  }
