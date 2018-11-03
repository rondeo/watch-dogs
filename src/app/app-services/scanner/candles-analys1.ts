import {VOCandle} from '../../models/api-models';
import {VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import * as moment from 'moment';
import {ResistanceSupport} from '../../trader/libs/levels/resistance-support';


export class CandlesAnalys1 {


 static  isTrendUp(market: string, candles: VOCandle[]){
    const closes = CandlesAnalys1.closes(candles);
    const meds = CandlesAnalys1.meds(candles);

    const ma99 = _.mean(closes);
    const ma7 =  _.mean(_.takeRight(closes, 7));
    const ma25 = _.mean(_.takeRight(closes, 25));


    const lastHours: number[] = _.takeRight(closes, 12);

    const priceLast24 = _.mean(lastHours);

    // const priceFirst24 = _.mean(_.take(closes, 24));

    const progress1 = MATH.percent(ma25, ma99);

    const progress2 = MATH.percent(ma7, ma25);

    //  const last3 = _.mean(_.takeRight(closes, 3));

    const last = _.last(lastHours);

    const meanlastHours = _.mean(lastHours);

    const max = _.max(lastHours);
    const min = _.min(lastHours);

    const percent = MATH.percent(last, meanlastHours);

    const maxD = MATH.percent( last, max);
    const minD = MATH.percent( last, min);

    const result = ' p: '+ percent + ' max: ' + maxD + ' min: ' + minD + ' pr: ' + progress1 +' pr: ' + progress2;

    if (progress1 + progress2 > 0) {
      return {
        market,
        result,
        OK:true
      }
    }
   return {
     market,
     result,
     OK:false
   }
  }



  static isFall(numbers: number[]){
    const speeds = MATH.speeds(numbers);
    return MATH.isFall(speeds);
  }





  static volumes(candles: VOCandle[]) {
    return _.map(candles, 'Volume');
  }

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
    const d = MATH.percent(nextPrice, pricePrev);
    const a = d > -0.2?'BUY':'SELL';
    // const d = MATH.percent(max.close, max.open);

    const m = [pricePrev,nextPrice]
    return {t,p,a,d,m};
  }




  static lastPrice(prices: number[]) {
    const mean = MATH.median(prices);
    const last =  _.last(prices);
    return MATH.percent(last, mean);
  }


  static volumeJump(candles: VOCandle[]):{t:string, p:number, a:string, d:number}[] {
    const vols = _.orderBy(_.filter(candles, 'Volume'), 'Volume').reverse();
    const median = vols[Math.round(vols.length/2)].Volume;
    return vols.slice(0,3).map(function (o) {
      return CandlesAnalys1.makeValues(o, median, candles);
    });
  }

  static pumpedUp(candles: VOCandle[]){
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
  static oc(candles: VOCandle[]): number[] {
    return candles.map(function (o) {
      return (o.open + o.close) / 2;
    });
  }

  static closes(candles: VOCandle[]): number[] {
    return candles.map(function (o) {
      return o.close;
    });
  }

  static analysData;
  static data;



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


  static MA3(prices: number[]) {
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
