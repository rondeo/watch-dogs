import {ApisPublicService} from '../../apis/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {Subject} from 'rxjs/Subject';
import {VOCandle} from '../../models/api-models';
import * as _ from 'lodash';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {MATH} from '../../com/math';

export class CandlesHist {
  coinPriceUS: number;

  volumeAlertSub: Subject<{ meanD: number, medD: number, timestamp: number }> = new Subject();
  last: VOCandle;
  oneMinuteCandlesSub: BehaviorSubject<VOCandle[]> = new BehaviorSubject(null);
  newCandleSub: Subject<VOCandle> = new Subject();
  key1: string;

  constructor(
    private exchange: string,
    private market: string,
    private apisPublic: ApisPublicService,
    private storage: StorageService,
    private length = 240
  ) {
    this.key1 = 'oneminutecandle-' + exchange + '_' + market;
  }


  async start() {
    let data = await this.storage.select(this.key1);
    if (!data) data = await this.downloadAllCandles();
    this.oneMinuteCandlesSub.next(data);;
    setInterval(() => this.downloadLastCandle(), 61000);
  }

  //{from: 1538356860000, to: 1538356919999, open: 6662.1, high: 6663.35, low: 6658.19, …}

  analyze(data: VOCandle[], last: VOCandle) {
    const vols = data.map(function (o) {
      return o.Volume;
    });
    const oneHour = _.takeRight(vols, 60);
    const med = +MATH.median(oneHour).toPrecision(5);
    const mean = +_.mean(oneHour).toPrecision(5);

    const medD = Math.round(100 * (last.Volume - med) / med);
    const meanD = Math.round(100 * (last.Volume - mean) / mean);
    const timestamp = last.to;

    console.log(' analyze ' + this.exchange + this.market + ' V:' + last.Volume + ' Med:' + med + ' Avg: ' + mean);
    if (medD > 300 || meanD > 300) {
      this.volumeAlertSub.next({medD, meanD, timestamp})
    }
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
        console.log(' SAME candle ' + this.exchange + this.market);
        return;
      }
      this.newCandleSub.next(res);
      this.analyze(data, res);
      while (data.length > this.length) data.shift();
      data.push(res);
      this.storage.upsert(this.key1, data);
      this.oneMinuteCandlesSub.next(data);
    });
  }

  private async downloadAllCandles() {
    const api: ApiPublicAbstract = this.apisPublic.getExchangeApi(this.exchange);
    return api.downloadCandles(this.market, '1m', 200).then(res => _.orderBy(res, 'to'));

  }
}
