import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {AuthHttpService} from '../services/auth-http.service';
import {VOBalance, VOMarketB, VOMarketCap, VOOrder, VOOrderBook, VOSearch, VOTransfer} from '../models/app-models';
import {Subject} from 'rxjs/Subject';
import * as _ from 'lodash';


import * as cryptojs from 'crypto-js';

//import * as sha256 from 'fast-sha256';
//import sha256, { Hash, HMAC } from "fast-sha256";

import {MarketCapService} from '../market-cap/market-cap.service';
import {BittrexService} from '../exchanges/services/bittrex.service';
import {StorageService} from '../services/app-storage.service';

//import {Http} from '@angular/http';
import {HttpClient} from "@angular/common/http";
import {MyBot, VOBot} from "./my-bot";
import {SlackService} from "../services/slack.service";


@Injectable()
export class BittrexPrivateService {

  apiKey: string;
  password: string;

  isLoggedIn$: Observable<boolean>;
  private isLogedInSub: BehaviorSubject<boolean>;


  private balances: VOBalance[];
  private balancesSub: BehaviorSubject<VOBalance[]>;
  balances$: Observable<VOBalance[]>;


  private transfers: VOTransfer[];
  private transfersSub: Subject<VOTransfer[]>;
  transfers$: Observable<VOTransfer[]>;

  private myBots: MyBot[];
  myBots$: Observable<MyBot[]>;
  private myBotsSub: BehaviorSubject<MyBot[]>;


  private MC:{[symbol:string]:VOMarketCap};

  constructor(private http: HttpClient,
              public marketCap: MarketCapService,
              public publicService: BittrexService,
              private slack:SlackService,
              public storage: StorageService,
              private auth:AuthHttpService
  ) {

    this.balancesSub = new BehaviorSubject(this.balances);
    this.balances$ = this.balancesSub.asObservable();

    this.isLogedInSub = new BehaviorSubject(false);
    this.isLoggedIn$ = this.isLogedInSub.asObservable();


    this.transfersSub = new Subject();
    this.transfers$ = this.transfersSub.asObservable();

    this.publicService.serachResults$.subscribe(serachResult => {

    });

   this.publicService.marketCap.getCoinsObs().subscribe(MC => {
     this.MC = MC;
     this.mapBalancesToMC();
    });

    this.myBots = this.getBots();
    this.myBotsSub = new BehaviorSubject(this.myBots);
    this.myBots$ = this.myBotsSub.asObservable();
    this.loadBots();
  }

  isBotsLoaded: boolean;

  loadBots() {
    if (this.isBotsLoaded) return;
    this.isBotsLoaded = true;
    this.myBotsSub.next(this.getBots());
  }

  getBots(): MyBot[] {
    if (!this.myBots) {
      let str = this.storage.getItem('bittrex-bots');

      if (str) this.myBots = JSON.parse(str).map(function (item) {
        return new MyBot(this.s, this.m, this.sl,  item);
      }, {s: this, sl:this.slack, m: this.marketCap});
      else this.myBots = [];
    }
    return this.myBots;
  }

  saveBots() {
    let data = this.myBots.map(function (item) {
      let d = item.getData();
      d.transfersLogs = null;
      d.logs = null;
      return d;
    });
    this.storage.setItem('bittrex-bots', JSON.stringify(data))

  }

  createNewBot(): MyBot {
    return new MyBot(this, this.marketCap, this.slack, null);
  }

  setBots(autoTransfers: MyBot[]) {
    this.myBots = autoTransfers;
    this.saveBots();
    this.myBotsSub.next(this.myBots);
  }

  loadTransfers() {
    this.transfersSub.next(this.getTransfers());
  }

  getTransfers(): VOTransfer[] {
    if (!this.transfers) this.transfers = JSON.parse(this.storage.getItem('bittrex-transfers') || '[]');
    return this.transfers;
  }

  saveTransfers() {
    if (this.transfers) this.storage.setItem('bittrex-transfers', JSON.stringify(this.transfers));
  }

  addTransfer(tr: VOTransfer) {
    this.getTransfers().push(tr);
    this.saveTransfers();
  }

  deleteTransferById(uuid: string) {
    _.remove(this.transfers, transfer => transfer.uuid === uuid);
    this.saveTransfers();
  }

  getTransferById(uuid: string): VOTransfer {
    return this.getTransfers().find(function (item) {
      return item.uuid === uuid;
    });
  }

