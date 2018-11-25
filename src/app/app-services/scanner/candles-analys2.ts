import {VOCandle} from '../../models/api-models';
import {VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import * as moment from 'moment';
import {ResistanceSupport} from '../../trader/libs/levels/resistance-support';

export class CandlesAnalys2 {

  static async analyze(data: { exchange: string, market: string, candles: VOCandle[] }, coinMC: VOMarketCap, addExclude, notify) {

    const exchange = data.exchange;
    const market = data.market;
    const candles = data.candles;
    const n = candles.length;   
    let last = _.last(candles);
    let first = _.first(candles);
    const sortedVol = _.orderBy(candles, 'Volume').reverse();
    const sortedPrice = _.orderBy(candles, 'close').reverse();
    const sortedLows =  _.orderBy(candles, 'low');

    const low3 = _.mean([sortedLows[0].low, sortedLows[1].low, sortedLows[3].low]);

    const prelast = candles[n - 2];

    const vols = candles.map(function (o) {
      return o.Volume;
    });

    const closes = candles.map(function (o) {
      return o.close;
    });

    const minClose = _.min(closes);

    const lastV = last.Volume;

    let minutes = (last.to - prelast.to) / 60000;

    const S = (prelast.Trades / minutes).toPrecision(3);
    const maxPrice = _.max(closes);


    const medPrice = MATH.median(closes);

    // const price20 = _.mean(closes.slice(-20).slice(0, 10));
    // const avg10 = _.mean(closes.slice(-10));
    //  const medV = MATH.median(vols);

    const meanV = Math.round(_.mean(vols));


    const maxVolumeCandle =  _.first(sortedVol);

    const maxVperc = MATH.percent(maxVolumeCandle.Volume, meanV);
    // if(BtempSup < 0 || BtempRes > 0)
    // console.log(market + ' ' + maxVperc, maxVolumeCandle);


    const Pmed = MATH.percent(last.high, medPrice);

    const Pprev = MATH.percent(last.close, prelast.close);
    const Pall = MATH.percent(last.close, first.close);

    const V3 = Math.round(_.sum(_.takeRight(vols, 3)) / 3);

    const PV3 = MATH.percent(V3, meanV); // MATH.percent(lastV, meanV);
    // const VMD = MATH.percent(lastV, medV);

    const time = moment().format('HH:mm');
    const ts = moment(last.to).format('HH:mm');
    const x = 'x';
    const rank = coinMC ? coinMC.rank : -1;
   /* const resSup: ResistanceSupport = new ResistanceSupport(candles);

    let resistance:VOCandle[] =  await resSup.getResistance(candles.slice(0,-1));

    resistance = _.take(_.orderBy(resistance, 'high').reverse(), 3);

    let resist= _.map(resistance,'high');


    const resAvg = _.last(resist);//_.mean(resist);
    const resFirst = _.first(resist);


    const BrRes =  MATH.percent(last.high, resAvg);

    const FstRes = MATH.percent(last.high, resFirst);
*/
    const P = last.high;

    // console.log(last.high, resAvg, BR);

    const AMPL = MATH.percent(last.close, minClose);


    const LowP = MATH.percent(prelast.low, low3);



    const out = {time, ts, market, rank, LowP, Pprev, Pmed, Pall, AMPL, PV3, S, P, x};


    if (notify) {
      if (LowP < 1) notify(out);
    }



    const myData = {
      candles,
      last,
      sortedVol,
      sortedPrice,
      vols,
      closes
    };


   /* if(addExclude){
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
      }
    }*/
    return out;
  }
}
