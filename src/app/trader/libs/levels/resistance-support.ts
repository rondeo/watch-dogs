import {VOCandle} from '../../../models/api-models';
import * as _ from 'lodash';

export class ResistanceSupport {
  result: { resistance: VOCandle[], support: VOCandle[] };
  range = 5;

  constructor(private candles: VOCandle[]) {
  }

  async getResistance(ar: VOCandle[]) {
    const out = [];
    const range = this.range;
    const isTop = function (ar1: VOCandle[], n, i) {
      const abs = Math.abs(n) + 1;
      const cur = ar1[i].high;
      while (n < abs) {
        if (ar1[i + n].high > cur) return false;
        n++;
      }
      return true;
    };
    for (let i = range, n = ar.length - range; i < n; i++) {
      // const item = ar[i];
      // const cur = ar[i].high;
      if (isTop(ar, -range, i)) {
        out.push(ar[i]);
      }

    }

    return Promise.resolve(out);
  }

  getSupport(ar: VOCandle[]) {
    const out = [];
    const range = this.range;
    const isBott = function (ar1: VOCandle[], n, i) {
      const abs = Math.abs(n) + 1;
      const cur = ar1[i].low;
      while (n < abs) {
        if (ar1[i + n].low < cur) return false;
        n++;
      }
      return true;
    };

    for (let i = range, n = ar.length - range; i < n; i++) {
      const item = ar[i];
      const cur = ar[i].low;
      if (isBott(ar, -range, i)
      ) {
        out.push(item);
      }

    }

    return Promise.resolve(out);
  }


  async ctr() {
    // let maxAr = _.sortBy(this.candles, 'high').reverse();
    const resistance: VOCandle[] = <VOCandle[]>(await this.getResistance(this.candles));

    const support: VOCandle[] =  await this.getSupport(this.candles);
    this.result = {resistance, support};
    return this.result;
  }

  async getResult() {
    return this.ctr();

  }
}
