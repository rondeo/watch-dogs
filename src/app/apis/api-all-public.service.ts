import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {IApiPublic} from "./i-api-public";
import {ApiPublicCryptopia} from "./api-public/api-public-cryptopia";
import {ApiPublicPoloniex} from "./api-public/api-public-poloniex";
import {ApiPublicHitbtc} from "./api-public/api-public-hitbtc";
import {ApiPublicBinance} from "./api-public/api-public-binance";
import {ApiPublicBittrex} from "./api-public/api-public-bittrex";


@Injectable()
export class ApiAllPublicService {

  private exchanges: {[index:string]:IApiPublic} = {};
  constructor(private http: HttpClient) { }

  private availableExhanges:string[] = ['poloniex','hitbtc','cryptopia'];
  downloadTicker(exchange:string){
   return this.getExchangeApi(exchange).downloadTicker();
  }

  getExchangeApi(exchange: string): IApiPublic {
    if(!this.exchanges[exchange]) {
      this.exchanges[exchange] = this.cerateExchange(exchange);
    }
    return this.exchanges[exchange];
  }

  private cerateExchange(exchange: string): IApiPublic {
    switch (exchange) {
      case 'cryptopia': return new ApiPublicCryptopia(this.http);
      case 'poloniex': return new ApiPublicPoloniex(this.http);
      case 'hitbtc': return new ApiPublicHitbtc(this.http);
      case 'binance': return new ApiPublicBinance(this.http);
      case 'bittrex': return new ApiPublicBittrex(this.http);


    }
    return undefined;

  }
}
