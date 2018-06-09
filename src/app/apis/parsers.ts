import {VOMarketCap} from '../models/app-models';
import {MCdata, VOMCAgregated} from '../models/api-models';

export class Parsers {
  static mapMCValue(item) {
    return {
      id: item[0],
      name: item[1],
      symbol: item[2],
      rank: item[3],
      price_usd: item[4],
      price_btc: item[5],
      percent_change_1h: item[6],
      percent_change_24h: item[7],
      percent_change_7d: item[8],
      volume_usd_24h: item[9],
      market_cap_usd: item[10],
      available_supply: item[11],
      total_supply: item[12],
      max_supply: item[13],
      last_updated: item[14]
    }
  }

  static mapAgrigated(item: MCdata, symbol: string): VOMCAgregated {
    const price_btcs = item.price_btcs || item.prev
    const price_btc = item.btc,
      prev = price_btcs[0],
      last5 = price_btcs[1],
      last10 = price_btcs[2],
      last20 = price_btcs[3],
      ago2h = price_btcs[4],
      last30 = price_btcs[5],
      ago3h = price_btcs[6]


    return {
      date: '',
      name:item.id,
      symbol: symbol,
      id: item.id,
      price_usd: item.usd,
      price_btc,
      tobtc_last: +(100 * (price_btc - prev) / prev).toFixed(2),
      tobtc_change_05h: +(100 * (last5 - last10) / last10).toFixed(2),
      tobtc_change_1h: +(100 * (last10 - last20) / last20).toFixed(2),
      tobtc_change_2h: +(100 * (last10 - last30) / last30).toFixed(2),
      tobtc_change_3h: +(100 * (last10 - ago3h) / ago3h).toFixed(2),

      total_supply:item.data[4],

      percent_change_1h: item.h1,
      percent_change_24h: item.data[0],
      percent_change_7d: item.data[1],
      rank: item.rank,
      rankPrev: item.rP,
      timestamp: item.t * 1000,
      volume: item.vol,
      vol_1h: item.vol_1h,
      vol_3h: item.vol_3h,
      vol_6h: item.vol_6h,
      prev,
      last5,
      last10,
      last20,
      ago2h,
      last30,
      ago3h
    }
  }

  static mapDataCharts(res: any) {
    let ar: any[] = res.data
    let volume_usd_24h = [];
    let available_supply = [];
    let market_cap_usd = [];
    let max_supply = [];


    let percent_change_1h = [];
    let btc_change_1h = [];

    let tobtc_change_1h = [];

    let tobtc_change_24h = [];


    let percent_change_24h = [];
    let price_btc = [];
    let price_usd = [];
    let total_supply = [];
    let labels = [];
    let stamps = [];


    ar.forEach(function (item) {

      volume_usd_24h.push(+item['24h_volume_usd']);
      available_supply.push(+item.available_supply);
      market_cap_usd.push(+item.market_cap_usd);
      max_supply.push(+item.max_supply);

      percent_change_24h.push(+item.percent_change_24h);
      price_btc.push(+item.price_btc);
      price_usd.push(+item.price_usd);


      percent_change_1h.push(+item.percent_change_1h);
      btc_change_1h.push(+item.btc_change_1h);
      tobtc_change_1h.push(+item.percent_change_1h - +item.btc_change_1h);


      tobtc_change_24h.push(+item.percent_change_24h - +item.btc_change_24h);

      total_supply.push(+item.total_supply);
      stamps.push(item.stamp);
      labels.push(' ')
    });

    return {
      volume_usd_24h,
      available_supply,
      market_cap_usd,
      max_supply,
      percent_change_1h,
      percent_change_24h,
      price_btc,
      price_usd,
      tobtc_change_1h,
      tobtc_change_24h,
      btc_change_1h,

      total_supply,
      labels,
      stamps
    }

  }

  static mapDataMC(data: any) {
    const out = {};
    data.forEach(function (item) {
      if (!out[item.symbol]) out[item.symbol] = {
        id: item.id,
        name: item.name,
        symbol: item.symbol,
        rank: +item.rank,
        price_usd: +item.price_usd,
        price_btc: +item.price_btc,
        volume_usd_24h: +item['24h_volume_usd'],
        market_cap_usd: +item.market_cap_usd,
        available_supply: +item.available_supply,
        total_supply: +item.total_supply,
        max_supply: +item.max_supply,
        percent_change_1h: +item.percent_change_1h,
        percent_change_24h: +item.percent_change_24h,
        percent_change_7d: +item.percent_change_7d,
        last_updated: item.last_updated,
        stamp: item.stamp
      }
    })
    return out;
  }

  static mapServerValues(data: { [id: string]: MCdata }): { [symbol: string]: VOMarketCap } {
    let MC: { [symbol: string]: VOMarketCap } = {};

    const percent_change_1h = data['BTC'].h1;
    const percent_change_24h = data['BTC'].data[0];
    const percent_change_7d = data['BTC'].data[1];

    for (let str in data) {
      const item: MCdata = data[str];
      if (item.data) {
        MC[str] = {
          id: item.id,
          symbol: str,
          name: item.n,
          rank: item.rank,
          price_usd: item.usd,
          price_btc: item.btc,
          percent_change_1h: item.h1,
          percent_change_24h: +item.data[0],
          percent_change_7d: +item.data[1],
          tobtc_change_1h: +(item.h1 - percent_change_1h).toFixed(2),
          tobtc_change_24h: +(+item.data[0] - percent_change_24h).toFixed(2),
          tobtc_change_7d: +(+item.data[1] - percent_change_7d).toFixed(2),
          volume_usd_24h: item.vol,
          //volumePrev:item.volP,
          market_cap_usd: item.data[2],
          available_supply: item.data[3],
          total_supply: item.data[4],
          max_supply: item.data[5],
          last_updated: item.t
        }
      }
    }
    return MC;
  }

}
