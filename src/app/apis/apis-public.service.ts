import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {ApiPublicCryptopia} from './api-public/api-public-cryptopia';
import {ApiPublicPoloniex} from './api-public/api-public-poloniex';
import {ApiPublicHitbtc} from './api-public/api-public-hitbtc';
import {ApiPublicBinance} from './api-public/api-public-binance';
import {ApiPublicBittrex} from './api-public/api-public-bittrex';
import {ApiPublicBitfinex} from './api-public/api-public-bitfinex';
import {ApiPublicAbstract} from './api-public/api-public-abstract';
import {Observable} from 'rxjs/Observable';
import {forkJoin} from 'rxjs/observable/forkJoin';
import {StorageService} from '../services/app-storage.service';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/observable/forkJoin';


@Injectable()
export class ApisPublicService {

  private exchanges: { [index: string]: ApiPublicAbstract } = {};

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {
  }

  availableExhanges: string[] = ['binance', 'bittrex', 'poloniex', 'bitfinex', 'hitbtc'];//, 'cryptopia'];

  private myExchanges = ['poloniex'];


  downloadTickers(exchanges: string[]) {
    const subs = [];
    exchanges.forEach(async (item) => {
      const api = this.getExchangeApi(item);
      subs.push(api.downloadTicker());
    });
    return forkJoin(subs);
  }


  async downloadMarketHistory(exchanges: string[], base: string, coin: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const subs = [];
      const l = exchanges.length - 1;
      var count = 0;
      exchanges.forEach(async (item) => {
        const api = this.getExchangeApi(item);
        if (!api) {
          count++;
          console.warn(item)
        } else {
          const coins = await api.getAllCoins().toPromise();
          if (coins[coin]) {
            subs.push(api.downloadMarketHistory(base, coin));
          }
          else console.log(item + ' no ' + coin);
          count++;
          if (count >= l) resolve(forkJoin(subs));
        }
      });

    });
  }


  async downloadBooks(exchanges: string[], base: string, coin: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const subs = [];
      const l = exchanges.length - 1;
      var count = 0;
      exchanges.forEach(async (item) => {
        const api = this.getExchangeApi(item);
        if (!api) {
          count++;
          console.warn(item)
        } else {
          const coins = await api.getAllCoins().toPromise();
          if (coins[coin]) {
            subs.push(api.downloadBooks(base, coin));
          }
          else console.log(item + ' no ' + coin);
          count++;
          if (count >= l) resolve(forkJoin(subs));
        }
      });

    });
  }

  getAvailableMarketsForCoin(coin: string): Observable<{ exchange: string, market:string }[]> {
    return forkJoin(this.availableExhanges.map((item) => {
      return this.getExchangeApi(item).getAllCoins(true).map(res => {
        if(res[coin]){
          return {
            exhcnge:item,
            markets:res[coin]
          }
        }else return null

      });
    })).map(res=>{

      const allMarkets = [];
      res.forEach(function (item) {
        if(item){
          for (let str in item.markets) {
            allMarkets.push({
              exchange: item.exhcnge,
              market: str + '_' + coin
            })
          }
        }
      })
      return allMarkets
    })

  }

  getExchangeApi(exchange: string): ApiPublicAbstract {
    if (!this.exchanges[exchange]) {
      this.exchanges[exchange] = this.cerateExchange(exchange);
    }
    return this.exchanges[exchange];
  }

  allCoins: { [exchange: string]: string[] };

  async getAllCoins(cached = true) {
    if (cached && this.allCoins) return Promise.resolve(this.allCoins);
    const stored = localStorage.getItem('all-coins');
    if (cached && stored) {
      this.allCoins = JSON.parse(stored);
      return Promise.resolve(this.allCoins);
    }

    return new Promise((resolve, reject) => {

      const allCoins = {};
      const ps = [];
      this.myExchanges.forEach((name) => {
        const p = this.getExchangeApi(name).getAllCoins().toPromise().then((coinsObj) => {
          allCoins[name] = coinsObj;
        })
        ps.push(p);
      });

      Promise.all(ps).then(res => {
        //  console.log(allCoins);
        localStorage.setItem('all-coins', JSON.stringify(allCoins));
        resolve(allCoins)
      });
    });
  }

  private cerateExchange(exchange: string): ApiPublicAbstract {
    switch (exchange) {
      case 'cryptopia':
        return new ApiPublicCryptopia(this.http, this.storage);
      case 'poloniex':
        return new ApiPublicPoloniex(this.http, this.storage);
      case 'hitbtc':
        return new ApiPublicHitbtc(this.http, this.storage);
      case 'binance':
        return new ApiPublicBinance(this.http, this.storage);
      case 'bittrex':
        return new ApiPublicBittrex(this.http, this.storage);
      case 'bitfinex':
        return new ApiPublicBitfinex(this.http, this.storage);


    }
    return undefined;

  }
}
