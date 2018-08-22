import {Injectable} from '@angular/core';
import {StorageService} from "../../services/app-storage.service";
import {SlackService} from "../../services/slack.service";
import {MarketCapService} from "../../market-cap/services/market-cap.service";
import {HttpClient} from "@angular/common/http";
import {AuthHttpService} from "../../services/auth-http.service";
import {VOOrderBook} from "../../models/app-models";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {ApiCryptopia} from "./apis/api-cryptopia";
import {ApiPoloniex} from "./apis/poloniex/api-poloniex";
import {ApiBase, IApiPublic} from "./apis/api-base";
import {ApiBittrex} from "./apis/bittrex/api-bittrex";
import {ApiHitbtc} from "./apis/api-hitbtc";
import {ApiPublicPoloniex} from "./apis/poloniex/api-public-poloniex";
import {ApiPublicOkex} from "./apis/okex/api-public-okex";
import {ApiPublicBittrex} from "./apis/bittrex/api-public-bittrex";
import {ApiPublicBitfinex} from "./apis/bitfinex/api-public-bitfinex";
import {ApiPublicBinance} from "./apis/binance/api-public-binance";


@Injectable()
export class ConnectorApiService {


  mainTrades: string[] = ['USDT_BTC', 'USDT_ETH', 'USDT_LTC'];
  exchangesPrivate: string[] = ['bittrex', 'poloniex', 'hitbtc', 'cryptopia'];
  exchangesPublic: string[] = ['bitfinex', 'binance','bittrex', 'okex','poloniex'];

  //bitfinex:ApiBitfinex;

  private currentService: ApiBase;

 //  salt: string;
  isLogedIn$: Observable<boolean>;

  connectorSub: BehaviorSubject<ApiBase> = new BehaviorSubject(null);

  constructor(private http: HttpClient,
              public marketCap: MarketCapService,
              //public publicService: BittrexService,
              private slack: SlackService,
              public storage: StorageService,
              private auth: AuthHttpService) {



    //this.bitfinex = new ApiBitfinex(http);

    storage.onSalt().subscribe(res => {

      //console.log(' on salt '+res);
     // this.salt = res;

      if (res && this.currentService) {
        this.currentService.autoLogin();
      }
    })

  }


  connector$(): Observable<ApiBase> {
    return this.connectorSub.asObservable();
  }



  private createPublicApi(exchange): any {
    switch (exchange) {
      case 'bittrex':
        return new ApiPublicBittrex(this.http);
      case 'poloniex':
        return new ApiPublicPoloniex(this.http);
      case 'okex':
        return new ApiPublicOkex(this.http);
      case 'bitfinex':
        return new ApiPublicBitfinex(this.http);
      case 'binance':
        return new ApiPublicBinance(this.http);
      default:
        return null;
    }
  }

  private _publicAPIs: { [index: string]: IApiPublic } = {};

  getPublicApi(exchange: string): IApiPublic {
    if (!this._publicAPIs[exchange]) this._publicAPIs[exchange] = this.createPublicApi(exchange);

    return this._publicAPIs[exchange]
  }


  private _privateAPIs: { [index: string]: ApiBase } = {};

  private createPriveteApi(exchange): any {
    switch (exchange) {
      case 'bittrex':
        return new ApiBittrex(this.http, this.storage, this.marketCap);
      case 'cryptopia':
        return new ApiCryptopia(this.http, this.storage, this.marketCap);
      case 'poloniex':
        return new ApiPoloniex(this.http, this.storage, this.marketCap);
      case 'hitbtc':
        return new ApiHitbtc(this.http, this.storage, this.marketCap);
      //case 'bitfinex':
      //  return new ApiBitfinex(this.http);
      default:
        return null;
    }
  }


  getPrivateAPI(exchange: string): ApiBase {
    if (!this._privateAPIs[exchange]) this._privateAPIs[exchange] = this.createPriveteApi(exchange)
    return this._privateAPIs[exchange];
  }

  setExchange(exchange: string): ApiBase {
    let connector: ApiBase = this.getPrivateAPI(exchange);
    this.currentService = connector;
    this.isLogedIn$ = connector.isLogedIn$();
   // if (this.salt) this.currentService.autoLogin();
    this.connectorSub.next(connector);
    return connector;
  }

  getCurrentAPI() {
    return this.currentService;
  }

  getExchangeName() {
    return this.currentService.exchange;
  }


  logout() {
    this.currentService.logout()
  }

  removeSavedLogin(): void {
    this.currentService.removeSavedLogin();
  }

  login(apiKey: string, password: string, save: boolean): void {
    this.currentService.login(apiKey, password, save);
  }

  autoLogin() {
    this.currentService.autoLogin();
  }


}


export interface IExchangeConnector {
  exchange: string;

  autoLogin(): void;

  logout(): void;

  removeSavedLogin(): void;

  login(apiKey: string, password: string, save: boolean): void

  isLogedIn$(): Observable<boolean>;

  getOrderBook(base: string, coin: string): Observable<{ buy: VOOrderBook[], sell: VOOrderBook[] }>

  loadAllMarketSummaries(): void;
}

