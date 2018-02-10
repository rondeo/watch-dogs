import { Injectable } from '@angular/core';
import {StorageService} from "../../services/app-storage.service";
import {SlackService} from "../../services/slack.service";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {HttpClient} from "@angular/common/http";
import {AuthHttpService} from "../../services/auth-http.service";
import {VOOrderBook} from "../../models/app-models";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {ApiCryptopia} from "./apis/api-cryptopia";
import {ApiPoloniex} from "./apis/api-poloniex";
import {ApiBase} from "./apis/api-base";
import {ApiBittrex} from "./apis/api-bittrex";
import {ApiHitbtc} from "./apis/api-hitbtc";

@Injectable()
export class ConnectorApiService {


  private currentService:ApiBase;

  salt:string;
  isLogedIn$:Observable<boolean>;

  connectorSub:BehaviorSubject<ApiBase> = new BehaviorSubject(null);

  constructor(
    private http: HttpClient,
    public marketCap: MarketCapService,
    //public publicService: BittrexService,
    private slack:SlackService,
    public storage: StorageService,
    private auth:AuthHttpService
  ) {

    storage.onSalt().subscribe(res=>{

      //console.log(' on salt '+res);
      this.salt = res;

      if(res && this.currentService){
        this.currentService.autoLogin();
      }
    })

  }

  connector$():Observable<ApiBase>{
    return this.connectorSub.asObservable();
  }

  httpConnectors:{[index:string]:ApiBase} ={};
  private createHttpConnector(exchange):ApiBase{
    switch(exchange){
      case 'bittrex':
        return new ApiBittrex(this.http, this.storage, this.marketCap);
        case 'cryptopia':
         return new ApiCryptopia(this.http, this.storage, this.marketCap);
         case 'poloniex':
        return new ApiPoloniex(this.http, this.storage, this.marketCap);
      case 'hitbtc':
        return new ApiHitbtc(this.http, this.storage, this.marketCap);
    }
  }

  setExchange(exchange:string):ApiBase{
    let connector:ApiBase = this.httpConnectors[exchange] || this.createHttpConnector(exchange);
    this.currentService = connector;
    this.isLogedIn$ = connector.isLogedIn$();
    if(this.salt)  this.currentService.autoLogin();
    this.connectorSub.next(connector);
    return connector;
  }

  getCurrentAPI(){
    return this.currentService;
  }
  getExchangeName() {
    return this.currentService.exchange;
  }





  logout() {
    this.currentService.logout()
  }

  removeSavedLogin():void{
    this.currentService.removeSavedLogin();
  }
  login(apiKey:string, password:string, save:boolean):void{
    this.currentService.login(apiKey, password, save);
  }

  autoLogin(){
    this.currentService.autoLogin();
  }


}



export interface IExchangeConnector{
  exchange:string;
  autoLogin():void;
  logout():void;
  removeSavedLogin():void;
  login(apiKey:string, password:string, save:boolean):void
  isLogedIn$():Observable<boolean>;
  getOrderBook(base:string, coin:string):Observable<{buy:VOOrderBook[], sell:VOOrderBook[]}>
  loadAllMarketSummaries():void;
}

