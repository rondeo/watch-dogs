import {Injectable} from '@angular/core';
import {MarketCapService} from '../market-cap/services/market-cap.service';
import {HttpClient} from '@angular/common/http';
import {VOMarketCap, VOMarketCapExt} from '../models/app-models';
import * as _ from 'lodash';
import {StorageService} from '../services/app-storage.service';
import {Parsers} from './parsers';
import * as moment from 'moment';

import {MCdata, VOCoinsDayData, VOMarketCapSelected, VOMCData, VOMCObj} from '../models/api-models';
import {VOMovingAvg} from '../com/moving-average';
import {Observable} from 'rxjs/internal/Observable';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {first, map, refCount, share, shareReplay} from 'rxjs/operators';
import {MATH} from '../com/math';
import {forkJoin} from 'rxjs/internal/observable/forkJoin';
import {ajax, fromPromise} from 'rxjs/internal-compatibility';
import { interval } from 'rxjs';
import {keyframes} from '@angular/animations';

@Injectable()
export class ApiMarketCapService {

  // oldMC$: Observable<{[symbol: string]:number}>;
  //  oldMCSub = new BehaviorSubject<{[symbol: string]:number}>(null);

  private tikerSub: BehaviorSubject<{ [symbol: string]: VOMarketCap }>;
  oldData$;
  private coinsDay: VOCoinsDayData;
  tikerInterval;
  private coinsAr: VOMarketCapSelected[];

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {
    this.tikerSub = new BehaviorSubject(null);
    this.tikerInterval = setInterval(() => this.refreshTicker(),  60000);
    this.refreshTicker();
  }

  // private data: { [symbol: string]: VOMarketCap };
  //  private agrigatedSub: BehaviorSubjectMy<{ [symbol: string]: VOMCAgregated }> = new BehaviorSubjectMy();


  static mapDataMC(data: any[], ranks) {
    const out = {};
    const BTC: VOMarketCap = data.shift();
    if (BTC.symbol !== 'BTC') throw new Error(' first not BTC');
    const btc1h = +BTC.percent_change_1h;
    const btc24h = +BTC.percent_change_24h;
    const btc7d = +BTC.percent_change_7d;
    BTC.price_usd = +BTC.price_usd;
    BTC.price_btc = +BTC.price_btc;

    const USDT = data.find(function (item) {
      return item.symbol === 'USDT';
    });

    data.forEach(function (item) {
      if (item.symbol === 'ETHOS') item.symbol = 'BQX';

      const oldRank = ranks[item.symbol] ? ranks[item.symbol] : 500;

      if (!out[item.symbol]) out[item.symbol] = {
        id: item.id,
        name: item.name,
        symbol: item.symbol,
        rank: +item.rank,
        rankD: MATH.percent(oldRank.r6, +item.rank),
        rank24: oldRank.r24?MATH.percent(oldRank.r24, +item.rank): 0,
        price_usd: +item.price_usd,
        price_btc: +item.price_btc,
        volume_usd_24h: +item['24h_volume_usd'],
        market_cap_usd: +item.market_cap_usd,
        available_supply: +item.available_supply,
        total_supply: +item.total_supply,
        max_supply: +item.max_supply,
        percent_change_1h: +(item.percent_change_1h - btc1h).toFixed(2),
        percent_change_24h: +(item.percent_change_24h - btc24h).toFixed(2),
        percent_change_7d: +(item.percent_change_7d - btc7d).toFixed(2),
        last_updated: item.last_updated,
        stamp: item.stamp
      };
    });

    out['USDT'].percent_change_1h = +USDT.percent_change_1h;
    out['USDT'].percent_change_24h = +USDT.percent_change_24h;
    out['USDT'].percent_change_7d = +USDT.percent_change_7d;
    out['BTC'] = BTC;
    return out;
  }


  getOldData() {
    if(!this.oldData$) {

      const key = function (items:any[]) {
        const out = {};
        items.forEach(function (item) {
          if (item.symbol === 'ETHOS') item.symbol = 'BQX';
          if (!out[item.symbol]) out[item.symbol] = item;
        });
        return out;
      };

      const mc6h = this.http.get('api/proxy-5min/http://front-desk.ca/coin-media/market-cap1.json');
      const mc24h =  this.http.get('api/proxy-5min/http://front-desk.ca/coin-media/market-cap3.json');
      this.oldData$ = forkJoin([mc6h, mc24h]).pipe(
        (map(res =>{
          const res6h = <any[]>res[0];
          const res24h = key(<any []>res[1]);
          const out = {};
          res6h.forEach(function (item) {
            let symbol = item.symbol;
            if (symbol === 'ETHOS') symbol = 'BQX';
            if (!out[symbol]) out[symbol] = {
              r6: +item.rank,
              r24: res24h[symbol]? +res24h[symbol].rank: 0
            }
          })
         // console.log(res);

          return out;
        }))
      ).pipe(shareReplay(1))
    }
    return this.oldData$;
  }

