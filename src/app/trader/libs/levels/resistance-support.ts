import {VOCandle} from '../../../amodels/api-models';
import * as _ from 'lodash';
import {CandlesAnalys1} from '../../../a-core/app-services/scanner/candles-analys1';
import {MATH} from '../../../acom/math';
import * as moment from 'moment';

export class ResistanceSupport {
  private supports: any[];
  private resistances: VOCandle[];

  vMed:number;

  constructor(public candles: VOCandle[], private range = 5) {
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
    const vmed = this.getVmed();


    this.supports = _.orderBy(out, 'close');

    this.supports.forEach(function (item, i) {
      item.i = i;
      item.date = moment(item.to).format('DD HH:mm');
      item.v_D = MATH.percent(item.Volume, vmed);
    });
    return this.supports;
  }

  getVmed(){
    if(this.vMed) return this.vMed;
      const volumes = CandlesAnalys1.volumes(this.candles);
      this.vMed = MATH.median(volumes);
      return this.vMed;
  }
  getResult() {
    return {
      resistance: this.getResistances(),
      support: this.getSupports()
    }

  }
}
