import {VOCandle} from '../../models/api-models';
import {VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import * as moment from 'moment';
import {ResistanceSupport} from '../../trader/libs/levels/resistance-support';

export class CandlesAnalys1 {
  static analysData;
  static data;

  static async analyze(data: { exchange: string, market: string, candles: VOCandle[] }, coinMC: VOMarketCap, addExclude, notify) {
    const exchange = data.exchange;
    const market = data.market;
    const candles = data.candles;
    const n = candles.length;
    let last = _.last(candles);
    let first = _.first(candles);

    const prev = candles[n-2];
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

    const tradesNumsMed = MATH.median(tradesNums)*/;

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
    const maxVolumeCandle =  _.first(sortedVol);

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

    const V3 = Math.round(_.sum(_.takeRight(vols, 3))/3);

    const PV3 = MATH.percent(V3, meanV);// MATH.percent(lastV, meanV);
    // const VMD = MATH.percent(lastV, medV);

    const time = moment().format('HH:mm');
    const ts = moment(last.to).format('HH:mm');
    const x = 'x';
    const rank = coinMC ? coinMC.rank : -1;
    const resSup: ResistanceSupport = new ResistanceSupport(candles);

    let resistance:VOCandle[] =  await resSup.getResistance(candles.slice(0,-1));

    resistance = _.take(_.orderBy(resistance, 'high').reverse(), 3);

   let resist= _.map(resistance,'high');

   /*const RS = resistance.map(function (o) {
     return o.high + ' ' + o.time;
   })
*/

    const resAvg = _.last(resist);//_.mean(resist);
    const resFirst = _.first(resist);


    const BrRes =  MATH.percent(last.high, resAvg);

    const FstRes = MATH.percent(last.high, resFirst);

    const P = last.high;

    // console.log(last.high, resAvg, BR);

    const AMPL = MATH.percent(last.close, minClose);

    const out = {time, ts, market, rank, BrRes,FstRes, Pprev, Pmed, Pall, AMPL, PV3, S,P, x};


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

    if(addExclude){
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
      } else if (out.BrRes > 0) {
        notify(out);
        // console.log(lastHigh, lastV);
        // console.log(maxPrice, medV, meanV);
      }
    }


    CandlesAnalys1.data = data;
    CandlesAnalys1.analysData = myData;
    return out

    // return (data.PD > 0 && data.VD > 50 && data.VI < 10);
  }
}