  refreshTicker() {
    forkJoin(this.getOldData(), this.downloadTicker())
      .pipe(map(res => {
       //  console.log(res);
        const oldData = res[0];
        const newData = res[1];
       //  console.log(oldData)
        const data = ApiMarketCapService.mapDataMC(newData, oldData);
       //  console.log(data);
        this.tikerSub.next(data);
      }))
      .subscribe(res => {
      });
  }

  ticker$(): Observable<{ [symbol: string]: VOMarketCap }> {
   /* if(!this.myTicker$) {

     /!* interval(10000).subscribe(()=>{
        console.log(' tick');
      })*!/

      const data = ajax('api/proxy-5min/https://api.coinmarketcap.com/v1/ticker/?limit=500');
      data.subscribe((res) =>{
        console.log(res.response);
      });

      this.myTicker$ = this.downloadTicker().pipe(


      );

      this.myTicker$.subscribe(console.warn);
    }*/
    return this.tikerSub;
  }

  myTicker$;
  downloadTicker(): Observable<any[]> {
    let url = 'api/proxy-5min/https://api.coinmarketcap.com/v1/ticker/?limit=500';
    return this.http.get(url)
      .pipe(
        map((res: any[]) => res)
      );
  }

  async getCoinsArWithSelected(): Promise<VOMarketCapSelected[]> {
    if (this.coinsAr) return Promise.resolve(this.coinsAr);
    return new Promise<VOMarketCapSelected[]>(async (resolve, reject) => {
      const selected = await this.storage.getSelectedMC();
      const sub = this.ticker$().subscribe(data => {
        if (!data) return;
        selected.forEach(function (item) {
          if (!!data[item]) data[item].selected = true;
        });
        this.coinsAr = <VOMarketCapSelected[]>Object.values(data);
        resolve(this.coinsAr);
      }, reject);

    });
  }

  async getTicker(): Promise<VOMCObj> {
    return new Promise<VOMCObj>((resolve, reject) => {
      this.ticker$().subscribe((res)=>{
        if(res)  resolve(res)
      })
    })
  }

  // uplight.ca API //////////////////////////////////////////////////////////////////
/*
  getCoinLongHistory(coin: string) {
    const now = moment().toISOString();
    const ago50H = moment().subtract(500, 'hours').toISOString();
    return this.getCoinHistory5Hours(coin, ago50H, now);
  }

  getCoinHistory5Hours(coin: string, from: string, to: string): Observable<VOMCObj[]> {
    if (!coin) throw new Error(' no coin');
    const url = 'api/proxy-5min/http://uplight.ca:50001/cmc-mongo/5-hours/coin-history/:symbol/:from/:to'
      .replace(':symbol', coin).replace(':from', from).replace(':to', to);
    console.log(url);
    return this.http.get(url).pipe(map((res: any) => res.data));
  }

  get30MinLast(): Observable<VOMCObj[]> {

    const url = 'api/proxy-5min/http://uplight.ca:50001/cmc-mongo/30-mins/last/1';
    console.log(url);
    return this.http.get(url).pipe(map((res: any) => res.data));
  }

  getTickers30Min(limit = 2): Observable<VOMCObj[]> {
    const url = 'api/proxy-5min/http://uplight.ca:50001/cmc-mongo/30-min/last/' + limit;
    console.log(url);
    return this.http.get(url).pipe(map((res: any) => res.data));
  }

  getTicker30MinFrom(from: string, limit = 1): Observable<VOMCObj[]> {
    const url = 'api/proxy-5min/http://uplight.ca:50001/cmc-mongo/30-mins/from/' + from + '/' + limit;
    console.log(url);
    return this.http.get(url).pipe(map((res: any) => res.data));
  }

  getCoinHistory(coin: string, from: string, to: string): Observable<VOMCObj[]> {
    if (!coin) throw new Error(' no coin');
    const url = 'api/proxy-5min/http://uplight.ca:50001/cmc-mongo/30-mins/coin-history/:symbol/:from/:to'
      .replace(':symbol', coin).replace(':from', from).replace(':to', to);
    console.log(url);
    return this.http.get(url).pipe(map((res: any) => res.data));
  }

  getTickers5Hours(limit = 2): Observable<VOMCObj[]> {
    const url = 'api/proxy-1hour/http://uplight.ca:50001/cmc-mongo/hours/last/' + limit;
    console.log(url);
    return this.http.get(url).pipe(map((res: any) => res.data));
  }

  getTicker5HoursFrom(from: string, limit = 1) {
    const url = 'api/proxy-5min/http://uplight.ca:50001/cmc-mongo/hours/from/' + from + '/' + limit;
    return this.http.get(url).pipe(map((res: any) => res.data));
  }
*/

}
