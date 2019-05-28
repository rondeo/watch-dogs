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
import {interval} from 'rxjs';
import {keyframes} from '@angular/animations';
import {of} from 'rxjs/internal/observable/of';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';

@Injectable()
export class ApiMarketCapService {

  private tikerSub: BehaviorSubject<{ [symbol: string]: VOMarketCap }> = new BehaviorSubject(null);
  private oldDataSub: BehaviorSubject<any> = new BehaviorSubject(null);
  private coinsDay: VOCoinsDayData;

  private coinsAr: VOMarketCapSelected[];

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {

    setInterval(() => {
      this.downloadTicker();
    }, 10e4);
    this.downloadTicker();
    this.downloadOldData().subscribe(data => this.oldDataSub.next(data));
  }

  static mapDataMC(data: any[], ranks) {
    const out = {};
    const BTC = data.shift();

    if (BTC.symbol !== 'BTC') throw new Error(' first not BTC');
    const btcusd = BTC['quote']['USD'];
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

      const oldRank = ranks ? (ranks[item.symbol] ? ranks[item.symbol] : 500) : 0;

      const data = item['quote']['USD'];

      if (!out[item.symbol]) out[item.symbol] = {
        id: item.slug,// item.id,
        slug: item.slug,
        name: item.name,
        symbol: item.symbol,
        rank: +item.cmc_rank,
        r6: oldRank ? MATH.percent(oldRank.r6, +item.cmc_rank) : 0,
        r24: oldRank ? MATH.percent(oldRank.r24, +item.cmc_rank) : 0,
        price_usd: +data.price,
        // price_btc: +data.price / priceBTC,
        volume_usd_24h: data.volume24h,
        market_cap_usd: +data.market_cap,
        available_supply: +item.circulating_supply,
        total_supply: +item.total_supply,
        max_supply: +item.max_supply,
        percent_change_1h: +(data.percent_change_1h).toFixed(2),
        percent_change_24h: +(data.percent_change_24h).toFixed(2),
        percent_change_7d: +(data.percent_change_7d || 0).toFixed(2),
        last_updated: item.last_updated
      };
    });

    out['USDT'].percent_change_1h = +(USDT.percent_change_1h.toFixed(2));
    out['USDT'].percent_change_24h = +(USDT.percent_change_24h.toFixed(2));
    out['USDT'].percent_change_7d = +(USDT.percent_change_7d.toFixed(2));
    out['BTC'] = Object.assign(BTC, btcusd);
    return out;
  }

  get oldData$() {
    return this.oldDataSub.pipe(filter(v => !!v));
  }

  downloadOldData() {
      const key = function (items: any[]) {
        const out = {};
        items.forEach(function (item) {
          if (item.symbol === 'ETHOS') item.symbol = 'BQX';
          if (!out[item.symbol]) out[item.symbol] = item;
        });
        return out;
      };

      const mc6h = this.http.get('api/proxy-5min/http://front-desk.ca/coin-media/market-cap6.json');
      const mc24h = this.http.get('api/proxy-5min/http://front-desk.ca/coin-media/market-cap24.json');
      return forkJoin([mc6h, mc24h])
        .pipe(catchError(error => of(null)),
          map(res => {
            if (!res) return null;
            let res6h = (<any>res[0]).data || [];
            let res24h = key((<any>res[1]).data);
            const out = {};

            res6h.forEach(function (item) {
              let symbol = item.symbol;
              if (symbol === 'ETHOS') symbol = 'BQX';
              if (!out[symbol]) out[symbol] = {
                r6: item.cmc_rank,
                r24: res24h[symbol] ? +res24h[symbol].cmc_rank : 0
              }
            });
            return out;
          })
        );
  }

  ticker$(): Observable<{ [symbol: string]: VOMarketCap }> {
    return this.tikerSub.pipe(filter(MC => !!MC));
  }

  downloadTicker() {
    const CMC_PRO_API_KEY = '2e839c65-7d80-4445-866a-f690ccdb181b';// '6d420757-bcc7-4e9e-89bc-9e17ef61717f';
    const limit = '500';
    const params = {CMC_PRO_API_KEY, limit};
    let url = 'api/proxy-15min/https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';
    this.http.get(url, {params})
      .pipe(
        map((res: any) => res.data)
      ).subscribe(newData => {
        this.oldData$.subscribe(oldData => {
          const merged = ApiMarketCapService.mapDataMC(newData, oldData)
          this.tikerSub.next(merged);
        });
    });
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
      this.ticker$().subscribe((res) => {
        if (res) resolve(res)
      })
    })
  }

}