  login(apiKey: string, password: string, isSave:boolean) {
    this.apiKey = apiKey;
    this.password = password;
    //console.log(this.apiKey, password);
    if(isSave)  this.storage.setItem('Bittrex-credentials', JSON.stringify({apiKey:apiKey, password:password}), true);
    if(apiKey && password)this.isLogedInSub.next(true);
    else this.isLogedInSub.next(false);
  }

  removeSavedLogin(){
  this.storage.removeItem('Bittrex-credentials');
  }

  autoLogin(): void {
    //if (!this.storage.isLoggedIn()) return ;
    let str = this.storage.getItem('Bittrex-credentials', true);
    //console.warn('autoLogin ', str);
    if (str) {
      let credentials: { apiKey: string, password: string } = JSON.parse(str);
     // console.log(credentials);
      if (credentials && credentials.apiKey && credentials.password) this.login(credentials.apiKey, credentials.password, false);
    }

  }



  buyLimit(market: string, quantity: number, rate: number): Observable<SOBuySell> {
    console.log(' buy market ' + market + '  quantity: ' + quantity + ' rate:' + rate);

    market = market.replace('_', '-');
    let uri = 'https://bittrex.com/api/v1.1/market/buylimit';

    return this.call(uri, {
      market: market,
      quantity: quantity,
      rate: rate
    });
  }

  sellLimit(market: string, quantity: number, rate: number): Observable<SOBuySell> {
    console.log(' sell market ' + market + '  quantity: ' + quantity + ' rate:' + rate);
    market = market.replace('_', '-');

    let uri = 'https://bittrex.com/api/v1.1/market/selllimit';
    return this.call(uri, {
      market: market,
      quantity: quantity,
      rate: rate
    });
  }


  cancelOrder(uuid: string): Observable<SOBuySell> {
    let uri = 'https://bittrex.com/api/v1.1/market/cancel';
    return this.call(uri, {uuid: uuid});//.map(res=>res.json());
  }


  withdrawHistory(){
     let url = 'https://bittrex.com/api/v1.1/account/getwithdrawalhistory';
     return this.call(url, {}).map(res=>{
       return res.result;
     })
  }

  getHistory(): Observable<VOOrder[]> {
    let url = 'https://bittrex.com/api/v1.1/account/getorderhistory';
    return this.call(url, {}).map(res=>{
    return res.result || [];
    })
  }

  //{"success":false,"message":"ADDRESS_GENERATING","result":null}
  createWallet(symbol: string): Observable<{ result: { Currency: string, Address: string }, message: string }> {
    let uri = 'https://bittrex.com/api/v1.1/account/getdepositaddress';
    return this.call(uri, {currency: symbol})
    /*.map(res=>{
          let r =  res.json();
          return r;
        })*/
  }


  getOpenOrders(market: string): Observable<VOOrder[]> {

    let uri = 'https://bittrex.com/api/v1.1/market/getopenorders';
    return this.call(uri, {market: market})
    /*.map(res=>{
          let r =  res.json().result;
          return r;
        })*/
  }

  getOrderById(uuid: string): Observable<VOOrder> {
    console.log(' getOrderById  ' + uuid);
    let url = 'https://bittrex.com/api/v1.1/account/getorder';
    return this.call(url, {uuid: uuid}).map(res => {
      let order: VOOrder = res.result;
      order.OrderType = order.Type;
      return order
    });

  }

  isLoaded: boolean;

  loadBalances() {
    if (this.isLoaded) return;
    this.isLoaded = true;
    if (!this.balances) this.refreshBalances();
  }

  isLoadingBalances:boolean;
  refreshBalances():void {
    if(!this.isLogedInSub.getValue()){
      console.warn(' not logged in');
      return;
    }


      if(this.isLoadingBalances) return;
    this.isLoadingBalances = true;


    console.log('%c refreshBalances  ','color:pink');

    let uri = 'https://bittrex.com/api/v1.1/account/getbalances';
    this.call(uri, {}).map(res => {

      if(!res){
        console.log('refreshBalances null')
        return null;
      }

      return res.result.map(function (item) {

        return {
          symbol: item.Currency,
          address: item.CryptoAddress,
          balance: item.Balance,
          available: item.Available,
          pending: item.Pending,
          priceUS:0,
          balanceUS:0
        }
      })
    }).toPromise().then(res=>{
      this.balances = res;
      this.isLoadingBalances = false;
      this.mapBalancesToMC();
    }).catch(err=>{
      this.isLoadingBalances = false;
      this.onError(err);

    });

 /*   })

    let sb = this._getBalances().subscribe(bals => {
      if (!bals) return;
      this.balances = bals;
      this.balancesSub.next(bals);
      sb.unsubscribe();
    })*/
  }




