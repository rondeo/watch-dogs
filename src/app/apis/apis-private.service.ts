import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {StorageService} from '../services/app-storage.service';
import {ApiPrivateAbstaract} from './api-private/api-private-abstaract';
import {ApiPrivateBittrex} from './api-private/api-private-bittrex';
import {ApiPrivatePoloniex} from './api-private/api-private-poloniex';
import {ApiPrivateHitbtc} from './api-private/api-private-hitbtc';
import {UserLoginService} from '../services/user-login.service';
import {ApiPrivateBinance} from './api-private/api-private-binance';


@Injectable()
export class ApisPrivateService {

  exchanges: { [exchange: string]: ApiPrivateAbstaract } = {};

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private userLogin: UserLoginService
  ) {
  }

  getAllAvailable(): string[] {
    return ['binance', 'bittrex', 'poloniex', 'hitbtc',]
  }

  getExchangeApi(exchange: string): ApiPrivateAbstaract {
    if (!this.exchanges[exchange]) {
      this.exchanges[exchange] = this.cerateExchange(exchange);
    }
    return this.exchanges[exchange];
  }

  private cerateExchange(exchange: string): ApiPrivateAbstaract {
    switch (exchange) {
      case 'bittrex':
        return new ApiPrivateBittrex(this.http, this.userLogin);
      case 'poloniex':
        return new ApiPrivatePoloniex(this.http, this.userLogin);
      case 'hitbtc':
        return new ApiPrivateHitbtc(this.http, this.userLogin);
      case 'cryptopia':
        return null // new ApiPrivateCryptopia(this.http, this.storage);
      case 'binance':
        return new ApiPrivateBinance(this.http, this.userLogin);

    }
    return undefined;

  }

}
