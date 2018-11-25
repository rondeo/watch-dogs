import { CandleData } from '../StockData';
import { Indicator, IndicatorInput } from '../indicator/indicator';
import { SMA } from '../moving_averages/SMA';
import LinkedList from '../Utils/FixedSizeLinkedList';

export class CCIInput extends IndicatorInput {
  high: number[];
  low: number[];
  close: number[];
  period: number;
}


export class CCI extends Indicator {
  constructor(input: CCIInput) {
    super(input);
    let lows = input.low;
    let highs = input.high;
    let closes = input.close;
    let period = input.period;
    let format = this.format;
    let constant = .015;
    let currentTpSet = new LinkedList(period);
    
    let tpSMACalculator  = new SMA({period: period, values: [], format : (v) => v});

    if (!((lows.length === highs.length) && (highs.length === closes.length) )) {
      throw new Error(('Inputs(low,high, close) not of equal size'));
    }

    this.result = [];

    this.generator = (function* () {
      let tick = yield;
      while (true) {
        let tp = (tick.high + tick.low + tick.close) / 3;
        currentTpSet.push(tp);
        let smaTp = tpSMACalculator.nextValue(tp);
        let meanDeviation: number = null;
        let cci: number;
        let sum = 0;
        if (smaTp !== undefined) {
          // First, subtract the most recent 20-period average of the typical price from each period's typical price. 
          // Second, take the absolute values of these numbers.
          // Third,sum the absolute values. 
          // @ts-ignore
          for (let x of currentTpSet.iterator()) {
            sum = sum + (Math.abs(x - smaTp));
          }
          // Fourth, divide by the total number of periods (20). 
          meanDeviation = sum / 20;
          cci = (tp  -  smaTp) / (constant * meanDeviation);
        }
        tick = yield cci;
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
        this.result.push(result.value);
      }
    });
  }


  static calculate = cci1;
  result: number[];
  generator: IterableIterator<number | undefined>;

  nextValue(price: CandleData): number | undefined {
      let result = this.generator.next(price).value;
      if (result !== undefined) {
        return result;
      }
  }}

export function cci1(input: CCIInput): number[] {
    Indicator.reverseInputs(input);
    let result = new CCI(input).result;
    if (input.reversedInput) {
        result.reverse();
    }
    Indicator.reverseInputs(input);
    return result;
  }
