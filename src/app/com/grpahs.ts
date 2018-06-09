import {VOMCAgregated} from '../models/api-models';


export class GRAPHS {


  static integralData(item:VOMCAgregated){
    const cur = item.symbol === 'BTC' ? item.price_usd : item.price_btc
    const cur_prev = +(100 * (cur - item.prev) / item.prev).toFixed(4);
    const cur_prev5 = +(100 * (cur - item.last5) / item.last5).toFixed(4);
    const prev5_10 = +(100 * (item.last5 - item.last10) / item.last10).toFixed(4);
    const prev10_20 = +(100 * (item.last10 - item.last20) / item.last20).toFixed(4);
    const prev20_30 = +(100 * (item.last20 - item.last30) / item.last30).toFixed(4);
    const h1_ago2h = +(100 * (item.last10 - item.ago2h) / item.ago2h).toFixed(4);
    const h1_pago3h = +(100 * (item.last10 - item.ago3h) / item.ago3h).toFixed(4);
    const vol1_6 = item.vol_6h? +(100 * (item.vol_1h - item.vol_6h) / item.vol_6h).toFixed(4):0;
    const rankD = +(100 * (item.rankPrev - item.rank) / item.rank).toFixed(4);

    return {
      cur,
      cur_prev,
      cur_prev5,
      prev5_10,
      prev10_20,
      prev20_30,
      h1_ago2h,
      h1_pago3h,
      vol1_6,
      rankD
    }
  }

  static mcAggregatedToGraphs(data: VOMCAgregated[]) {

    const current = [],
      cur_prev = [],
      cur_prev5 = [],
      prev5_10 = [],
      prev10_20 = [],
      prev20_30 = [],
      h1_ago2h = [],
      h1_pago3h = [],
      dates = [],
      labels = [],
      price_btc = [],
      price_usd = [],
      rank = [],
      trigger =[];

    data.forEach(function (item) {
      const integ = GRAPHS.integralData(item);
      const trigger_ =
        integ.cur_prev < 0  &&
        integ.prev5_10 <0 &&
        integ.prev10_20 < 0 &&
        integ.prev5_10 < 0
          ?1:2;

      trigger.push(trigger_)
      current.push(integ.cur);
      cur_prev.push(integ.cur_prev);
      cur_prev5.push(integ.cur_prev5);
      prev5_10.push(integ.prev5_10);
      prev10_20.push(integ.prev10_20);
      prev20_30.push(integ.prev20_30);
      h1_ago2h.push(integ.h1_ago2h);
      h1_pago3h.push(integ.h1_pago3h);
      price_btc.push(item.price_btc);
      price_usd.push(item.price_usd);
      labels.push('');
      dates.push(item.date);
      rank.push(item.rank);
    })



    return {
      rank,
      current,
      cur_prev,
      cur_prev5,
      prev5_10,
      prev10_20,
      prev20_30,
      h1_ago2h,
      h1_pago3h,
      price_btc,
      price_usd,
      dates,
      labels,
      trigger
    }

  }
}