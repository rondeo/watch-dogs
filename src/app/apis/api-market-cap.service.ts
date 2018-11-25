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
import {map} from 'rxjs/operators';


@Injectable()
export class ApiMarketCapService {

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {
    ApiMarketCapService.instance = this;
  }

  static instance: ApiMarketCapService;

  static MC: { [symbol: string]: VOMarketCap };
  // private data: { [symbol: string]: VOMarketCap };
  //  private agrigatedSub: BehaviorSubjectMy<{ [symbol: string]: VOMCAgregated }> = new BehaviorSubjectMy();
  private tikerSub: BehaviorSubject<{ [symbol: string]: VOMarketCap }> = new BehaviorSubject(null);

  private coinsDay: VOCoinsDayData;

  tikerInterval;

  tickerGet$;


  /* agregated$(): Observable<{ [symbol: string]: VOMCAgregated }> {
     return this.agrigatedSub.asObservable();
   }*/

  private coinsAr: VOMarketCapSelected[];

  static mapDataMC(data: any[]) {
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
    })


    data.forEach(function (item) {
      if (item.symbol === 'ETHOS') item.symbol = 'BQX';

      if (!out[item.symbol]) out[item.symbol] = {
        id: item.id,
        name: item.name,
        symbol: item.symbol,
        rank: +item.rank,
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

  async getCoin(symbol: string): Promise<VOMarketCap> {
    const data = await this.getTicker();
    return data[symbol];
  }

  refreshTicker() {
    this.downloadTicker().subscribe(res => {
      let current = 0;
      const cur = this.tikerSub.getValue();
      if (cur) current = cur['BTC'].last_updated;
      const timestamp = res['BTC'].last_updated;
      if (timestamp !== current) {
        console.log(' new marketcap ' + moment(timestamp * 1000).format('HH:mm'));
        this.tikerSub.next(res);
      }
    });
  }

  ticker$(): Observable<{ [symbol: string]: VOMarketCap }> {
    if (!this.tikerInterval) {
      this.tikerInterval = setInterval(() => this.refreshTicker(), 3 * 60 * 1000);
      this.refreshTicker();
    }
    return this.tikerSub;
  }

  downloadTicker(): Observable<{ [symbol: string]: VOMarketCap }> {
    let url = 'api/proxy-5min/https://api.coinmarketcap.com/v1/ticker/?limit=500';
    // const url = '/api/proxy-http/crypto.aesoft.ca:49890/market-cap';
    if (this.tickerGet$) return this.tickerGet$;
    console.log('%c TICKER ' + url, 'color:blue');
    this.tickerGet$ = this.http.get(url).pipe(map((res: any[]) => {
      console.log('%c TICKER MAP ' + url, 'color:blue');
      return ApiMarketCapService.mapDataMC(res);
    }));
    return this.tickerGet$;
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

  getTicker(): Promise<VOMCObj> {
    const data = this.tikerSub.getValue();
    if (data) return Promise.resolve(data);
    return this.downloadTicker().toPromise();
  }

  // uplight.ca API //////////////////////////////////////////////////////////////////
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

}

export interface VOMovingAvgD {
  symbol: string;
  price03hD: number;
  price05hD: number;
  price1hD: number;
  price2hD: number;
  price3hD: number;
  price12hD: number;
  rank12hD: number;
}
