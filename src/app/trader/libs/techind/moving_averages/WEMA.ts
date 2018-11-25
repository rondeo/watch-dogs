import { Indicator, IndicatorInput } from '../indicator/indicator';
import { MAInput, SMA } from './SMA';
import { LinkedList } from '../Utils/LinkedList';

export class WEMA extends Indicator {
    constructor(input: MAInput) {
        super(input);
        let period = input.period;
        let priceArray = input.values;
        let exponent = 1 / period;
        let sma: SMA;

        this.result = [];

        sma = new SMA({period : period, values : []});

        let genFn = function* (): IterableIterator<number | undefined> {
            let tick  = yield;
            let prevEma;
            while (true) {
                if (prevEma !== undefined && tick !== undefined) {
                    prevEma = ((tick - prevEma) * exponent) + prevEma;
                    tick = yield prevEma;
                } else {
                    tick = yield;
                    prevEma = sma.nextValue(tick);
                    if (prevEma !== undefined)
                        tick = yield prevEma;
                }
            }
        };

        this.generator = genFn();

        this.generator.next();
        this.generator.next();

        priceArray.forEach((tick) => {
            let result = this.generator.next(tick);
            if (result.value !== undefined) {
                this.result.push(this.format(result.value));
            }
        });
    }


    static calculate = wema;
    period: number;
    price: number[];
    result: number[];
    generator: IterableIterator<number | undefined>;

    nextValue(price: number): number | undefined {
        let result = this.generator.next(price).value;
        if (result !== undefined)
            return this.format(result);
    }}

export function wema(input: MAInput): number[] {
      Indicator.reverseInputs(input);
      let result = new WEMA(input).result;
      if (input.reversedInput) {
          result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
  }
