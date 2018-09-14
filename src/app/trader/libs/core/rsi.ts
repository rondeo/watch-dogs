import {SMMA} from './sma';

export class RSI {
    input = 'candle';
    lastClose = null;
    weight: number;
    avgU: SMMA;
    avgD: SMMA;
    u = 0;
    d = 0;
    rs = 0;
    result = 0;
    age = 0;

  constructor(interval: number) {
    this.weight = interval;
    this.avgU = new SMMA(interval);
    this.avgD = new SMMA(interval);
  }

  update(candle: {close: number}) {
    var currentClose = candle.close;

    if (this.lastClose === null) {
      // Set initial price to prevent invalid change calculation
      this.lastClose = currentClose;

      // Do not calculate RSI for this reason - there's no change!
      this.age++;
      return;
    }

    if (currentClose > this.lastClose) {
      this.u = currentClose - this.lastClose;
      this.d = 0;
    } else {
      this.u = 0;
      this.d = this.lastClose - currentClose;
    }

    this.avgU.update(this.u);
    this.avgD.update(this.d);

    this.rs = this.avgU.result / this.avgD.result;
    this.result = 100 - (100 / (1 + this.rs));

    if (this.avgD.result === 0 && this.avgU.result !== 0) {
      this.result = 100;
    } else if (this.avgD.result === 0) {
      this.result = 0;
    }
    this.lastClose = currentClose;
    this.age++;
  }
}