  getBalanceBySymbol(symbol:string):VOBalance{
    return this.balances.find(function (item) { return item.symbol === symbol });
  }

  getBalance(symbol: string) {

    console.log(' load balance-1 ' + symbol);
      let uri = 'https://bittrex.com/api/v1.1/account/getbalance';
      return this.call(uri, {currency: symbol}).switchMap( res => {
        console.log(res);

        return this.marketCap.getCoinsObs().map(MC=>{
          if(!MC) return null;

          if (!res) return null;
          if (!res.result) {
            console.log("wrong respond", res);
            return res;
          }

          let item = res.result;
          let mc = MC[item.Currency];
          //  console.log(res);
          return {
            symbol: item.Currency,
            address: item.CryptoAddress,
            balance: item.Balance,
            available: item.Available,
            pending: item.Pending,
            priceUS:mc.price_usd,
            balanceUS:+(mc.price_usd * item.Available).toFixed(2)
          }



        });




    })
  }


  private mapBalancesToMC(){

    if(!this.balances || !this.MC) return;

    this.balances.forEach(function (item) {
      let mc = this.MC[item.symbol];
      item.priceUS=mc.price_usd;
      item.balanceUS=+(item.priceUS * item.available).toFixed(2)

    }, {MC:this.MC});

    this.balancesSub.next(this.balances);
  }

 /* private _getBalances(): Observable<VOBalance[]> {

    let uri = 'https://bittrex.com/api/v1.1/account/getbalances';
    return this.call(uri, {}).switchMap(res => {
      console.log('BALANCES')



      return this.marketCap.getCoinsObs().map(MC=> {
        console.log("MarketCap Data")
        if (!MC) return null;

        if (!res) return null;
         console.log('_getBalances  null  ');

        if (!res.result) {
          console.log("wrong respond", res);
          return;
        }

        // console.log(r)
        return res.result.map(function (item) {
          let mc = MC[item.Currency];
          let price = !mc?0:mc.price_usd;

          return {
            symbol: item.Currency,
            address: item.CryptoAddress,
            balance: item.Balance,
            available: item.Available,
            pending: item.Pending,
            priceUS:price,
            balanceUS:+(price * item.Available).toFixed(2)
          }
        })
      });

    });
  }
*/
  getBalances(): VOBalance[] {
    return this.balances;
  }

  getBalanceBySumbol(symbol: string) {
    return this.balances.find(function (item) {
      return item.symbol === symbol;
    })
  }


  /*loadBalances(refersh:boolean = false):Observable<VOBalance[]>{
    if(refersh) this.balances = null;
    console.log(' loadBalances   loadBalances');
    if(!this.balances){

      this.marketCap.getAllCoinsArr().subscribe(all=>{
        if(!all) return;

      });
    }

    return this.balances$;
  }*/

  /*

    getopenorders(){
      this.call('https://bittrex.com/api/v1.1/account/getbalances?').subscribe(res=>{
        console.log(res);
      })

      /!*this.call('https://bittrex.com/api/v1.1/market/getopenorders?').subscribe(res=>{
        console.log(res);
      })*!/
    }
  */

  onError(err){
    console.error(err);
  }

  private call(uri: string, post: any): Observable<any> {
    if (!this.apiKey) {
      console.error(' no key')
      return new BehaviorSubject(null).asObservable();
    }

    post.apikey = this.apiKey;
    post.nonce = Math.ceil(Date.now() / 1000);


    let load = Object.keys(post).map(function (item) {
      return item + '=' + this.post[item];
    }, {post: post}).join('&');

    uri += '?' + load;
    console.log(uri);
    let signed = hash_hmac(uri, this.password);
    let url = '/api/bittrex/private';

    return this.http.post(url, {uri: uri, signed: signed});

  }


  logout() {
    this.apiKey = null;
    this.password = null;
    this.removeSavedLogin();
    this.isLogedInSub.next(false)
  }


