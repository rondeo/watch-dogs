import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {ApiPublicCryptopia} from './api-public-cryptopia';
import {ApiPublicPoloniex} from './api-public-poloniex';
import {ApiPublicHitbtc} from './api-public-hitbtc';
import {ApiPublicBinance} from './api-public-binance';
import {ApiPublicBittrex} from './api-public-bittrex';
import {ApiPublicBitfinex} from './api-public-bitfinex';
import {ApiPublicAbstract} from './api-public-abstract';

import {StorageService} from '../../services/app-storage.service';


import {VOCandle} from '../../../amodels/api-models';
import {ApiPublicOkex} from './api-public-okex';
import {ApiPublicHuobi} from './api-public-huobi';
import {VOMarket} from '../../../amodels/app-models';
import {forkJoin} from 'rxjs/internal/observable/forkJoin';
import {ApiCryptoCompareService} from '../api-crypto-compare.service';



@Injectable()
export class ApisPublicService {

  static instance: ApisPublicService;

  static candelsToAvarage(res: VOCandle[]) {
    return res.map(function (item: VOCandle) {
      return +((item.high + item.low) / 2).toPrecision(7);
    });
  }

  private exchanges: { [index: string]: ApiPublicAbstract } = {};

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {
    ApisPublicService.instance = this;
  }

  availableExhanges: string[] = ['binance', 'bittrex', 'okex', 'huobi', 'poloniex', 'hitbtc'];
  allExhanges: string[] = ['binance', 'bittrex', 'okex', 'huobi', 'poloniex', 'hitbtc', 'bitfinex', 'cryptopia'];

  private myExchanges = ['poloniex'];


  async getPriceFromExchangesByCandlesticks(excnanges: string[], base: string, coin: string, from: number, to: number): Promise<number[][]> {
    return Promise.all(excnanges.map((exchange) => {
      const api = this.getExchangeApi(exchange);
      return api.getCandlesticks(base, coin, from, to).then(ApisPublicService.candelsToAvarage);
    }));


    /*
        return api.getCandlesticks(base, coin, from, to).map((res: VOCandleMin[]) => {

          return res.map(function (item: VOCandleMin) {
            return +((item.high + item.low)/2).toPrecision(7);


          });
        });*/

  }

 /* downloadTickers(exchanges: string[]) {
    const subs = [];
    exchanges.forEach(async (item) => {
      const api = this.getExchangeApi(item);
      subs.push(api.downloadTicker());
    });
    return forkJoin(subs);
  }
*/

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
          const coins = await api.getAllCoins();
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
          const coins = await api.getAllCoins();
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

  getAllMarkets(): Promise<{ [symbol: string]: VOMarket }[]> {
    return Promise.all(
      this.availableExhanges.map((item) => {
        return this.getExchangeApi(item).getMarkets()
      }))
  }


  getMarketAllExchanges(base: string, coin: string): Promise<VOMarket[]> {

    return Promise.all(
      this.availableExhanges.map((item) => {
        return this.getExchangeApi(item).getMarkets().then(res => {
          return res[base + '_' + coin];
        });
      })).then((res: VOMarket[]) => {
      return res.filter(function (item) {
        return !!item;
      });

    });

  }

  getAvailableMarketsForCoin(coin: string): Promise<VOMarket[]> {
    return Promise.all(this.availableExhanges.map((item) => {
      return this.getExchangeApi(item).getMarkets().then(res => {
        return Object.values(res).filter(function (item) {
          return item.coin === coin;
        });
      });
    })).then(res => {
      let out = [];
      res.forEach(function (item) {
        out = out.concat(item)
      });
      return out;
    });
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
        const p = this.getExchangeApi(name).getAllCoins().then((coinsObj) => {
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
      case 'okex':
        return new ApiPublicOkex(this.http, this.storage);
      case 'huobi':
        return new ApiPublicHuobi(this.http, this.storage);
      case 'all':
        // @ts-ignore
        return new ApiCryptoCompareService(this.http, this.storage);


    }
    return undefined;

  }
}
