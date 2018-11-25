import { IndicatorInput, Indicator } from '../indicator/indicator';
import { SMA } from '../moving_averages/SMA';
import LinkedList from '../Utils/FixedSizeLinkedList';
/**
 * Created by AAravindan on 5/7/16.
 */

export class SDInput extends IndicatorInput {
  period: number;
  values: number[];
}

export class SD extends Indicator {
  constructor (input: SDInput) {
    super(input);
    let period = input.period;
    let priceArray = input.values;

    let sma = new SMA({period : period, values : [], format : (v: number) => v});

    this.result = [];

    this.generator = (function* () {
      let tick;
      let mean;
      let currentSet = new LinkedList(period);
      tick = yield;
      let sd1;
      while (true) {
        currentSet.push(tick);
        mean = sma.nextValue(tick);
        if (mean) {
          let sum = 0;
          // @ts-ignore
          for (let x of currentSet.iterator()) {
            sum = sum + (Math.pow((x - mean), 2));
          }
          sd1 = Math.sqrt(sum / (period ));
        }
        tick = yield sd1;
      }
    })();

    this.generator.next();

    priceArray.forEach((tick) => {
      let result = this.generator.next(tick);
      if (result.value !== undefined) {
        this.result.push(this.format(result.value));
      }
    });
  }


  static calculate = sd;
  generator: IterableIterator<number | undefined>;

    nextValue(price: number): number | undefined {
        let nextResult = this.generator.next(price);
        if (nextResult.value !== undefined)
          return this.format(nextResult.value);
    }} 

export function sd(input: SDInput): number[] {
       Indicator.reverseInputs(input);
        let result = new SD(input).result;
        if (input.reversedInput) {
            result.reverse();
        }
        Indicator.reverseInputs(input);
        return result;
    }

