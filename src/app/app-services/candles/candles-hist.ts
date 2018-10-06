import {ApisPublicService} from '../../apis/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {Subject} from 'rxjs/Subject';
import {VOCandle, VOCandleExt} from '../../models/api-models';
import * as _ from 'lodash';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {MATH} from '../../com/math';
import * as moment from 'moment';

export enum SignalCandle {
  LOW_VERY = 'SLOW_VERY',
  LOW = 'SLOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  HIGH_VERY = 'HIGH_VERY'
}

export class CandlesHist {
  coinPriceUS: number;

  signalStatsSub: Subject<any> = new Subject();
  signalAlertSub: Subject<any> = new Subject();
  top10CandlesSub: Subject<VOCandle[]> = new Subject();
  volumeAlertSub: Subject<any> = new Subject();
  last: VOCandle;
  oneMinuteCandlesSub: BehaviorSubject<VOCandle[]> = new BehaviorSubject(null);
  newCandleSub: Subject<VOCandle> = new Subject();
  key1: string;

  maxCandle: VOCandle;
  volumeCandles: VOCandle[]= [];

  lastAlert:VOCandle;

  constructor(
    private exchange: string,
    private market: string,
    private apisPublic: ApisPublicService,
    private storage: StorageService,
    private length = 120
  ) {
    this.key1 = 'oneminutecandle-' + exchange + '_' + market;
    storage.select('volumeCandles'+ this.exchange + this.market).then(res => this.volumeCandles= res || []);
  }


  async start() {
    console.log('START CandlesHist one minute candle')
    let data: VOCandle[] = await this.storage.select(this.key1);
    if (data) {
      const last = _.last(data).to;
      if (Date.now() - last > 5 * 60 * 1000) {
        console.log(' DATA too old');
        data = null;
      }

    }
    if (!data) data = await this.downloadAllCandles();
    this.oneMinuteCandlesSub.next(data);
    setInterval(() => this.downloadLastCandle(), 61000);
  }

  //{from: 1538356860000, to: 1538356919999, open: 6662.1, high: 6663.35, low: 6658.19, …}


  isWaterFall(candles: VOCandle[]){
    candles =  _.takeRight(candles, 7);
    const first = candles[0];
    let prev = (first.high + first.low) /2;
    for(let i = 1, n= candles.length; i<n; i++) {
      const next = candles[i];
      const cur = (next.high + next.low)/2;
      if(cur > prev) return false;
      prev = cur;
    }
    return true;
  }

  whatLevel2(candles: VOCandle[]){
    const n = candles.length;
    const last:VOCandle = candles[n-1];
    const prelast: VOCandle = candles[n-2];
    const latMid = (last.high + last.low)/2;
    const prelastMid = (prelast.high + prelast.low)/2;
   return Math.round(10000 * (latMid - prelastMid)/prelastMid)/100;
    //const preprelast: VOCandle = candles[n-3];
  }

  whatLevel(candles: VOCandle[]){
    const n = candles.length;
    const last:VOCandle = candles[n-1];
    const prelast: VOCandle = candles[n-2];
    if(last.close < prelast.close) {
      return 100*(last.low - prelast.high)/last.close
    } else {
      return 100*(last.high - prelast.low)/last.close
    }
    //const preprelast: VOCandle = candles[n-3];
  }


  isGoingUp(candles: VOCandle[]){
    candles = _.takeRight(candles, 3);
    const first = candles[0];
    let prev = (first.high + first.low) /2;
    const firstValue = prev;
    for(let i = 1, n= candles.length; i<n; i++) {
      const next = candles[i];
      const cur = (next.high + next.low)/2;
     //  console.log(cur, prev);
      if(cur < prev) return Math.round(10000 * (cur - prev)/prev)/100;
      prev = cur;
    }

    return Math.round(10000 * (prev - firstValue)/firstValue)/100;
  }

  acceliration(vals: number[]){
    const n = vals.length
    const last = vals[n-1];
    const pre = vals[n-2];
   // const prepre = vals[n-3];
    const D0 = last - pre;
    const D1 = pre;  // Math.abs(pre - prepre);
    return MATH.percent(D0, D1);
  }

  consolidationLevel2(candles: VOCandle[]): VOCandle{
    let sum = 0;
    let num =0;
    for(let i = candles.length-1; i>=0; i--){
      const cur = candles[i];
      num++;
      const curPrice = (cur.high + cur.low /2);
      sum+= curPrice;
      const avg = sum/num;
      if(100* Math.abs(curPrice - avg)/avg > 0.2) return cur;
    }
    return _.first(candles) ;
  }

