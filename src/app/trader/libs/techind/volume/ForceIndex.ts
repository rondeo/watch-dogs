import { EMA } from '../moving_averages/EMA';
import { CandleData } from '../StockData';
import { Indicator, IndicatorInput } from '../indicator/indicator';

export class ForceIndexInput extends IndicatorInput {
  close: number[];
  volume: number[];
  period = 1;
}


export class ForceIndex extends Indicator {
  constructor(input: ForceIndexInput) {
    super(input);
    let closes = input.close;
    let volumes = input.volume;
    let period = input.period || 1;
    
    if (!((volumes.length === closes.length))) {
      throw new Error(('Inputs(volume, close) not of equal size'));
    }
    let emaForceIndex = new EMA({ values : [], period: period });
    this.result = [];

    this.generator = (function* () {
      let previousTick = yield;
      let tick = yield;
      let forceIndex;
      while (true) {
        forceIndex = (tick.close - previousTick.close) * tick.volume;
        previousTick = tick;
        tick = yield emaForceIndex.nextValue(forceIndex);
      }
    })();

    this.generator.next();

    volumes.forEach((tick, index) => {
      let result = this.generator.next({
        close : closes[index],
        volume : volumes[index]
      });
      if (result.value !== undefined) {
        this.result.push(result.value);
      }
    });
  }


  static calculate = forceindex;
  result: number[];
  generator: IterableIterator<number | undefined>;

  nextValue(price: CandleData): number | undefined {
      let result = this.generator.next(price).value;
      if (result !== undefined) {
        return result;
      }
  }}

export function forceindex(input: ForceIndexInput): number[] {
    Indicator.reverseInputs(input);
    let result = new ForceIndex(input).result;
    if (input.reversedInput) {
        result.reverse();
    }
    Indicator.reverseInputs(input);
    return result;
  }
