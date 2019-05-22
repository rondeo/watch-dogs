import {VOCandle} from '../../../amodels/api-models';
import {MATH} from '../../../acom/math';
import * as _ from 'lodash';

export class CandlesUtils {

  static volumes(candles: VOCandle[]): number[] {
    return candles.map(function (o) {
      return o.Volume;
    })
  }

  static closes(candles: VOCandle[]): number[] {
    return candles.map(function (o) {
      return o.close;
    })
  }

  static vols(volumes: number[]) {
    const med = MATH.median(_.takeRight(volumes, 99));
    const last = _.last(volumes);
    const v7 = _.mean(_.takeRight(volumes, 7));
    const v3 = _.mean(_.takeRight(volumes, 3));
    const v25 = _.mean(_.takeRight(volumes, 25));

    return {
      v3,
      v7,
      v25,
      med,
      last
    };
  }

  static mas(closes: number[]) {
    const ma99 = _.mean(_.takeRight(closes, 99));
    const ma7 = _.mean(_.takeRight(closes, 7));
    const ma3 = _.mean(_.takeRight(closes, 3));
    const ma25 = _.mean(_.takeRight(closes, 25));

    return {
      last: _.last(closes),
      ma3,
      ma7,
      ma25,
      ma99
    };
  }
}