  consolidationLevel(candles: VOCandle[]){
    for(let i = candles.length-1; i>=0; i--){
      const cur = candles[i];
      if(100*(cur.close - cur.open)/cur.open > 0.1) return (candles.length - i);
    }
    return 100;
  }

/*
  lastVolumeCandle(candles: VOCandle[]){
    let sum = 0;
    let num =0;
    for(let i = candles.length-1; i>=0; i--){
      const cur = candles[i];
      num++;
      const curV = cur.Volume
      sum+= curV;
      const avg = sum/num;
      if(100* Math.abs(curV - avg)/avg > 300) return cur;
    }
    return -1;
  }

  lastLageVolume(sortedByVolume:VOCandle[]){
    sortedByVolume = _.take(sortedByVolume, 10);
    console.log(_.clone(sortedByVolume));
    const ordered = _.orderBy(sortedByVolume, 'timestamp');
    return _.last(ordered);
  }
*/



 async  analyze(data: VOCandle[]) {
    await Promise.resolve();
    const last = _.last(data);

    const vols = data.map(function (o) {
      return o.Volume;
    });

    const meds: number[] = data.map(function (o) {
      return (o.high + o.low)/2;
    });


  // const mean = Math.round(_.mean(vols));

   const accel= this.acceliration(meds);

   const medPrice = MATH.median(meds.slice(0));

   const lastPrice = (last.high + last.low)/2;

   const direction = Math.round(1e4 * (lastPrice - medPrice)/medPrice)/1e2;


   console.log('%c '+moment().format('HH:mm'), 'color:green');


   //console.log(' mean ' + mean + ' lastV '+ last.Volume);

    const hights = data.map(function (o) {
      return o.high;
    });


    //const isUp = this.isGoingUp(data);
    const waterfall = this.isWaterFall(data);

    //const consold:VOCandle = this.consolidationLevel2(data);
   const whatLevel = this.whatLevel2(data);

   // console.log('%c '+moment().format('HH:mm')+' waterfall ' + waterfall + '  isup '+ isUp + ' level ' + whatLevel + '%', 'color:red');
    // this.signalStatsSub.next('waterfall');
    const sorted = _.sortBy(data, 'Volume').reverse();
    const index = sorted.indexOf(last);

    const openclose = Math.round(1e4 * ((last.close - last.open) / last.open))/1e2;

    const priceD = Math.round(1e4 * ((last.high - last.low) / last.low))/1e2;

    const cFull = Math.abs(last.high - last.low);
    const cBody = Math.abs(last.open - last.close);

   const body = Math.round(1e4 * (cBody) / cFull)/1e2;

    const out = {direction, accel, openclose, priceD, body,  index};

    console.log(out);
    if(index < 20){

      const candleExt =  Object.assign(out, last);
      this.volumeCandles.push(candleExt);
      if(this.volumeCandles.length > 20) this.volumeCandles.shift();
      this.storage.upsert('volumeCandles'+ this.exchange + this.market, this.volumeCandles);

      this.lastAlert = last;
      this.volumeAlertSub.next(candleExt);
    }

   /*
    const oneHour = _.takeRight(vols, 60);
    const med = +MATH.median(oneHour).toPrecision(5);
    const mean = +_.mean(oneHour).toPrecision(5);

    const medD = Math.round(100 * (last.Volume - med) / med);
    const meanD = Math.round(100 * (last.Volume - mean) / mean);
    const timestamp = last.to;
    console.log('%c '  +moment().format('HH:mm')+' ' + this.exchange + this.market + ' V:' + last.Volume + ' Med:' + medD + ' Avg: ' + meanD, 'color:blue');

    if (medD > 200 || meanD > 300) {
      const ampl = +(100*(last.high - last.low)/last.low).toFixed(2);
      console.log('ampl ' + ampl);

      this.volumeAlertSub.next({medD, meanD, timestamp})
    }*/





  }

  signalStats$(){
    return this.signalStatsSub.asObservable();
  }
  volumeAlert$() {
    return this.volumeAlertSub.asObservable();
  }

  newCandle$() {
    return this.newCandleSub.asObservable();
  }

  candles$() {
    return this.oneMinuteCandlesSub.asObservable();
  }

  downloadLastCandle() {
    const api: ApiPublicAbstract = this.apisPublic.getExchangeApi(this.exchange);
    api.getLastMinuteCandle(this.market).then(res => {
      //  console.log(res);
      const data = this.oneMinuteCandlesSub.getValue();
      const last = _.last(data);
      //  console.log(last);
      if (res.to - last.to < 10000) {
        setTimeout(() => this.downloadLastCandle(), 20000);
        console.log('%c SAME candle ' + this.exchange + this.market, 'color:red');
        return;
      }
      res.time = moment(res.to).format('HH:mm');
      this.newCandleSub.next(res);
      while (data.length > this.length) data.shift();
      data.push(res);
      // console.log(_.takeRight(data, 5));
      this.storage.upsert(this.key1, data);
      this.oneMinuteCandlesSub.next(data);
      this.analyze(data);
    });
  }

  private async downloadAllCandles() {
    const api: ApiPublicAbstract = this.apisPublic.getExchangeApi(this.exchange);
    return api.downloadCandles(this.market, '1m', 200).then(res => _.orderBy(res, 'to'));

  }
}
