import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";

import {ApiPublicCryptopia} from "./api-public/api-public-cryptopia";
import {ApiPublicPoloniex} from "./api-public/api-public-poloniex";
import {ApiPublicHitbtc} from "./api-public/api-public-hitbtc";
import {ApiPublicBinance} from "./api-public/api-public-binance";
import {ApiPublicBittrex} from "./api-public/api-public-bittrex";
import {ApiPublicBitfinex} from "./api-public/api-public-bitfinex";
import {ApiPublicAbstract} from "./api-public/api-public-abstract";


@Injectable()
export class ApiAllPublicService {

  private exchanges: { [index: string]: ApiPublicAbstract } = {};

  constructor(private http: HttpClient) {
  }

  private availableExhanges: string[] = ['binance', 'bittrex', 'poloniex', 'bitfinex', 'hitbtc', 'cryptopia'];

  private myExchanges = ['poloniex'];

  downloadTicker(exchange: string) {
    return this.getExchangeApi(exchange).downloadTicker();
  }

  getExchangeApi(exchange: string): ApiPublicAbstract {
    if (!this.exchanges[exchange]) {
      this.exchanges[exchange] = this.cerateExchange(exchange);
    }
    return this.exchanges[exchange];
  }

  allCoins:{[exchange:string]:string[]};

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
        return new ApiPublicCryptopia(this.http);
      case 'poloniex':
        return new ApiPublicPoloniex(this.http);
      case 'hitbtc':
        return new ApiPublicHitbtc(this.http);
      case 'binance':
        return new ApiPublicBinance(this.http);
      case 'bittrex':
        return new ApiPublicBittrex(this.http);
      case 'bitfinex':
        return new ApiPublicBitfinex(this.http);


    }
    return undefined;

  }
}
