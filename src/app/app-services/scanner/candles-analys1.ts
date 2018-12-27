import {VOCandle} from '../../models/api-models';
import {VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import * as moment from 'moment';
import {ResistanceSupport} from '../../trader/libs/levels/resistance-support';
import {UTILS} from '../../com/utils';
import {StorageService} from '../../services/app-storage.service';


export class CandlesAnalys1 {

  static analysData;
  static data;

  static from15mTo1h(closes:number[]){
    const out = [];
    for(let i = closes.length -1; i>=0; i-=4){
      out.push(closes[i]);
    }
    return out.reverse();
  }


  static update15minCandles(candles1m: VOCandle[], candles15m: VOCandle[], market?:string) {

    const lastFrom = moment().subtract(moment().minutes() % 15, 'minutes').second(0).valueOf();//.format('HH:mm:ss');

    const prevFrom = moment(lastFrom).subtract(15, 'minutes').valueOf();
    const to = moment().valueOf();


    const prev15min1m: VOCandle[] = candles1m.filter(function (item) {
      return item.to > prevFrom && item.to < lastFrom;
    });

    const last15min1m = candles1m.filter(function (item) {
      return item.to > lastFrom;
    });

    candles15m = candles15m.filter(function (item) {
      return item.to < prevFrom;
    });

   //  console.log(market + ' prev ' + prev15min1m.length + ' last15min1m ', last15min1m);

    const prev = CandlesAnalys1.createCandle(prev15min1m);
    const last = CandlesAnalys1.createCandle(last15min1m);

    candles15m.push(prev);
    candles15m.push(last);

    const err = CandlesAnalys1.checkCandles(candles15m.slice(0, -1), 15 * 60000);

    if(err.length){
      console.error(err, candles15m);
    }

    return candles15m;

  }

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
    };
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
    };
  }

  static mas(candles: VOCandle[], closes?: number[]) {
   if(!closes) closes = CandlesAnalys1.closes(candles);
    const ma99 = _.mean(_.takeRight(closes, 99));

    const ma7 = _.mean(_.takeRight(closes, 7));
    const ma3 = _.mean(_.takeRight(closes, 3));
    const ma25 = _.mean(_.takeRight(closes, 25));

    return {
      ma3,
      ma7,
      ma25,
      ma99
    };
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

    const m = [pricePrev, nextPrice];
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


  static getVolumePrice(patterns: any[]) {
    const largeVolume = patterns.find(function (item) {
      return item.state.indexOf('LARGE-VOLUME') !== -1 || item.state.indexOf('HUGE-VOLUME') !== -1;
    });

    let price = 0;
    if (largeVolume) price = largeVolume.P;
    return price;
  }

  static createAction(market: string, patterns: { P: number, state: string, t: string, stamp: number, Pwas: number }[],
                      lastOrder: { stamp: number, action: string, price: number }, support): { action: string, reason: string } {
    if (patterns.length < 3) return null;
    const last = _.first(patterns);
    //  console.log(last.t, last.state);
    const prev = patterns[1];


    /*  if(prev.state === 'WATCH-TO-BUY') {
        if(last.state.indexOf('DOWN') !== -1){
          last.state = 'WATCH-TO-BUY';
          return 'WATCH-TO-BUY';
        }
      }*/
    const lastState = last.state;

    if (lastState === 'DROP_LARGE-VOLUME') return {
      action: 'SELL',
      reason: 'DROP_LARGE-VOLUME'
    };
    if (lastState === 'DROP_WITH-VOLUME') return {
      action: 'SELL',
      reason: 'DROP_WITH-VOLUME'
    };
    if (lastState === 'DOWN_LARGE-VOLUME') return {
      action: 'SELL',
      reason: 'DOWN_LARGE-VOLUME'
    };

    const lastDown = patterns.find(function (item) {
      return (item.state.indexOf('DOWN') !== -1 || item.state.indexOf('DROP') !== -1) && (item.state.indexOf('NO-VOLUME') === -1) && (item.state.indexOf('AVG-VOLUME') === -1);
    });

    if (lastDown) {
      const stayWithVolume = ['STAY_HUGE-VOLUME', 'STAY_WITH-VOLUME', 'STAY_LARGE-VOLUME'];
      if (stayWithVolume.indexOf(lastState) !== -1) {
        if (last.P > lastDown.Pwas) {
          return {
            action: 'BUY',
            reason: 'lastDown ' + lastDown.P + ' NOW ' + last.P
          };
        }
      }
    }


    // console.log(market, lastDown);


    /* const drop = _.find(patterns, function (item) {
       return item.state.indexOf('DROP') !== -1;
     });


     if (drop) {
       const min = moment(last.stamp).diff(drop.stamp, 'minutes');
       if (min < 30) {
         return 'WAIT-AFTER_DROP';
         //  console.log(' WAS DROP ' + min + ' m ago');
       }
     }
 */
    if (last.state === 'UP_WITH-VOLUME') return {
      action: 'BUY',
      reason: 'UP_WITH-VOLUME'
    };

    if (last.state === 'UP_HUGE-VOLUME') return {
      action: 'BUY',
      reason: 'UP_HUGE-VOLUME'
    };
    if (last.state === 'UP_LARGE-VOLUME') return {
      action: 'BUY',
      reason: 'UP_HUGE-VOLUME'
    };


    /* if (prev.state === 'DROP_LARGE-VOLUME' && last.state === 'STAY_LARGE-VOLUME') {
       last.state = 'WATCH-TO-BUY';
       return 'WATCH-TO-BUY'
     }*/
    /* if (last.state === 'UP_WITH-VOLUME') {


       return '';
     }*/


    return null;
  }

  static groupPatterns(patterns: { state: string }[], lastResult: { state: string }) {
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
    return patterns;
  }

  static isToBuy(candles: VOCandle[]) {
    candles = CandlesAnalys1.createCandlesX5(candles);

  }

  static checkCandles(candles: VOCandle[], interval: number) {
    let prev = _.first(candles).to - interval;
    const err = [];
    candles.forEach(function (item, i) {
      const next = prev + interval;
      const diff = Math.round(Math.abs(item.to - next) / 30000);
      if (diff) err.push(i);
      prev = item.to;
    });
    return err;
  }

  static createCandle(candles:VOCandle[]): VOCandle{
    const open = _.first(candles).open;
    const close = _.last(candles).close;
    const to = _.last(candles).to;

    const Volume = candles.reduce(function (s, item) {
      return s+=item.Volume
    }, 0);

    return {
      from:0,
      to,
      time: moment(to).format('HH:mm'),
      open,
      close,
      Volume,
      high:0,
      low:0
    }

  }

  static createCandlesX5(candles: VOCandle[]) {
    const out: VOCandle[] = [];
    let j = 0;
    let cur = candles[0];
    for (let i = 1, n = candles.length; i < n; i++) {
      const next = candles[i];
      if (j === 5) {
        out.push(cur);
        cur = next;
        j = 0;
      } else {
        cur.Volume += next.Volume;
        cur.Trades += next.Trades;
        cur.close = next.close;
        cur.to = next.to;
        cur.time = next.time;
      }
      j++;
    }
    if (j) out.push(cur);
    return out;
  }


  static isToSell(mas, vols) {

    const ma3_25 = MATH.percent(mas.ma3, mas.ma25);
    const v3_25 = +MATH.percent(vols.v3, vols.v25).toPrecision(1);
    const v3_med = +MATH.percent(vols.v3, vols.vmed).toPrecision(2);
    const ma7_99 = MATH.percent(mas.ma7, mas.ma99);
    let action = null;
    const reason =' v3_m ' + v3_med +  ' 3_25 ' + ma3_25 + ' 7_99 '+ ma7_99;

    if (ma3_25 < -0.5 && v3_med > 1000) {
      action = 'SELL';
    } else if (ma3_25 < -0.7 && v3_med > 500) {
      action = 'SELL';
    }

    return {action, reason};
  }

  static async createState(mas, vols, candles: VOCandle[]) {
    const lastCandle = _.last(candles);
    const t = moment(lastCandle.to).format('HH:mm');
    const stamp = lastCandle.to;
    const closes = CandlesAnalys1.closes(candles);

    const Pwas = _.mean(_.take(_.takeRight(closes, 8), 3));

    const ma7 = mas.ma7;
    const PD = MATH.percent(mas.ma3, Pwas);
    const ma3_25 = MATH.percent(mas.ma3, mas.ma25);
    const ma7_99 = MATH.percent(mas.ma7, mas.ma99);
    const ma25_99 = MATH.percent(mas.ma25, mas.ma99);
    const v3_25 = +MATH.percent(vols.v3, vols.v25).toPrecision(1);
    const v3_med = +MATH.percent(vols.v3, vols.vmed).toPrecision(2);
    // const actionValues = await storage.select('action-values');
    const curr = {v3_med, PD, ma3_25, ma25_99, v3_25, ma7_99, stamp, ma7, state: ''};

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

    const change = MATH.percent(last.close, volumePrice);
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
    };

  }

  isDive(candles: VOCandle[]) {
    const last = _.last(candles);
    const prelast = candles[candles.length - 2];
    const lastmed = (last.high + last.low) / 2;
    const prelastmed = (prelast.high + prelast.low) / 2;

  }

  static getCandelsVolumes(market: string, candles: VOCandle[], diff: number) {
    const volumes = CandlesAnalys1.volumes(candles);
    const vMed = MATH.median(volumes);
    const criteria = vMed * diff / 100;

    let prev = -2;
    const volumeCandles: any[] = [];

    candles.forEach(function (item, i) {
      const isVolume = item.Volume > criteria;
      if (isVolume) {
        if ((prev + 1) === i) {
          const prevCandle = _.last(volumeCandles);
          prevCandle.Volume += item.Volume;
          prevCandle.close = item.close;
          prevCandle.time = moment(item.to).format('HH:mm');

        }
        else {
          prev = i;
          volumeCandles.push({
            time: moment(item.to).format('HH:mm'),
            market,
            open: item.open,
            close: item.close,
            Volume: item.Volume,

          });
        }
      }

    });

    volumeCandles.forEach(function (item) {
      item.PD = MATH.percent(item.close, item.open);
      item.Volume = MATH.percent(item.Volume, vMed);
    });

    return volumeCandles;
  }


  static getDropWithVolume(market: string, candles: VOCandle[], diff: number) {
    const volumes = CandlesAnalys1.volumes(candles);
    const closes = CandlesAnalys1.closes(candles);
    const vMed = MATH.median(volumes);

    const results = candles.filter(function (item) {
      return (item.Volume > (diff * vMed) && item.open > item.close);
    });

    return results.map(function (item) {
      return {
        market,
        PD: MATH.percent(item.close, item.open),
        VD: MATH.percent(item.Volume, vMed)
      }
    });

  }
}
