import {Injectable} from '@angular/core';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {HttpClient} from '@angular/common/http';
import {VOMarketCap, VOMarketCapExt} from '../../amodels/app-models';
import * as _ from 'lodash';
import {StorageService} from '../services/app-storage.service';
import {Parsers} from './parsers';
import * as moment from 'moment';

import {MCdata, VOCoinsDayData, VOMarketCapSelected, VOMCData, VOMCObj} from '../../amodels/api-models';
import {VOMovingAvg} from '../../acom/moving-average';
import {Observable} from 'rxjs/internal/Observable';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {catchError, filter, first, map, refCount, share, shareReplay} from 'rxjs/operators';
import {MATH} from '../../acom/math';
import {forkJoin} from 'rxjs/internal/observable/forkJoin';
import {ajax, fromPromise} from 'rxjs/internal-compatibility';
import { interval } from 'rxjs';
import {keyframes} from '@angular/animations';
import {of} from 'rxjs/internal/observable/of';

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
    const BTC = data.shift();

    if (BTC.symbol !== 'BTC') throw new Error(' first not BTC');
    const btcusd =BTC['quote']['USD'];
    const btc1h = +btcusd.percent_change_1h;
    const btc24h = +btcusd.percent_change_24h;
    const btc7d = +btcusd.percent_change_7d;
    btcusd.price_btc = 1;
    btcusd.percent_change_1h = +btc1h.toFixed(2);
    btcusd.percent_change_24h = +btc24h.toFixed(2);
    btcusd.percent_change_7d = +btc7d.toFixed(2);
    const priceBTC = +btcusd.price;
    btcusd.price_usd = priceBTC;
    BTC.id = BTC.slug;


    const USDT = data.find(function (item) {
      return item.symbol === 'USDT';
    })['quote']['USD'];

    data.forEach(function (item) {
      if (item.symbol === 'ETHOS') item.symbol = 'BQX';

      const oldRank = ranks?(ranks[item.symbol] ? ranks[item.symbol] : 500):0;

      const data = item['quote']['USD'];
      if (!out[item.symbol]) out[item.symbol] = {
        id: item.slug,// item.id,
        slug: item.slug,
        name: item.name,
        symbol: item.symbol,
        rank: +item.cmc_rank,
        r6:oldRank? MATH.percent(oldRank.r6, +item.cmc_rank):0,
        r24: oldRank?MATH.percent(oldRank.r24, +item.cmc_rank):0,
        price_usd: +data.price,
        price_btc: +data.price / priceBTC,
        volume_usd_24h: data.volume24h,
        market_cap_usd: +data.market_cap,
        available_supply: +item.circulating_supply,
        total_supply: +item.total_supply,
        max_supply: +item.max_supply,
        percent_change_1h: +(data.percent_change_1h - btc1h).toFixed(2),
        percent_change_24h: +(data.percent_change_24h - btc24h).toFixed(2),
        percent_change_7d: +(data.percent_change_7d - btc7d).toFixed(2),
        last_updated: item.last_updated
      };
    });

    out['USDT'].percent_change_1h = +(USDT.percent_change_1h.toFixed(2));
    out['USDT'].percent_change_24h = +(USDT.percent_change_24h.toFixed(2));
    out['USDT'].percent_change_7d = +(USDT.percent_change_7d.toFixed(2));
    out['BTC'] = Object.assign(BTC, btcusd);
   // console.log(out);
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

      const mc6h = this.http.get('api/proxy-5min/http://front-desk.ca/coin-media/market-cap12.json');
      const mc24h =  this.http.get('api/proxy-5min/http://front-desk.ca/coin-media/market-cap24.json');
      this.oldData$ = forkJoin([mc6h, mc24h])
        .pipe(catchError(error => of(null)),
        map(res =>{
          if(!res) return  null;
          let res6h = (<any>res[0]).data;
          let res24h = key((<any>res[1]).data);
          const out = {};
          res6h.forEach(function (item) {
            let symbol = item.symbol;
            if (symbol === 'ETHOS') symbol = 'BQX';
            if (!out[symbol]) out[symbol] = {
              r6: item.cmc_rank,
              r24: res24h[symbol]? +res24h[symbol].cmc_rank: 0
            }
          })
         // console.log(res);

          return out;
        })
      ).pipe(shareReplay(1))
    }
    return this.oldData$;
  }

  refreshTicker() {
    forkJoin(this.getOldData(), this.downloadTicker())
      .pipe(map(res => {
         // console.log(res);
        const oldData = res[0];
        const newData = res[1];
        const data = ApiMarketCapService.mapDataMC(newData, oldData);
         console.log('last_updated ' + moment(data['BTC'].last_updated).format('HH:mm'));
        this.tikerSub.next(data);
      }))
      .subscribe(res => {
      });
  }

  ticker():Promise<VOMCObj>{
    return new Promise((resolve, reject)=>{
      this.tikerSub.subscribe(res =>{
        if(res) resolve(res);
      })
    })
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
    return this.tikerSub.pipe(filter(MC =>!!MC));
  }

  myTicker$;
  downloadTicker(): Observable<any[]> {
    const CMC_PRO_API_KEY = '6d420757-bcc7-4e9e-89bc-9e17ef61717f';
    const limit = '500';
    const params = {CMC_PRO_API_KEY, limit};
    let url = 'api/proxy-5min/https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';
    return this.http.get(url, {params})
      .pipe(
        map((res: any) => res.data)
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
