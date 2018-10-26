import {VOCandle} from '../../models/api-models';
import {VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import * as moment from 'moment';
import {ResistanceSupport} from '../../trader/libs/levels/resistance-support';


export class CandlesAnalys1 {

  static makeValues(max, median, candles: VOCandle[]) {
    const ind = candles.indexOf(max);
    let prev: VOCandle;
    let next:VOCandle;
    if(ind === candles.length - 1){
            prev = candles[ind-1];
            next = candles[ind];
    }else if(ind ===0){
      prev = candles[ind];
      next = candles[ind +1];
    }else{
      prev = candles[ind-1];
      next = candles[ind +1];
    }

    const pricePrev = (prev.high + prev.low)/2;
    const nextPrice = (next.high + next.low)/2;


    const t = moment(max.to).format('HH:mm');
    const p = MATH.percent(max.Volume, median);
    const a = max.close > max.open?'BUY':'SELL';
    // const d = MATH.percent(max.close, max.open);
    const d = MATH.percent(nextPrice, pricePrev);
    return {t,p,a,d};
  }

  static MALats(candles: VOCandle[]) {
    const closes: number[] = CandlesAnalys1.closes(candles);
    const mean = _.mean(closes);
    const last =  _.last(closes);
    return MATH.percent(last, mean);
  }


  static volumeJump(candles: VOCandle[]) {
    const vols = _.orderBy(_.filter(candles, 'Volume'), 'Volume').reverse();


    const median = vols[Math.round(vols.length/2)].Volume;
    return vols.slice(0,3).map(function (o) {
      return CandlesAnalys1.makeValues(o, median, candles);
    });
  }

  static pumpedUp(candles: VOCandle[]) {
    candles = _.takeRight(candles, 4);
    const first = _.first(candles);
    const last = _.last(candles);
    return MATH.percent(last.high, first.low);
  }

  static meds(candles: VOCandle[]): number[] {
    return candles.map(function (o) {
      return (o.high + o.low) / 2;
    });
  }

  static closes(candles: VOCandle[]): number[] {
    return candles.map(function (o) {
      return o.close;
    });
  }

  static analysData;
  static data;

  static speeds(candles: VOCandle[]) {
    const values: number[] = CandlesAnalys1.meds(candles);
    const speeds = values.map(function (o) {
      const speed = Math.round((o - this.last) / this.last * 1e4) / 100;
      this.last = o;
      return speed;
    }, {last: values[0]});
    return speeds
  }


  static lastVolume(candles: VOCandle[]) {
    const vols = candles.map(function (o) {
      return o.Volume;
    });
    const mean = _.mean(vols);
    const last3 = _.mean(_.takeRight(vols, 3));
    return MATH.percent(last3, mean);
  }

  static progress(candles: VOCandle[], take = 0) {
    if (take) candles = _.takeRight(candles, take);
    const prices = CandlesAnalys1.meds(candles);
    // console.log(_.last(candles));
    const m = Math.round(candles.length / 2);
    const firsts = prices.slice(0, m);
    const lasts = prices.slice(m);
    const priceF = MATH.median(firsts);
    const priceL = MATH.median(lasts);
    return MATH.percent2(priceL, priceF);
  }

  static MA3(candles: VOCandle[]) {
    const prices = CandlesAnalys1.meds(candles);
    const n = prices.length;
    //  console.log(prices.slice(n-3));
    const last3 = _.mean(prices.slice(n - 3));
    //  console.log(prices.slice(n-6));
    const last6 = _.mean(prices.slice(n - 6));

    return MATH.percent2(last3, last6);

  }

  static goingUp(candles: VOCandle[]) {
    const prices = CandlesAnalys1.meds(candles);
    const n = prices.length;
    const last3 = _.mean(prices.slice(n - 3));
    const prelast3 = _.mean(prices.slice(n - 6, n - 3));
    //  console.log(last3, prelast3);
    return MATH.percent2(last3, prelast3);
  }

  isDive(candles: VOCandle[]) {
    const last = _.last(candles);
    const prelast = candles[candles.length - 2];
    const lastmed = (last.high + last.low) / 2;
    const prelastmed = (prelast.high + prelast.low) / 2;


  }

  static async analyze(data: { exchange: string, market: string, candles: VOCandle[] }, coinMC: VOMarketCap, addExclude, notify) {
    const exchange = data.exchange;
    const market = data.market;
    const candles = data.candles;
    const n = candles.length;
    let last = _.last(candles);
    let first = _.first(candles);

    const prev = candles[n - 2];
    const highs = _.orderBy(candles.slice(0, candles.length - 1), 'high').reverse();

    const sortedVol = _.orderBy(candles, 'Volume').reverse();

    const sortedPrice = _.orderBy(candles, 'close').reverse();

    // const VI = sortedVol.indexOf(prev);


    const prelast = candles[n - 2];

    // if ((last.to - last.from) !== (prelast.to - prelast.from)) console.error(' not full last ', last, prelast)


    const vols = candles.map(function (o) {
      return o.Volume;
    });

    const closes = candles.map(function (o) {
      return o.close;
    });
    /*
        const tradesNums = candles.map(function (o) {
          return o.Trades;
        });

        const tradesNumsMed = MATH.median(tradesNums)*/
    ;

    const minClose = _.min(closes);


    // const LH = last.high;
    const lastV = last.Volume;


    let minutes = (last.to - prev.to) / 60000;

    const S = (prev.Trades / minutes).toPrecision(3);
    const maxPrice = _.max(closes);


    const medPrice = MATH.median(closes);

    // const price20 = _.mean(closes.slice(-20).slice(0, 10));
    // const avg10 = _.mean(closes.slice(-10));
    //  const medV = MATH.median(vols);

    const meanV = Math.round(_.mean(vols));

    let msg = '';
    let isRed = false;


    // const PD1h = MATH.percent(avg10, price20);  // MATH.percent(LH, maxPrice);
    // console.log(market, avg10, medPrice)
    const maxVolumeCandle = _.first(sortedVol);

    //const tempSup = maxVolumeCandle.low;
    // const tempRes = maxVolumeCandle.high;


    //const BtempSup = MATH.percent(last.close, tempSup);
    // const BtempRes = MATH.percent(last.close, tempRes);

    const maxVperc = MATH.percent(maxVolumeCandle.Volume, meanV);
    //if(BtempSup < 0 || BtempRes > 0)
    // console.log(market + ' ' + maxVperc, maxVolumeCandle);


    const Pmed = MATH.percent(last.high, medPrice);

    const Pprev = MATH.percent(last.close, prev.close);
    const Pall = MATH.percent(last.close, first.close);

    const V3 = Math.round(_.sum(_.takeRight(vols, 3)) / 3);

    const PV3 = MATH.percent(V3, meanV);// MATH.percent(lastV, meanV);
    // const VMD = MATH.percent(lastV, medV);

    const time = moment().format('HH:mm');
    const ts = moment(last.to).format('HH:mm');
    const x = 'x';
    const rank = coinMC ? coinMC.rank : -1;
    const resSup: ResistanceSupport = new ResistanceSupport(candles);

    let resistance: VOCandle[] = await resSup.getResistance(candles.slice(0, -1));

    resistance = _.take(_.orderBy(resistance, 'high').reverse(), 3);

    let resist = _.map(resistance, 'high');

    /*const RS = resistance.map(function (o) {
      return o.high + ' ' + o.time;
    })
 */

    const resAvg = _.last(resist);//_.mean(resist);
    const resFirst = _.first(resist);


    const BrRes = MATH.percent(last.high, resAvg);

    const FstRes = MATH.percent(last.high, resFirst);

    const P = last.high;

    // console.log(last.high, resAvg, BR);

    const AMPL = MATH.percent(last.close, minClose);

    const out = {time, ts, market, rank, BrRes, FstRes, Pprev, Pmed, Pall, AMPL, PV3, S, P, x};


    const myData = {
      resAvg,
      resist,
      candles,
      last,
      sortedVol,
      sortedPrice,
      vols,
      closes
    }

    if (notify && out.BrRes >= 0) {
      notify(out);
    }

    if (addExclude) {
      if (out.AMPL > 10) {
        addExclude(exchange, market, 'AMPL ' + out.AMPL, 4);
      } else if (out.AMPL > 5) {
        addExclude(exchange, market, 'AMPL ' + out.AMPL, 4);
      } else if (out.BrRes < -10) {
        addExclude(exchange, market, 'BR ' + out.BrRes, 5);
      } else if (out.BrRes < -5) {
        addExclude(exchange, market, 'BR ' + out.BrRes, 2);
      } else if (out.BrRes < -2) {
        addExclude(exchange, market, 'BR ' + out.BrRes, 1);
      }
    }


    CandlesAnalys1.data = data;
    CandlesAnalys1.analysData = myData;
    return out

    // return (data.PD > 0 && data.VD > 50 && data.VI < 10);
  }
}
