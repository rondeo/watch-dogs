import {VOCandle} from '../../../models/api-models';
import * as _ from 'lodash';

export class ResistanceLevel {
  result: { maxs: VOCandle[], mins: VOCandle[] };

  constructor(private candles: VOCandle[]) {
    this.ctr();
  }

  getMaxes(ar: VOCandle[]) {
    const out = [];
    for (let i = 3, n = ar.length - 3; i < n; i++) {
      const item = ar[i];
      const cur = ar[i].high;
      if (
        cur > ar[i - 1].high
        && cur > ar[i - 2].high
        && cur > ar[i - 3].high
        && cur > ar[i + 1].high
        && cur > ar[i + 2].high
        && cur > ar[i + 3].high
      ) {
        out.push(item);
      }

    }

    return out;
  }

  getMins(ar: VOCandle[]) {
    const out = [];
    for (let i = 3, n = ar.length - 3; i < n; i++) {
      const item = ar[i];
      const cur = ar[i].low;
      if (
        cur < ar[i - 1].low
        && cur < ar[i - 2].low
        && cur < ar[i - 3].low
        && cur < ar[i + 1].low
        && cur < ar[i + 2].low
        && cur < ar[i + 3].low
      ) {
        out.push(item);
      }

    }

    return out;
  }


  ctr() {

    //let maxAr = _.sortBy(this.candles, 'high').reverse();
    const maxs = this.getMaxes(this.candles);

    const mins: VOCandle[] = this.getMins(this.candles)
    this.result = {maxs, mins};
  }

  getResult() {
    return this.result;
  }
}
