import {StorageService} from "../../services/app-storage.service";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {VOBalance, VOMarket, VOMarketCap, VOMarketHistory, VOOrder, VOOrderBook} from "../../models/app-models";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {Mappers} from "../../com/mappers";
import * as _ from 'lodash';


import * as cryptojs from 'crypto-js';
import {Subject} from "rxjs/Subject";

export abstract class ApiBase {

  apiKey: string;
  password: string;
  isLogedInSub: BehaviorSubject<boolean> = new BehaviorSubject(false);

  exchange: string;
  storage: StorageService;
  marketCap:MarketCapService;

  constructor(
    storage: StorageService,
    exchange: string,
    marketCap:MarketCapService
  ) {
    this.exchange = exchange;
    this.storage = storage;
    this.marketCap = marketCap;
  }

  abstract cancelOrder(orderId):Observable<VOOrder>;


  abstract trackOrder(orderId):Observable<VOOrder>;


  abstract downloadOrders(base:string, coin:string):Observable<VOOrder[]>;

  dispatchOrders(orders){
    this.marketHistorySub.next(orders);
  }

  orders$(){
    return this.ordersSub.asObservable();
  }
  private ordersSub:Subject<VOOrder[]> = new Subject();


  abstract getMarketSummary(base:string, coin:string):Observable<VOMarket>


  isMarketHistoryDoawnloading:boolean;
  abstract downloadMarketHistory(base:string, coin:string):Observable<VOOrder[]>;

  dispatchMarketHistory(history){
    this.marketHistorySub.next(history);
  }

  marketHistory$(){
    return this.marketHistorySub.asObservable();
  }
  marketHistorySub:Subject<VOOrder[]> = new Subject();



  abstract sellLimit(base:string, coin:string, amountCoin:number, rate:number):Observable<VOOrder>;

  abstract buyLimit(base:string, coin:string, amountCoin:number, rate:number):Observable<VOOrder>;

  abstract downloadBooks(base:string, coin:string):Observable<VOBooks>;



  isBooksLoading:boolean;
 protected booksSub:Subject<VOBooks>;// = new BehaviorSubject<VOBooks>(null);

  books$(){
    if(!this.booksSub) this.booksSub = new Subject<VOBooks>()
    return this.booksSub.asObservable();
  }

  dispatchBook(books:VOBooks){
    this.booksSub.next(books);
  }



  private balancesSub: BehaviorSubject<VOBalance[]> = new BehaviorSubject<VOBalance[]>(null);
  isBalancesLoading: boolean;

  /*loadBalances() {
    if(this.isBalancesLoading) return;
    this.refreshBalances();
  }*/

  abstract refreshBalances():void;



  balances$(){
    let bals =  this.balancesSub.getValue();
    if(!bals && !this.isBalancesLoading) this.refreshBalances();
    return this.balancesSub.asObservable();
  }
  dispatchBalances(balances:VOBalance[]):void{
    if(!balances) return;
    this.marketCap.getCoinsObs().subscribe(MC=>{
      if(!MC) return;
      balances.forEach(function (balance: VOBalance) {
        let mc = this.MC[balance.symbol];
        if(mc){
            balance.percent_change_1h = mc.percent_change_1h;
          balance.percent_change_24h = mc.percent_change_24h;
          balance.percent_change_7d = mc.percent_change_7d;
          balance.priceUS = mc.price_usd;
          balance.id = mc.id;
            balance.balanceUS = +(mc.price_usd*balance.balance).toFixed(2)
        }else balance.balanceUS = +(balance.balance).toFixed(4);


      }, {MC:MC})
      this.balancesSub.next(balances);
    })

  }


  private coinsSub:BehaviorSubject<{[symbol:string]:VOMarketCap}> = new BehaviorSubject<{[p: string]: VOMarketCap}>(null);
  getCurrencies():Observable<{[symbol:string]:VOMarketCap}> {
    if(!this.coinsSub.getValue())this.loadAllMarketSummaries();

    return this.coinsSub.asObservable();

  }


  abstract loadAllMarketSummaries():void;