  static formatMarketsUS2(ar: VOMarketB[], baseBTC: number, baseETH: number, marketkap: { [symbol: string]: VOMarketCap }): VOMarketB[] {


    ar.forEach(function (item) {

      let name = item.MarketName;
      let pair = item.MarketName.split('-');
      item.pair = pair.join('_');
      let base = 1;
      let m = this.mc[pair[1]];
      if (m) item.usMC = m.price_usd.toPrecision(3);

      if (pair[0] === 'ETH') base = baseETH;
      else if (pair[0] === 'BTC') base = baseBTC;

      let last = item.Last * base;

      let fix = 0;

      if (last < 0.001) {
        fix = 6;
      } else if (last < 0.01) {
        fix = 5;
      } else if (last < 0.1) {
        fix = 4;
      } else if (last < 1) {
        fix = 3;
      } else if (last < 10) {
        fix = 2;
      } else if (last < 100) {
        fix = 1;
      }

      item.dBaseVolume = item.BaseVolume > 1000 ? item.BaseVolume.toFixed(0) : item.BaseVolume.toFixed(1);
      item.dVolume = item.Volume > 1e6 ? (item.Volume / 1e6).toFixed(3) + 'M' : item.Volume.toFixed(0);
      item.usAsk = (item.Ask * base).toFixed(fix);
      item.usBid = (item.Bid * base).toFixed(fix);
      item.usLow = (item.Low * base).toFixed(fix);
      item.usHigh = (item.High * base).toFixed(fix);
      item.usLast = (item.Last * base).toFixed(fix);
      item.usPrevDay = (item.PrevDay * base).toFixed(fix);


    }, {bB: baseBTC, bE: baseETH, mc: marketkap});
    return ar
  }

  getOrdersByIds(ids: string[]) {


  }

  tick: number;

  private loadNextOrders(markets: string[], i, out: VOOrder[], sub) {
    if (i >= markets.length) sub.next(out);
    else this.getOpenOrders(markets[i++]).subscribe(res => {
      console.log(res);
      if (!res) console.warn(' no result for ' + markets[i]);
      else out = out.concat(res);
      this.tick++;
      setTimeout(() => this.loadNextOrders(markets, i, out, sub), 500);

    })
  }


  getOrdersByMarkets(markets: string[]): Observable<VOOrder[]> {
    markets = markets.map(function (item) {
      return item.replace('_', '-');
    })
    let sub: Subject<VOOrder[]> = new Subject();
    let out: VOOrder[] = [];
    let i = 0;
    this.tick = 0;
    this.loadNextOrders(markets, i, out, sub);
    return sub.asObservable();
  }

  updateBot(bot: MyBot) {
    this.saveBots();
  }

  getBotsByMarket(pair: string): MyBot[] {
    return _.find(this.getBots(), {market: pair});
  }

  saveBot(autoTransfer: MyBot) {
    let exists = this.getBots().find(function (item) {
      return item.id === autoTransfer.id;
    });
    if (!exists) this.myBots.push(autoTransfer);
    autoTransfer.getData().updatedAt = new Date().toISOString();

    console.log('saving');
    this.saveBots();
    this.myBotsSub.next(this.myBots);
  }

  saveOnServer(){
    let url ='/api/watchdogs/save';

    let data = this.myBots.map(function (item) {
      return item.getData();
    });

   let email =  this.storage.getEmail();
  let email2 =  this.auth.getUserEmail()

    let scriptsActive = data.filter(function (item) {
      return item.active;
    });

    let scriptsUnactive = data.filter(function (item) {
      return !item.active;
    });

    let out = {
      email: email,
      scriptsActive:scriptsActive,
      scriptsUnactive:scriptsUnactive
    };

    console.log(out);
    return this.auth.post(url, out )

  }

  getBotById(id: string): MyBot {
    return this.getBots().find(function (item) {
      return item.getData().id === id;
    })
  }

  deleBotById(id: string) {
    _.remove(this.getBots(), {id: id});
    this.saveBots();
    this.myBotsSub.next(this.getBots());

  }
}


function hash_hmac(text, password) {
  let dg: any = cryptojs.HmacSHA512(text, password);
  return dg.toString(cryptojs.enc.Hex);
}


export interface SOBuySell {
  message: string;
  result: { uuid: string }//   {uuid: "2d76102c-abc8-4964-a205-b128fcc0780e"}
  success: boolean;
}


