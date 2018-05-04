import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {StorageService} from "../services/app-storage.service";
import {ApiPrivateAbstaract} from "./api-private/api-private-abstaract";
import {ApiPrivateBittrex} from "./api-private/api-private-bittrex";
import {ApiPrivatePoloniex} from "./api-private/api-private-poloniex";


@Injectable()
export class ApisPrivateService {

  exchanges: { [exchange: string]: ApiPrivateAbstaract } = {};

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {
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
        return new ApiPrivateBittrex(this.http, this.storage);
      case 'poloniex':
        return new ApiPrivatePoloniex(this.http, this.storage);

    }
    return undefined;

  }

}
