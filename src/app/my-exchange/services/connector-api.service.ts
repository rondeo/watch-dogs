import { Injectable } from '@angular/core';
import {StorageService} from "../../services/app-storage.service";
import {SlackService} from "../../services/slack.service";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {HttpClient} from "@angular/common/http";
import {AuthHttpService} from "../../services/auth-http.service";
import {VOOrderBook} from "../../models/app-models";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {ApiCryptopia} from "./api-cryptopia";
import {ApiPoloniex} from "./api-poloniex";
import {ApiBase} from "./api-base";

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

      console.log(' on salt '+res);
      this.salt = res;

      if(res && this.currentService){
        this.currentService.autoLogin();
      }
    })

  }

  connector$(){
    return this.connectorSub.asObservable();
  }

  setExchange(exchange:string){
    let connector:ApiBase;
    switch(exchange){
      case 'bittrex':
        break;

      case 'cryptopia':

        connector = new ApiCryptopia(this.auth, this.storage, this.marketCap);
        break;

      case 'poloniex':
        connector = new ApiPoloniex(this.auth, this.storage, this.marketCap);
        break;
    }


    this.currentService = connector;
    this.isLogedIn$ = connector.isLogedIn$();
    if(this.salt)  this.currentService.autoLogin();
    this.connectorSub.next(connector);
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

