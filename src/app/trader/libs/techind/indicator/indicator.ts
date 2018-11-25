import {format as nf} from '../Utils/NumberFormatter';

export class IndicatorInput {
  reversedInput?: boolean;
  format?: (data: number) => number;
}

export class AllInputs {
  values?: number[];
  open?: number[];
  high?: number[];
  low?: number[];
  close?: number[];
  volume?: number[];
  timestamp?: number[];
}

export class Indicator {
  result: any;
  format: (data: number) => number;

  constructor(input: IndicatorInput) {
    this.format = input.format || nf;
  }

  static reverseInputs(input: any): void {
    if (input.reversedInput) {
      if (input.values) input.values.reverse();
      if (input.open) input.open.reverse();
      if (input.high) input.high.reverse();
      if (input.low) input.low.reverse();
      if (input.close) input.close.reverse();
      if (input.volume) input.volume.reverse();
      if (input.timestamp) input.timestamp.reverse();
    }
  }

  getResult() {
    return this.result;
  }
}
