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
  async getCandles(market: string) {
    const api = this.apisPublic.getExchangeApi(this.exchange);
    const id = 'candles-' + market;
    let oldCandels: VOCandle[] =  (await this.storage.select(id));
    let limit = 240;

    if (oldCandels && oldCandels.length > 100) {
      const lastOld = _.last(oldCandels);
      const diff = moment().diff(lastOld.to, 'minutes');
      if (diff < 1) {
       // console.log(oldCandels.length);
        return oldCandels;
      }

      if (diff < 2) limit = 3;
      else if (diff < 10) limit = 10;
      else if (diff < 20) limit = 20;
    }

    console.log('%c ' + moment().format('HH:mm') + ' ' + market + ' download new candles ' + limit, 'color:brown');
     // console.log(' updating candles ' + market + limit);
    let candles = await api.downloadCandles(market, this.candlesInterval, limit);

    candles.forEach(function (item) {
      item.time = moment(item.to).format('HH:mm');
    });

    if (oldCandels) {
      const first = _.first(candles);
      oldCandels = oldCandels.filter(function (o) {
        return o.to < first.to;
      });

      oldCandels = _.takeRight(oldCandels.concat(candles), 480);

    } else oldCandels = candles;
    await this.storage.upsert(id, oldCandels);
    return oldCandels;
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
