import {VOMarketCap} from '../amodels/app-models';

import * as _ from 'lodash';




export interface Result1 {
  symbol: string;
  name: string;
  vD: number;
  priceD: number;
  to_btc_1h: number;
  price_to_btcD: number;
  rankD: number;
  rank: number;
  dur: number;

}


export class UtilsBot {


  static filterMCandExchange(MC, exchange) {
    for (let str in MC) if (!exchange[str]) delete MC[str];
  }




  static analizeMongoData(data: any[]) {

   return data.map(function (coinMC) {

     const current = coinMC.symbol === 'BTC' ? coinMC.price_usd : coinMC.price_btc;
     const cur_prev = +(100 * (current - coinMC.prev) / coinMC.prev).toFixed(4);
     const cur_prev5 = +(100 * (current - coinMC.last5) / coinMC.last5).toFixed(4);


     const prev5_10 = +(100 * (coinMC.last5 - coinMC.last10) / coinMC.last10).toFixed(4);

     const prev10_20 = +(100 * (coinMC.last10 - coinMC.last20) / coinMC.last20).toFixed(4);
     const prev20_30 = +(100 * (coinMC.last20 - coinMC.last30) / coinMC.last30).toFixed(4);
     const h1_ago2h = +(100 * (coinMC.last10 - coinMC.ago2h) / coinMC.ago2h).toFixed(4);
     const h1_pago3h = +(100 * (coinMC.last10 - coinMC.ago3h) / coinMC.ago3h).toFixed(4);
     return{
       current,
       cur_prev,
       cur_prev5,
       prev5_10,
       prev10_20,
       prev20_30,
       h1_ago2h,
       h1_pago3h
     };
   });

  }


  static mapResult(MC): {[sumbol: string]: Result1} {
    let btc: VOMarketCap[] = MC['BTC'];

    const l = btc.length;
    const btcLast = btc[l - 1];
    const btcFirst = btc[0];

    const btc1h = btcLast.percent_change_1h;
    const btcD = +(100 * (btcLast.price_usd - btcFirst.price_usd) / btcFirst.price_usd).toFixed(2);
    const result = {};
    for (let str in MC) {

      let data: VOMarketCap[] = MC[str];

      if (data.length === l) {


        const first: VOMarketCap = data[0];
        const last: VOMarketCap = data[l - 1];

        const symbol: string = last.symbol;
        const name: string = last.name;

        const priceD = +(100 * (last.price_usd - first.price_usd) / first.price_usd).toFixed(2);
      //  const vD = +(100 * (last.volume_usd_24h - first.volume_usd_24h) / first.volume_usd_24h).toFixed(2);

        const mc_1h = last.percent_change_1h;
        const to_btc_1h = +(last.percent_change_1h - btcLast.percent_change_1h).toFixed(2);

        const price_to_btcD = +(priceD - btcD).toFixed(2);


        const rank = last.rank;
        const rankD = +(100 * (last.rank - first.rank) / first.rank).toFixed(3);
        const dur = Math.round((last.last_updated - first.last_updated) / 60);

        result[str] = {
       //   vD,
          priceD,
          to_btc_1h,
          price_to_btcD,
          rankD,
          rank,
          dur,
          symbol,
          name
        };

      }

    }
    return result;

  }
}
