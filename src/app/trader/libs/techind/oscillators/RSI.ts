/**
 * Created by AAravindan on 5/5/16.
 */

import { Indicator, IndicatorInput } from '../indicator/indicator';
import { AverageGain } from '../Utils/AverageGain';
import { AverageLoss } from '../Utils/AverageLoss';

export class RSIInput extends IndicatorInput {
  period: number;
  values: number[];
}

export class RSI extends Indicator {

  constructor(input: RSIInput) {
    super(input);

    let period1 = input.period;
    let values = input.values;

    let GainProvider = new AverageGain({ period: period1, values: [] });
    let LossProvider = new AverageLoss({ period: period1, values: [] });
    let count = 1;
    this.generator = (function* (period) {
      let current = yield;
      let lastAvgGain, lastAvgLoss, RS, currentRSI;
      while (true) {
        lastAvgGain = GainProvider.nextValue(current);
        lastAvgLoss = LossProvider.nextValue(current);
        if ((lastAvgGain !== undefined) && (lastAvgLoss !== undefined)) {
          if (lastAvgLoss === 0) {
            currentRSI = 100;
          } else if (lastAvgGain === 0 ) { 
            currentRSI = 0;
          } else {
            RS = lastAvgGain / lastAvgLoss;
            RS = isNaN(RS) ? 0 : RS;
            currentRSI = parseFloat((100 - (100 / (1 + RS))).toFixed(2));
          }
        }
        count++;
        current = yield currentRSI;
      }
    })(period1);

    this.generator.next();

    this.result = [];

    values.forEach((tick) => {
      let result = this.generator.next(tick);
      if (result.value !== undefined) {
        this.result.push(result.value);
      }
    });
  }


  static calculate = rsi;

  generator: IterableIterator<number | undefined>;

    nextValue(price: number): number | undefined {
        return this.generator.next(price).value;
    }}

export function rsi(input: RSIInput): number[] {
       Indicator.reverseInputs(input);
        let result = new RSI(input).result;
        if (input.reversedInput) {
            result.reverse();
        }
        Indicator.reverseInputs(input);
        return result;
    }
