/**
 * Created by AAravindan on 5/4/16.
 */
import {Indicator, IndicatorInput} from '../indicator/indicator';
import {SMA} from './SMA';
import {EMA} from './EMA';

export class VWMACDInput extends IndicatorInput {
  SimpleMAOscillator = true;
  SimpleMASignal = true;
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;

  constructor(public values: number[][]) {
    super();
  }
}

export class MACDOutput {
  MACD?: number;
  signal?: number;
  histogram?: number;
}

export class VWMACD extends Indicator {

  constructor(input: VWMACDInput) {
    super(input);
    let oscillatorMAtype = input.SimpleMAOscillator ? SMA : EMA;
    let signalMAtype = input.SimpleMASignal ? SMA : EMA;


    let fastMAVolimeProducer = new oscillatorMAtype({
      period: input.fastPeriod, values: [], format: (v) => {
        return v;
      }
    });
    let slowMAVolumeProducer = new oscillatorMAtype({
      period: input.slowPeriod, values: [], format: (v) => {
        return v;
      }
    });


    let fastMAProducer = new oscillatorMAtype({
      period: input.fastPeriod, values: [], format: (v) => {
        return v;
      }
    });
    let slowMAProducer = new oscillatorMAtype({
      period: input.slowPeriod, values: [], format: (v) => {
        return v;
      }
    });
    let signalMAProducer = new signalMAtype({
      period: input.signalPeriod, values: [], format: (v) => {
        return v;
      }
    });
    let format = this.format;
    this.result = [];

    this.generator = (function* () {
      let index = 0;
      let tick = [];
      let MACD: number | undefined, signal: number | undefined, histogram: number | undefined, fast: number | undefined,
        slow: number | undefined;
      while (true) {


        if (index < input.slowPeriod) {
          tick = yield;
          fast = fastMAProducer.nextValue(tick[0] * tick[1]) / fastMAVolimeProducer.nextValue(tick[1]);
          slow = slowMAProducer.nextValue(tick[0] * tick[1]) / slowMAVolumeProducer.nextValue(tick[1]);
          index++;
          continue;
        }
        if (fast && slow) { // Just for typescript to be happy
          MACD = fast - slow;
          signal = signalMAProducer.nextValue(MACD);
        }
        histogram = MACD - signal;
        tick = yield({
          // fast : fast,
          // slow : slow,
          MACD: format(MACD),
          signal: signal ? format(signal) : undefined,
          histogram: isNaN(histogram) ? undefined : format(histogram)
        });
        fast = fastMAProducer.nextValue(tick[0] * tick[1]) / fastMAVolimeProducer.nextValue(tick[1]);
        slow = slowMAProducer.nextValue(tick[0] * tick[1]) / slowMAVolumeProducer.nextValue(tick[1]);
      }
    })();


    this.generator.next();

    input.values.forEach((tick) => {

      let result = this.generator.next(tick);
      if (result.value !== undefined) {
        this.result.push(result.value);
      }
    });
  }


  static calculate = macd;
  result: MACDOutput[];
  generator: IterableIterator<MACDOutput | undefined>;

  nextValue(price: number): MACDOutput | undefined {
    let result = this.generator.next(price).value;
    return result;
  }}

export function macd(input: VWMACDInput): MACDOutput[] {
  Indicator.reverseInputs(input);
  let result = new VWMACD(input).result;
  if (input.reversedInput) {
    result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}
