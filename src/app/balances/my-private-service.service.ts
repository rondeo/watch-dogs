import { Injectable } from '@angular/core';
import {PrivateService} from "../bittrex/private-service";
import {MarketCapService} from "../market-cap/market-cap.service";
import {SlackService} from "../services/slack.service";
import {HttpClient} from "@angular/common/http";
import {AuthHttpService} from "../services/auth-http.service";
import {StorageService} from "../services/app-storage.service";
import {BittrexService} from "../exchanges/services/bittrex.service";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Subject} from "rxjs/Subject";
import {VOBalance} from "../models/app-models";

@Injectable()
export class MyPrivateServiceService {

  private isSinedInSub:Subject<boolean> = new Subject();


  connector:PrivateService;
  private currentNameSub:BehaviorSubject<string> = new BehaviorSubject(null);
  constructor(
    private http: HttpClient,
    public marketCap: MarketCapService,
    public publicService: BittrexService,
    private slack:SlackService,
    public storage: StorageService,
    private auth:AuthHttpService
  ) {


  }


  isSignedIn$():Observable<boolean>{
    return this.isSinedInSub.asObservable()
  }

  name$(){
    return this.currentNameSub.asObservable();
  }
  current:string;
  private sub1;
  initService(config:any)//:Observable<boolean>
   {
    this.current = config.exchange;
    this.connector = new PrivateService(config, this.http, this.marketCap, this.publicService, this.slack, this.storage, this.auth);

    this.currentNameSub.next(this.connector.id);
    if(this.sub1) this.sub1.unsubscribe();
    //setTimeout(()=>{
      this.sub1 = this.connector.isLogedInSub.asObservable().subscribe(isLogin=>this.isSinedInSub.next(isLogin));
    //},100);

    //return this.connector.autoLogin();

  }

  balances$():Observable<VOBalance[]>{
    return this.connector.balancesSub.asObservable();
  }
  setKets(publicKey:string, privateKey:string){

  }

  refreshBalances():void {
    this.connector.refreshBalances();
  }

  removeSavedLogin() {
    this.connector.removeSavedLogin();
  }

  autoLogin(){
    this.connector.autoLogin();
  }
  login(apiKey: string , password:string, save:boolean) {
    this.connector.login(apiKey, password, save);

  }

  logout(){
    this.connector.logout()
  }
}