  marketsAr$():Observable<VOMarket[]>{
    let markets = this.marketsArSub.getValue();
    if(!markets)this.loadAllMarketSummaries();
    return this.marketsArSub.asObservable();
  }
  marketsObj$():Observable<{[pair:string]:VOMarket}>{
    let markets = this.marketsArSub.getValue();
    if(!markets)this.loadAllMarketSummaries();

    return this.marketsObjSub.asObservable();
  }

  private marketsObjSub:BehaviorSubject<{[pair:string]:VOMarket}> = new BehaviorSubject<{[pair:string]:VOMarket}>(null);
  private marketsArSub:BehaviorSubject<VOMarket[]> = new BehaviorSubject<VOMarket[]>(null);
  isLoadinMarkets:boolean = false;

  bases:string[];
  protected dispatchMarketsData( marketsAr, indexed, bases){
    this.marketCap.getCoinsObs().subscribe(MC=>{
      if(!MC) return;

      let localCoins:{[symbol:string]:VOMarketCap} = {};
      marketsAr.forEach(function (item:VOMarket) {
        let mcBase = MC[item.base] || {
          price_usd:0,
          percent_change_1h:0,
          percent_change_24h:0,
          percent_change_7d:0
        };
        let mcCoin = MC[item.coin];
        if(mcCoin) localCoins[item.coin]= mcCoin;


        Mappers.mapDisplayValues1(item, mcBase.price_usd, mcBase.percent_change_1h, mcBase.percent_change_24h, mcBase.percent_change_7d , mcCoin);
      })

      this.coinsSub.next(localCoins);
      this.bases = bases;
      this.marketsObjSub.next(indexed);
      this.marketsArSub.next(marketsAr);
    })



  }



  marketsSelected: string[];

  getMarketsSelected(): string[] {
    if (!this.marketsSelected) this.marketsSelected = JSON.parse(this.storage.getItem(this.exchange + '-markets-selected') || '[]');
    return this.marketsSelected;

  }

  saveMarketsSelected() {
    let ar = this.getMarketsSelected();
    this.storage.setItem(this.exchange + '-markets-selected', JSON.stringify(ar))

  }


  login(apiKey: string, password: string, isSave: boolean) {
    this.apiKey = apiKey;
    this.password = password;
    //console.log(this.apiKey, password);


    if (isSave) this.storage.setItem(this.exchange + '-credentials', JSON.stringify({
      apiKey: apiKey,
      password: password
    }), true);
    if (apiKey && password) this.isLogedInSub.next(true);
    else this.isLogedInSub.next(false);
  }

  removeSavedLogin() {
    this.storage.removeItem(this.exchange + +'-credentials');
  }

  autoLogin(): void {
    //if (!this.storage.isLoggedIn()) return ;

    let str = this.storage.getItem(this.exchange + '-credentials', true);
    //console.warn('autoLogin ', str);
    if (str) {
      let credentials: { apiKey: string, password: string } = JSON.parse(str);
      // console.log(credentials);
      if (credentials && credentials.apiKey && credentials.password) this.login(credentials.apiKey, credentials.password, false);
    }
  }

  hasLogin(){
    return  this.isLogedInSub.getValue();
  }
  isLogedIn$(): Observable<boolean> {
    return this.isLogedInSub.asObservable();
  }


  logout() {
    this.apiKey = null;
    this.password = null;
    this.removeSavedLogin();
    this.isLogedInSub.next(false)
  }


  hash_hmac(text, password) {
    let dg: any = cryptojs.HmacSHA512(text, password);
    return dg.toString(cryptojs.enc.Hex);
  }


  onError(err){
    console.error(err)
  }

  getPriceForBase(base: string):Promise<number> {
    return new Promise( (resolve, reject) => {
      this.marketCap.getCoinsObs().subscribe(MC=>{
        if(!MC) return;
        let mc = MC[base];
        mc?resolve(mc.price_usd):reject(0);
      })
    })
  }
}

export interface VOBooks{
  market:string;
  exchange:string;
  buy:VOOrderBook[];
  sell:VOOrderBook[];
}
