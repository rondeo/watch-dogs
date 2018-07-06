import * as _ from 'lodash';
import {VOCoinWeek, VOMCAgregated} from '../models/api-models';
import {VOCoinsDay} from '../apis/api-market-cap.service';

export interface VOMovingAvg {
  symbol: string;
  price_btc: number;
  price03h: number;
  price05h: number;
  price1h: number;
  price2h: number;
  price3h: number;
  vol1h: number;
  vol2h: number;
  vol3h: number;
  timestamp: number;
  rank: number;
  rank24h?: number;
  rankD?: number;
}



export class MovingAverage {
  static map(data: VOMCAgregated): VOMovingAvg {
    return {
      symbol: data.symbol,
      price_btc: data.price_btc,
      price03h: 0,
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

  static isMovingDown2(prev: VOMovingAvg, curr: VOMovingAvg): boolean {
    ;
    return (
      (100 * ((curr.price2h - prev.price2h) / prev.price2h) < -0.11)

      );
  }

  static triggerMovingAvarages(mas: VOMovingAvg[]): { timestamp: number, trigger: number }[] {
    const out: { timestamp: number, trigger: number }[] = [];
    let prevValue: VOMovingAvg = mas[0];
    mas.forEach(function (ma: VOMovingAvg) {
      const v = {
        timestamp: ma.timestamp,
        trigger: 1
      };
      if (ma.price05h) {
        if (MovingAverage.isMovingDown2(prevValue, ma)) {
          v.trigger = 3;
        } else v.trigger = 2;
      }
      prevValue = ma;
      out.push(v);
    });
    return out;
  }


  static movingAfarageFromCoinWeek(coindatas: VOCoinWeek[]): VOMovingAvg[] {
    const takeRight = _.takeRight;
    const sumBy = _.sumBy;
    const take = _.take;
    const out: VOMovingAvg[] = [];
    for (let i = 0, n = coindatas.length; i < n; i++) {
      const cur = coindatas[i];
      if (i < 30) {
        out.push({
          symbol: '',
          price03h: 0,
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

      const prev = coindatas[i - 1];
      const l_3 = coindatas.slice(i - 3, i);
      const l_5 = coindatas.slice(i - 5, i);
      const l_10 = coindatas.slice(i - 10, i);
      const l_20 = coindatas.slice(i - 20, i);
      const l_30 = coindatas.slice(i - 30, i);

      const price03h = +(sumBy(l_3, 'price_btc') / 3).toFixed(12);
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
        symbol: '',
        price03h,
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

  static async movingAverageFromCoinDay(coinDay: VOCoinsDay) {
    return new Promise<{
      symbol: string;
      price03hD: number;
      price1hD: number;
      price2hD: number;
      price4hD: number;
      price24hD: number;
      rank24hD: number;
    } []>(function (resolve, reject) {

      const takeRight = _.takeRight;
      const sumBy = _.sumBy;
      const take = _.take;
      const out = [];
      const L = coinDay['BTC'].length - 1;
      const M = Math.round(L / 2);


      for (let coin in coinDay) {
        const values = coinDay[coin];
        const cur = values[L];
        const prev = values[L - 1];

        const l_3 = values.slice(L - 3, L);

        const price03h = +(sumBy(l_3, 'price_btc') / l_3.length);

        // const l_05 = values.slice(L - 5, L);
        // const price05h = +(sumBy(l_05, 'price_btc') / l_05.length).toFixed(12);

        const l_10 = values.slice(L - 10, L);
        const price1h = +(sumBy(l_10, 'price_btc') / l_10.length);

        const l_20 = values.slice(L - 20, L);
        const price2h = +(sumBy(l_20, 'price_btc') / l_20.length);

        const l_40 = values.slice(L - 40, L);
        const price4h = +(sumBy(l_40, 'price_btc') / l_40.length);

        const l_80 = values.slice(L - 80, L);
        const price8h = +(sumBy(l_80, 'price_btc') / l_80.length);


        const price03hD = 100 * (price03h - price1h) / price1h;
        const price1hD = 100 * (price1h - price2h) / price2h;
        const price2hD = 100 * (price2h - price4h) / price4h;
        const price4hD = 100 * (price4h - price8h) / price8h;


        /*  const vol1h = +(sumBy(l_10, 'volume') / 10).toFixed(0);
          const vol1h_ = +(sumBy(l_10_, 'volume') / 10).toFixed(0);

          const vol2h = +(sumBy(l_20, 'volume') / 20).toFixed(0);
          const vol2h_ = +(sumBy(l_20_, 'volume') / 20).toFixed(0);

          const vol3h = +(sumBy(l_30, 'volume') / 30).toFixed(0);
          const vol3h_ = +(sumBy(l_30_, 'volume') / 30).toFixed(0);


    */
        const first10 = values.slice(0, 10);
        const last10 = values.slice(L - 10, L);

        const price1 = (sumBy(first10, 'price_btc') / first10.length);
        const price2 = (sumBy(last10, 'price_btc') / last10.length);


        const price24hD = 100 * (price2 - price1) / price1;

        const rank1 = +(sumBy(first10, 'rank') / first10.length);
        const rank2 = +(sumBy(last10, 'rank') / last10.length);
        const rank24hD = +(100 * (rank1 - rank2) / rank1)

        const rank = cur.rank;
        const price_btc = cur.price_btc;
        out.push({
          symbol: coin,
          price03hD,
          price1hD,
          price2hD,
          price4hD,
          price24hD,
          rank24hD
        })
      }
      resolve(out);
    })
  }
}

