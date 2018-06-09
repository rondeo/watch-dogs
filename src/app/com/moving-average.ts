import {VOCoinData, VOMCAgregated} from '../shared/models';
import * as _ from 'lodash';

export interface VOMovingAvg {
  symbol: string;
  price_btc: number;
  price05h: number;
  price1h: number;
  price2h: number;
  price3h: number;
  vol1h: number;
  vol2h: number;
  vol3h: number;
  timestamp: number;
  rank: number;
  rankD: number;
}

export class MovingAverage {
  static map(data: VOMCAgregated): VOMovingAvg {
    return {
      symbol: data.symbol,
      price_btc: data.price_btc,
      price05h: data.last5,
      price1h: data.last10,
      price2h: data.last20,
      price3h: data.last30,
      vol1h: data.vol_1h,
      vol2h: data.vol_3h,
      vol3h: data.vol_6h,
      timestamp: data.timestamp,
      rank: data.rank,
      rankD: +(100 * (data.rankPrev - data.rank) / data.rank).toFixed(4)
    }
  }

  static isMovingDown(ma: VOMovingAvg): boolean {
    const price05h = ma.price05h;
    return (price05h - ma.price1h < 0) && (price05h - ma.price2h < 0) && (price05h - ma.price3h < 0);
  }

  static triggerMovingAvarages(mas: VOMovingAvg[]): { timestamp: number, trigger: number }[] {
    const out: { timestamp: number, trigger: number }[] = [];
    mas.forEach(function (ma: VOMovingAvg) {
      const v = {
        timestamp: ma.timestamp,
        trigger: 1
      };
      if (ma.price05h) {
        if (MovingAverage.isMovingDown(ma)) {
          v.trigger = 3;
        } else v.trigger = 2;
      }
      out.push(v);
    });
    return out;
  }


  static movingAfarageFromVOCoinData(coindatas: VOCoinData[]): VOMovingAvg[] {
    const takeRight = _.takeRight;
    const sumBy = _.sumBy;
    const take = _.take;
    const out: VOMovingAvg[] = [];
    for (let i = 0, n = coindatas.length; i < n; i++) {
      const cur = coindatas[i];
      if (i < 30) {
        out.push({
          symbol:'',
          price05h: 0,
          price1h: 0,
          price2h: 0,
          price3h: 0,

          vol1h: 0,
          vol2h: 0,
          vol3h: 0,

          rank: cur.rank,
          rankD: 0,
          price_btc: cur.price_btc,
          timestamp: cur.timestamp
        });
        continue;
      }

      const l_5 = coindatas.slice(i - 5, i);
      const l_10 = coindatas.slice(i - 10, i);
      const l_20 = coindatas.slice(i - 20, i);
      const l_30 = coindatas.slice(i - 30, i);

      const price05h = +(sumBy(l_5, 'price_btc') / 5).toFixed(12);
      const price1h = +(sumBy(l_10, 'price_btc') / 10).toFixed(12);
      const price2h = +(sumBy(l_20, 'price_btc') / 20).toFixed(12);
      const price3h = +(sumBy(l_30, 'price_btc') / 30).toFixed(12);

      const vol1h = +(sumBy(l_10, 'volume') / 10).toFixed(0);
      const vol2h = +(sumBy(l_20, 'volume') / 20).toFixed(0);
      const vol3h = +(sumBy(l_30, 'volume') / 30).toFixed(0);

      const rankD = +(100 * ((sumBy(l_30, 'rank') / 30) - cur.rank) / cur.rank).toFixed(4);
      const rank = cur.rank;
      const price_btc = cur.price_btc;
      const timestamp = cur.timestamp;

      out.push({
        symbol:'',
        price05h,
        price1h,
        price2h,
        price3h,

        vol1h,
        vol2h,
        vol3h,

        rank,
        rankD,
        price_btc,
        timestamp
      })
    }


    return out;
  }
}

