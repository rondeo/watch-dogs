import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {StorageService} from '../../services/app-storage.service';
import {ApiPrivateAbstaract} from './api-private-abstaract';
import {ApiPrivateBittrex} from './api-private-bittrex';
import {ApiPrivatePoloniex} from './api-private-poloniex';
import {ApiPrivateHitbtc} from './api-private-hitbtc';
import {UserLoginService} from '../../services/user-login.service';
import {ApiPrivateBinance} from './api-private-binance';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {ApiPrivateCoinbase} from './api-private-coinbase';


@Injectable()
export class ApisPrivateService {

  static instance: ApisPrivateService;

  private exchanges: { [exchange: string]: ApiPrivateAbstaract } = {};

  exchanges$: BehaviorSubject<string[]> = new BehaviorSubject( ['binance', 'bittrex', 'poloniex', 'hitbtc']);

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private userLogin: UserLoginService
  ) {
    ApisPrivateService.instance = this;
  }


  getExchangeApi(exchange: string): ApiPrivateAbstaract {
    if (!this.exchanges[exchange]) {
      this.exchanges[exchange] = this.cerateExchange(exchange);
    }
    return this.exchanges[exchange];
  }

  private cerateExchange(exchange: string): ApiPrivateAbstaract {
    switch (exchange) {
      case 'coinbase':
        return new ApiPrivateCoinbase(this.http, this.userLogin, this.storage)
      case 'bittrex':
        return new ApiPrivateBittrex(this.http, this.userLogin, this.storage);
      case 'poloniex':
        return new ApiPrivatePoloniex(this.http, this.userLogin, this.storage);
      case 'hitbtc':
        return new ApiPrivateHitbtc(this.http, this.userLogin, this.storage);
      case 'cryptopia':
        return null; // new ApiPrivateCryptopia(this.http, this.storage);
      case 'binance':
        return new ApiPrivateBinance(this.http, this.userLogin, this.storage);

    }
    return undefined;

  }

}
