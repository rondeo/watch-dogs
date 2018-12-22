import {Injectable} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {OrdersHistory} from '../market-history/orders-history';
import {CandlesData} from './candles-data';
import * as _ from 'lodash';

import {VOCandle} from '../../models/api-models';

import * as moment from 'moment';
import {Observable, Subject} from 'rxjs';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

@Injectable()
export class CandlesService {

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService
  ) {
  }

  collection: { [id: string]: CandlesData } = {};
  candlesInterval = '1m';
  // canlesLength = 240;
  // overlap = 20;
  exchange = 'binance';

  candlesDatas: CandlesData[];

  // userExclude = 'BCN,STORM,GRS,SC,DENT,NPXS,NCASH,PAX,BCC,FUN,TUSD,HOT,AMB,TRIG';

  candlesSub: Subject<{ exchange: string, market: string, candles: VOCandle[] }>
    = new Subject<{ exchange: string, market: string, candles: VOCandle[] }>();

  timeout;

  /*async updateNext(exchange: string, markets: string[], i, candlesInterval: string, sub: Subject<any>) {
    i++;
    if (i >= markets.length) {
      this.currentTimeout = 0;
      sub.complete();
      return;
    }
    const market = markets[i];
    const candles = await this.getNewCandles(exchange, market, candlesInterval);
    if(candles){
      sub.next({exchange, market, candles});
      this.currentTimeout = setTimeout(() => this.updateNext(exchange, markets, i, candlesInterval, sub), 2000);
    } else  this.currentTimeout = setTimeout(() => this.updateNext(exchange, markets, i, candlesInterval, sub), 200);

  }

  currentTimeout;
  scanOnce(markets: string[]) {
    const exchange = 'binance';
    console.log(moment().format('HH:mm') + ' scan');
    if (this.currentTimeout) throw new Error('scan in process');

    this.currentTimeout = 1;
    const sub: Subject<any> = new Subject<any>();
    const i = -1;
    this.updateNext(exchange, markets, i, '5m', sub);
    return sub;
  }

  removeAllCandles() {
    Object.values(this.collection).forEach(function (o) {
      o.removeAllCandles();
    })
  }*/

  /*
    async removeCandles(exchange: string, market: string) {
      let ctr: CandlesData = this.collection[exchange];
      console.log(ctr);
      if (!!ctr) return ctr.removeCandles(market);
    }*/


  /*async subscribeForAll() {
    const exchange= 'binance';
   const markets = await this.getValidMarkets(exchange);
    const res = markets.map((o) => {
      return this.subscribe(exchange, o);
    });
    return Promise.all(res);
  }
*/
  statsSub: Subject<string> = new Subject();

  async init() {
    const subscribed = (await this.storage.select('subscribed-candles')) || [];
    this.candlesDatas = subscribed.map((item: { exchange: string, markets: string[], interval: string }) => {
      const ctr = new CandlesData(
        this.apisPublic.getExchangeApi(item.exchange),
        this.storage,
        item.interval
      );
      ctr.candlesSub.subscribe(data => {
        this.candlesSub.next(data);
      });
      item.markets.forEach(function (market) {
        ctr.subscribe(market);
      });
      return ctr;
    });
  }

  saveSubscribed() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      const data = this.candlesDatas.map(function (item) {
        return {
          exchange: item.exchange,
          markets: item.subscribedMarkets,
          interval: item.candlesInterval
        };
      });

      this.storage.upsert('subscribed-candles', data);
    }, 5000);
  }

  /* async getNewCandles(exchange: string, market: string, candlesInterval: string){
     const id = 'candles-'+exchange + market + candlesInterval;
     let oldCandels: VOCandle[] = await this.storage.select(id);
     if (oldCandels && oldCandels.length > 100) {
       const lastOld = _.last(oldCandels);
       const diff = moment().diff(lastOld.to, 'minutes');
       //  console.log(market + ' diff  min:' + diff ) ;
       if (diff < 5) {
         // console.log(oldCandels.length);
         return null;
       }
     }
     return this.getCandles( market);
   }
 */


  createOneCandle(candles: VOCandle[]): VOCandle {
    const first: VOCandle = _.first(candles);
    const last: VOCandle = _.last(candles);
    return {
      to: last.to,
      from: first.to,
      close: last.close,
      open: first.open,
      high: -1,
      low: -1,
      Volume: _.sum(CandlesAnalys1.volumes(candles))
    }
  }


  parseInterval(candlesInterval: string): number {
    const units = candlesInterval.slice(-1);
    const num = +candlesInterval.slice(0, -1);
    if (isNaN(num)) throw new Error('candlesInterval ' + num);
    const mult = units === 'm' ? 60e3 : 360e3;
    return num * mult;
  }

  async getOneMinuteCandles(exchange: string, market: string) {
    const id = 'candles-' + exchange + '-' + market + '-1m';
    let candles: VOCandle[] = (await this.storage.select(id));
    return candles;
  }

  private async getMiniteCandles(market: string, from: number, to: number) {
    const candles = await this.getCandles(market);
    return candles.filter(function (item) {
      return item.to > from && item.to < to;
    });
  }


  last15mCandle: VOCandle;

  async getCandles2(exchange: string, market: string, candlesInterval: string = '15m') {
    const now = moment().valueOf();
    const id = 'candles-' + exchange + '-' + market + '-' + candlesInterval;
    const api = this.apisPublic.getExchangeApi(exchange);
    let candles: VOCandle[] = (await this.storage.select(id));
    if (!candles || candles.length < 100) {
      console.log(market + ' downloading 120 candles ' + candlesInterval);
      candles = await api.downloadCandles(market, candlesInterval, 120);

    } else {
      const lastTime = _.last(candles).to;
      const diff: number = moment().diff(lastTime, 'minutes');
      //  console.log(market + '  ' + diff);
      let limit = 3;
      if (diff > -1 && diff < 16) return candles;

      if (diff > 30) {
        limit = 120;
      }

      console.log(market + ' downloading candles ' + limit + ' diff ' + diff);
      let newCandles = await api.downloadCandles(market, candlesInterval, limit);
      newCandles = newCandles.filter(function (item) {
        item.time = moment(item.to).format('HH:mm');
        return item.to > lastTime && item.to < now;
      });

      console.log(' new candles ' + newCandles.length);
      candles = candles.concat(newCandles);
      //console.log(candles);
    }

    candles = _.takeRight(candles, 120);
    // console.log(candles);

    await this.storage.upsert(id, candles);
    return candles;
  }


  private checkCandles(candles: VOCandle[], interval: number) {
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

  minuteCandles: { [market: string]: BehaviorSubject<VOCandle[]> } = {};

  async getCandles(market: string, candlesInterval: string = '1m') {
    const now = moment().valueOf();
    const api = this.apisPublic.getExchangeApi(this.exchange);
    const id = 'candles-' + market;
    let oldCandels: VOCandle[] = (await this.storage.select(id));

    if (!oldCandels || moment().diff(_.last(oldCandels).to, 'minutes') > 10) {
      console.log(market + ' DOWNLOADING 120 candles ')
      let candles = await api.downloadCandles(market, this.candlesInterval, 120);
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

    console.log('%c ' + moment().format('HH:mm') + ' ' + market + ' download new candles ' + limit, 'color:brown');
    // console.log(' updating candles ' + market + limit);
    let candles = await api.downloadCandles(market, this.candlesInterval, limit);
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
    const err = this.checkCandles(candles, 60000);

    if (err.length) {
      console.error(err);
      console.log(market + ' DOWNLOADING 120 candles ')
      candles = await api.downloadCandles(market, this.candlesInterval, 120);
      candles = candles.filter(function (item) {
        return item.to < now;
      });
    }

    if (this.minuteCandles[market]) this.minuteCandles[market].next(candles);
    await this.storage.upsert(id, _.takeRight(candles, 120));

    return candles;
  }

  getAllSubscriptions(): Observable<{ exchange: string, market: string, candles: VOCandle[] }>[] {
    const candles: CandlesData[] = Object.values(this.collection);
    let out = [] = [];

    candles.forEach(function (o) {
      out = out.concat(o.getAllSubscriptions());
    });
    return out;
  }

  subscribe(exchange: string, market: string, candlesInterval: string)
    : Observable<{ exchange: string, market: string, candles: VOCandle[] }> {
    let cdata: CandlesData = _.find(this.candlesDatas, {exchange: exchange, candlesInterval: candlesInterval});
    if (cdata) cdata.subscribe(market);
    else {
      cdata = new CandlesData(
        this.apisPublic.getExchangeApi(exchange),
        this.storage,
        candlesInterval
      );
      cdata.subscribe(market);
      cdata.candlesSub.subscribe(data => {
        this.candlesSub.next(data);
      });
    }

    return this.candlesSub.asObservable();
  }

  unsubscribe(exchange: string, market: string, interval: string) {
    let ctr: CandlesData = this.collection[exchange];
    ctr.subscribe(market);
  }


  /* stop() {
     clearInterval(this.currentTimeout);
     this.currentTimeout = 0;
     /!* Object.values(this.collection).forEach(function (o) {
        o.destroy();
      });
      this.collection= {};*!/
   }*/
}
