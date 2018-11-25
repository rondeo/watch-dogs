import {VOCandle} from '../../models/api-models';
import {VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import * as moment from 'moment';
import {ResistanceSupport} from '../../trader/libs/levels/resistance-support';
import {UTILS} from '../../com/utils';
import {StorageService} from '../../services/app-storage.service';


export class CandlesAnalys1 {

  static isTrendDownUp(candles: VOCandle[]) {
    const closes = CandlesAnalys1.closes(candles);
    const last = _.last(candles);
    const time = moment(last.to).format('HH:mm');
    const breakPoint = 25;
    // const before = closes.slice(0, - breakPoint);
    // const after = closes.slice(breakPoint);

    const ma99 = _.mean(_.takeRight(closes, 99));
    const ma7 = _.mean(_.takeRight(closes, 7));
    const ma25 = _.mean(_.takeRight(closes, 25));
    // const ma25_99 = MATH.percent(ma25, ma99);
    // const ma7_25 = MATH.percent(ma7, ma25);
    return {
      time,
      ma7,
      ma25,
      ma99
    }
  }

  static vols(candles: VOCandle[]) {
    const volumes = CandlesAnalys1.volumes(candles);
    const vmed = MATH.median(_.takeRight(volumes, 99));
    const v7 = _.mean(_.takeRight(volumes, 7));
    const v3 = _.mean(_.takeRight(volumes, 3));
    const v25 = _.mean(_.takeRight(volumes, 25));

    return {
      v3,
      v7,
      v25,
      vmed
    }
  }

  static mas(candles: VOCandle[]) {
    const closes = CandlesAnalys1.closes(candles);
    const ma99 = _.mean(_.takeRight(closes, 99));

    const ma7 = _.mean(_.takeRight(closes, 7));
    const ma3 = _.mean(_.takeRight(closes, 3));
    const ma25 = _.mean(_.takeRight(closes, 25));

    return {
      ma3,
      ma7,
      ma25,
      ma99
    }
  }


  static isFall(numbers: number[]) {
    const speeds = MATH.speeds(numbers);
    return MATH.isFall(speeds);
  }


  static volumes(candles: VOCandle[]) {
    return _.map(candles, 'Volume');
  }

  static makeValues(max, median, candles: VOCandle[]) {
    const ind = candles.indexOf(max);
    let prev: VOCandle;
    let next: VOCandle;
    if (ind === candles.length - 1) {
      prev = candles[ind - 1];
      next = candles[ind];
    } else if (ind === 0) {
      prev = candles[ind];
      next = candles[ind + 1];
    } else {
      prev = candles[ind - 1];
      next = candles[ind + 1];
    }

    const pricePrev = (prev.high + prev.low) / 2;
    const nextPrice = (next.high + next.low) / 2;


    const t = moment(max.to).format('HH:mm');
    const p = MATH.percent(max.Volume, median);
    const d = MATH.percent(nextPrice, pricePrev);
    const a = d > -0.2 ? 'BUY' : 'SELL';
    // const d = MATH.percent(max.close, max.open);

    const m = [pricePrev, nextPrice]
    return {t, p, a, d, m};
  }


  static lastPrice(prices: number[]) {
    const mean = MATH.median(prices);
    const last = _.last(prices);
    return MATH.percent(last, mean);
  }


  static volumeJump(candles: VOCandle[]): { t: string, p: number, a: string, d: number }[] {
    const vols = _.orderBy(_.filter(candles, 'Volume'), 'Volume').reverse();
    const median = vols[Math.round(vols.length / 2)].Volume;
    return vols.slice(0, 3).map(function (o) {
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


  static getVolumePrice(patterns: any[]){
    const largeVolume = patterns.find(function (item) {
      return item.state.indexOf('LARGE-VOLUME') !== -1 || item.state.indexOf('HUGE-VOLUME') !==-1;
    });

    let price = 0;
    if(largeVolume) price = largeVolume.P;
    return price;
  }

  static createAction(patterns: {state:string, t:string, stamp: number}[], lastOrder: {stamp: number, action: string, price:number}) {
    if (patterns.length < 3) return '';
    const last = _.first(patterns);
    console.log(last.t, last.state);
    const prev = patterns[1];






  /*  if(prev.state === 'WATCH-TO-BUY') {
      if(last.state.indexOf('DOWN') !== -1){
        last.state = 'WATCH-TO-BUY';
        return 'WATCH-TO-BUY';
      }
    }*/

    if (last.state === 'DROP_LARGE-VOLUME') return 'SELL';
    if (last.state === 'DROP_WITH-VOLUME') return 'SELL';
    if (last.state === 'DOWN_LARGE-VOLUME') return 'SELL';

  const drop = _.find(patterns, function (item) {
    return item.state.indexOf('DROP') !==-1;
  });



  if(drop){
    const min = moment(last.stamp).diff(drop.stamp, 'minutes');
    if(min < 30){
      return 'WAIT-AFTER_DROP'
     //  console.log(' WAS DROP ' + min + ' m ago');
    }
  }




    if(last.state === 'UP_WITH-VOLUME') return 'BUY';




   /* if (prev.state === 'DROP_LARGE-VOLUME' && last.state === 'STAY_LARGE-VOLUME') {
      last.state = 'WATCH-TO-BUY';
      return 'WATCH-TO-BUY'
    }*/
   /* if (last.state === 'UP_WITH-VOLUME') {


      return '';
    }*/


    return null;
  }

  static createPattern(patterns: {state: string}[], lastResult: {state: string}) {
    if (patterns.length < 2) {
      patterns.unshift(lastResult);
      return patterns;
    }

    const last = patterns[0];
    const prelast = patterns[1];

    if (patterns[0].state === patterns[1].state && patterns[0].state === lastResult.state) {
      patterns.shift();
    }
    patterns.unshift(lastResult);

    /* if(last.state === 'STAY_AVG-VOLUME' && lastResult.state ==='STAY_AVG-VOLUME') {
      patterns.pop();
     }

     if(last.state === 'DOWN_WITH-VOLUME' && lastResult.state ==='DOWN_WITH-VOLUME') {
       patterns.pop();
     }



     if(last.state === 'DROP_LARGE-VOLUME' && lastResult.state ==='DROP_LARGE-VOLUME') {
       patterns.pop();
     }*/


    if (patterns.length > 600) patterns.pop();



    const states = patterns.map(function (item) {
      return item.state;
    });

    // console.log(states);
    console.log(_.clone(patterns));
    return patterns;
  }


  static async createState(candles: VOCandle[]) {
    const lastCandle = _.last(candles);
    const t = moment(lastCandle.to).format('HH:mm');
    const stamp = lastCandle.to;
    const closes = CandlesAnalys1.closes(candles);
    const volumes = CandlesAnalys1.volumes(candles);

    const P = +_.mean(_.takeRight(closes, 3)).toPrecision(3);

    const lastVolume = _.mean(_.takeRight(volumes, 3));

    const preLastVolume = _.mean(_.take(_.takeRight(volumes, 6), 3));

    const preLastPrice = closes[closes.length - 4];

    const PD = MATH.percent(P, preLastPrice);

    const VD = MATH.percent(lastVolume, preLastVolume);

    const mas = CandlesAnalys1.mas(candles);
    const vols = CandlesAnalys1.vols(candles);

    const ma3_25 = MATH.percent(mas.ma3, mas.ma25);
    const ma25_99 = MATH.percent(mas.ma25, mas.ma99);
    const v3_25 = +MATH.percent(vols.v3, vols.v25).toPrecision(1);
    const v3_med = +MATH.percent(vols.v3, vols.vmed).toPrecision(2);


    //const actionValues = await storage.select('action-values');
    const curr = {v3_med, PD, ma3_25, ma25_99, VD, v3_25, P, t, stamp, state: ''};

    let volume = 'AVG-VOLUME';
    let price = 'STAY';

    if (curr.v3_med < 20) volume = 'NO-VOLUME';
    else if (curr.v3_med > 1000) volume = 'HUGE-VOLUME';
    else if (curr.v3_med > 500) volume = 'LARGE-VOLUME';
    else if (curr.v3_med > 100) volume = 'WITH-VOLUME';


    if (curr.PD > 2) price = 'JUMP';
    else if (curr.PD > 0.4) price = 'UP';
    if (PD < -2) price = 'FAST-DROP';
    else if (PD < -1) price = 'DROP';
    // else if(ma3_25 < -2 && curr.PD < 0) price = 'DROP';
    else if ((PD < -0.4) || (ma3_25 < -0.5)) price = 'DOWN';

    curr.state = price + '_' + volume;
   //  console.log(curr);
    return curr;
  }

  static analyseVolume(candles: VOCandle[]) {
    const last = _.last(candles);
    const closes = CandlesAnalys1.closes(candles);
    const ma25 = _.mean(_.takeRight(closes, 25));

    const byVolume = _.orderBy(candles, 'Volume');
    const max: VOCandle = byVolume.pop();
    const volumePrice = (max.high - max.low) / 2;
    const ind = candles.indexOf(max);

    const change = MATH.percent(last.close, volumePrice)
    return change;
  }

  static decode(candle: VOCandle) {
    const body = Math.abs(candle.open - candle.close);
    const isUp = candle.open < candle.close;
    const wick = candle.high - (isUp ? candle.close : candle.open);
    const tail = (isUp ? candle.open : candle.close) - candle.low;
    const range = candle.high - candle.low;
    return {
      body,
      wick,
      tail,
      range
    }

  }
}
