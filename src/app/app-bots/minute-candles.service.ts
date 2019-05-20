import { Injectable } from '@angular/core';
import {VOCandle} from '../amodels/api-models';
import * as _ from 'lodash';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {ApiMarketCapService} from '../a-core/apis/api-market-cap.service';
import {ApisPublicService} from '../a-core/apis/api-public/apis-public.service';
import {StorageService} from '../a-core/services/app-storage.service';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class MinuteCandlesService {

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

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService
  ) { }

  interval;
  currentMarket: string;
  updateCandles() {
    this.removeWithoutSubscription();
    const markets = Object.keys(this.minuteCandles);
    if(markets.length === 0) {
      clearInterval(this.interval);
      this.interval = null;
    } else {
      let ind = markets.indexOf(this.currentMarket);
      ind ++;
      if(ind  >= markets.length) ind = 0;
      this.currentMarket = markets[ind];
      this.getCandles(this.currentMarket);
      let timeout = 3 * 60 * 1000;
      timeout = timeout/markets.length;
      if(timeout < 20000) timeout = 20000;
      //clearTimeout(this.timeout);
      this.interval = setTimeout(() => this.updateCandles(), timeout);
    }
  }

  removeWithoutSubscription() {
    for(let str in this.minuteCandles) {
      if(this.minuteCandles.hasOwnProperty(str)) {
        const b: BehaviorSubject<VOCandle[]> = this.minuteCandles[str];
        if(b.observers.length === 0) delete this.minuteCandles[str];
      }
    }
  }

  minuteCandles$(market: string): BehaviorSubject<VOCandle[]> {
    if (!this.minuteCandles[market]) this.minuteCandles[market] = new BehaviorSubject([]);
    if(!this.interval) {
      this.interval = setTimeout(()=>this.updateCandles(), 6e4);
    }
  /*  const markets = Object.keys(this.minuteCandles);
    let timeout = 3 * 60 * 1000;
    timeout = timeout/markets.length;
    if(timeout < 20000) timeout = 20000;*/

    return this.minuteCandles[market]
  }

  minuteCandles: { [market: string]: BehaviorSubject<VOCandle[]> } = {};

  async getCandles(market: string, exchange = 'binance') {
    const now = moment().valueOf();
    const api = this.apisPublic.getExchangeApi(exchange);
    const id = 'candles-' + market;
    let oldCandels: VOCandle[] = (await this.storage.select(id));

    if (!oldCandels || moment().diff(_.last(oldCandels).to, 'minutes') > 10) {
      console.log('%c ' + market + ' 1m DOWNLOADING 200 candles ' +  'color:brown');
      let candles = await api.downloadCandles(market, '1m', 200);
      candles = candles.filter(function (item) {
        return item.to < now;
      });
      await this.storage.upsert(id, candles);
      return candles;
    }

    const lastOld = _.last(oldCandels);
    const diff = moment().diff(lastOld.to, 'minutes');
    // console.log(market, diff);
    if (diff < 3) {
      // console.log(oldCandels.length);
      return oldCandels;
    }

    let limit = 5;
    if (diff > 5) limit = 11;

    console.log('%c ' + moment().format('HH:mm') + ' ' + market + ' 1m download new candles ' + limit, 'color:brown');
    // console.log(' updating candles ' + market + limit);
    let candles = await api.downloadCandles(market, '1m', limit);
    candles = candles.filter(function (item) {
      return item.to < now;
    });

    candles.forEach(function (item) {
      item.time = moment(item.to).format('HH:mm');
    });

    const firstTime = _.first(candles).to;

    oldCandels = oldCandels.filter(function (item) {
      return item.to < firstTime;
    });

    candles = oldCandels.concat(candles);
    const err = MinuteCandlesService.checkCandles(candles, 60000);

    if (err.length) {
      console.warn(market + ' 1m DOWNLOADING 200 candles error ' , err);
      candles = await api.downloadCandles(market,'1m', 200);
      candles = candles.filter(function (item) {
        return item.to < now;
      });
    }

    this.minuteCandles$(market).next(candles);
    await this.storage.upsert(id, _.takeRight(candles, 200));

    return candles;
  }

}
