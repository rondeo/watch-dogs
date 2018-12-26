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

  myCandles: { [market: string]: BehaviorSubject<VOCandle[]> } = {};

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService
  ) {


   //  setInterval(() => this.updateCandles(), 5 * 6000);


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


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

 /* async updateLast2Candles(market, sub: BehaviorSubject<VOCandle[]>) {

    let candles: VOCandle[] = sub.getValue();

    if (candles.length === 0 || moment().diff(_.last(candles).to, 'minutes') > 20) {
      console.log(' DOWNLOADING candles for ' + market);
      candles = await this.apisPublic.getExchangeApi(this.exchange).downloadCandles(market, '15m', 120);
      candles.forEach(function (item) {
        item.time = moment(item.to).format('HH:mm');
      })
    }

    let minuteCandles = await this.getCandles(market);

    const timestampMinute = _.last(minuteCandles).to;

    const timestampLast = _.last(candles).to;
    console.log(moment(timestampLast).format('HH:mm:ss'), moment(timestampMinute).format('HH:mm:ss'));
    if (timestampMinute === timestampLast) {
      console.log(market + 'MINUTE candles same time ');
      return
    }

    if (minuteCandles.length < 30) {
      console.error(minuteCandles);

      return;
    }


    const lastFrom = moment().subtract(moment().minutes() % 15, 'minutes').second(0).valueOf();//.format('HH:mm:ss');

    const prevFrom = moment(lastFrom).subtract(15, 'minutes').valueOf();
    const to = moment().valueOf();


    const prev15min1m: VOCandle[] = minuteCandles.filter(function (item) {
      return item.to > prevFrom && item.to < lastFrom;
    });

    const last15min1m = minuteCandles.filter(function (item) {
      return item.to > lastFrom;
    });

    candles = candles.filter(function (item) {
      return item.to < prevFrom;
    });

    console.log(market + ' prev ' + prev15min1m.length + ' last15min1m ', last15min1m);

    const prev = CandlesAnalys1.createCandle(prev15min1m);
    const last = CandlesAnalys1.createCandle(last15min1m);

    candles.push(prev);
    candles.push(last);

    const err = CandlesAnalys1.checkCandles(candles.slice(0, -1), 15 * 60000);

    if (err.length) {
      console.log(err, candles);

    } else {
      candles = _.takeRight(candles, 120);
      sub.next(candles);
      this.storage.upsert(this.exchange + market + '15m', candles);
    }
  }*/

  deleteCandles(market: string) {
    delete this.myCandles[market];
    this.storage.remove(this.exchange + market + '15m');
  }

  closes:{[market:string]:  BehaviorSubject<number[]>} = {};
  closes15m$(market: string): BehaviorSubject<number[]>{
    if(!this.closes[market]) {
      this.closes[market] = new BehaviorSubject<number[]>([]);
      this.candles15min$(market);
    }
    return this.closes[market];
  }

  volumes:{[market:string]:  BehaviorSubject<number[]>} = {};
  volumes15m$(market: string): BehaviorSubject<number[]>{
    if(!this.closes[market]) {
      this.closes[market] = new BehaviorSubject<number[]>([]);
      this.candles15min$(market);
    }
    return this.closes[market];
  }


  candles15min$(market: string): BehaviorSubject<VOCandle[]> {
    if (!this.myCandles[market]) {
      const sub =  new BehaviorSubject([]);

      this.minuteCandles$(market).asObservable().subscribe(candles1m =>{
        if(!candles1m.length) return;
       //  console.log(market + ' 1 min candles triggered');
        const candles15m = sub.getValue();
        if(!candles15m.length) return;
        const minutes = moment().minutes() % 15;
        if(minutes < 10) return;
       //  console.log(minutes);
       /// console.log(candles1m, candles15m);
        const candles =  _.takeRight(CandlesAnalys1.update15minCandles(candles1m, candles15m, market), 120);

        sub.next(candles);
        const closes = CandlesAnalys1.closes(candles);
        this.closes15m$(market).next(closes);
        this.storage.upsert(this.exchange + market + '15m', candles);


      });

      this.myCandles[market]  = sub;
      this.storage.select(this.exchange + market + '15m').then((candles: VOCandle[]) => {

        if (candles && moment().diff(_.last(candles).to, 'minutes') < 20) {
          const closes = CandlesAnalys1.closes(candles);
          this.closes15m$(market).next(closes);
          sub.next(candles);
        } else {
          console.log('%c ' + market +  ' download ne candles ', 'color:#ffbf00');
          this.apisPublic.getExchangeApi(this.exchange).downloadCandles(market, '15m', 120).then(candles =>{
            candles.forEach(function (item) {
              item.time = moment(item.to).format('HH:mm');

            });
            this.storage.upsert(this.exchange + market + '15m', candles);
            const closes = CandlesAnalys1.closes(candles);
            this.closes15m$(market).next(closes);
            const volumes = CandlesAnalys1.volumes(candles);
            this.volumes15m$(market).next(volumes);
            sub.next(candles);
          })
        }

      })
    }

    return this.myCandles[market];
  }

 /* async updateCandlesNext(markets: string[], i) {
    i++;
    if (i >= markets.length) {
      return;
    }
    const market = markets[i];
    const sub = this.myCandles[market];

    await this.updateLast2Candles(market, sub);
    setTimeout(() => this.updateCandlesNext(markets, i), 2000);
  }

  updateCandles() {
    //  console.log(moment().subtract(moment().minutes() % 15, 'minutes').minutes());

    const minutes = moment().minutes() % 15;
    // console.log(minutes);
    // const lastCandle = _.last(Object.values(this.myCandles)[0].getValue());
    if (minutes < 10) {
      console.log(minutes);
      return;
    }
    const subs = Object.values(this.myCandles);
    if (subs.length === 0) return;
    const markets = Object.keys(this.myCandles);
    if (markets.length) this.updateCandlesNext(markets, -1);
  }
*/
  getCandles15min(market: string) {
    if (this.myCandles[market]) return this.myCandles[market].getValue();
    return null;
  }


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

  minuteCandles$(market: string){
    if(!this.minuteCandles[market]) this.minuteCandles[market] = new BehaviorSubject([]);
    return this.minuteCandles[market];
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
    else this.minuteCandles[market] = new BehaviorSubject(candles);
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
