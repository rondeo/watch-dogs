import { Injectable } from '@angular/core';
import {CryptopiaService} from "./services/cryptopia.service";
import {BittrexService} from "./services/bittrex.service";
import {StorageService} from "../services/app-storage.service";
import {SlackService} from "../services/slack.service";
import {MarketCapService} from "../market-cap/market-cap.service";
import {HttpClient} from "@angular/common/http";
import {AuthHttpService} from "../services/auth-http.service";
import {VOOrderBook} from "../models/app-models";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

@Injectable()
export class ApiServiceService {


  private currentService:IExchangeConnector;

  isLogedIn$:Observable<boolean>;
  constructor(
    private http: HttpClient,
    public marketCap: MarketCapService,
    public publicService: BittrexService,
    private slack:SlackService,
    public storage: StorageService,
    private auth:AuthHttpService
  ) { }

  setExchange(exchange:string){
    let connector:IExchangeConnector
    switch(exchange){
      case 'bittrex':
        break;

      case 'cryptopia':
        connector = new CryptopiaService(this.auth, this.storage);
        break;
    }

    this.currentService = connector;
    this.isLogedIn$ = connector.isLogedIn$();

  }



}



export interface IExchangeConnector{
  isLogedIn$():Observable<boolean>;
  getOrderBook(base:string, coin:string):Observable<{buy:VOOrderBook[], sell:VOOrderBook[]}>
}

