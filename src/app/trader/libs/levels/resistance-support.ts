import {VOCandle} from '../../../models/api-models';
import * as _ from 'lodash';

export class ResistanceSupport {
  private supports: VOCandle[];
  private resistances: VOCandle[];

  constructor(private candles: VOCandle[], private range = 5) {
  }
  getResistances() {
    if (this.resistances) return this.resistances;
    const data: VOCandle[] = this.candles;
    const out = [];
    const range = this.range;
    const isTop = function (ar: VOCandle[], j, i) {
      const abs = Math.abs(j) + 1;
      const cur = ar[i].close;
      while (j < abs) {
        if (ar[i + j].close > cur) return false;
        j++;
      }
      return true;
    };
    for (let i = range, n = data.length - range; i < n; i++) {
      if (isTop(data, -range, i)) out.push(data[i]);
    }
    this.resistances = out;
    return out;
  }

  getSupports() {
    if (this.supports) return this.supports;
    const data = this.candles;
    const out = [];
    const range = this.range;
    const isLowest = function (ar: VOCandle[], j, i) {
      const n = Math.abs(j) + 1;
      const cur = ar[i].close;
      while (j < n) {
        if (ar[i + j].close < cur) return false;
        j++;
      }
      return true;
    };

    for (let i = range, n = data.length - range; i < n; i++) {
      const item = data[i];
      if (isLowest(data, -range, i)) out.push(item);
    }
    this.supports = out;
    return out;
  }

  getResult() {
    return {
      resistance: this.getResistances(),
      support: this.getSupports()
    }

  }
}
