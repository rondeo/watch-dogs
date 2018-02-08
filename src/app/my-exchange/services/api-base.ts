import {StorageService} from "../../services/app-storage.service";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {VOBalance, VOMarket, VOMarketCap, VOMarketHistory, VOOrder, VOOrderBook} from "../../models/app-models";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {Mappers} from "../../com/mappers";
import * as _ from 'lodash';


import * as cryptojs from 'crypto-js';
import {Subject} from "rxjs/Subject";
import {HttpClient} from "@angular/common/http";


export enum PrivateCalls{
  ORDERS_HISTORY,
  BALANCES,
  CANCEL_ORDER,
  OPEN_ORDERS,
  BUY_LIMIT,
  SELL_LIMIT

}
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
    marketCap:MarketCapService,
    public http:HttpClient
  ) {
    this.exchange = exchange;
    this.storage = storage;
    this.marketCap = marketCap;
  }




   dispatchOrders(orders){
    this.marketHistorySub.next(orders);
  }

  orders$(){
    return this.ordersSub.asObservable();
  }
  private ordersSub:Subject<VOOrder[]> = new Subject();


  getMarketSummary(base:string, coin:string):Observable<VOMarket>{
    return this.marketsObjSub.map(allMarkets=>{
      if(!allMarkets) return null;
      return allMarkets[base+'_'+coin];
    })
  }





  dispatchMarketHistory(history){
    this.marketHistorySub.next(history);
  }

  marketHistory$(){
    return this.marketHistorySub.asObservable();
  }
  marketHistorySub:Subject<VOOrder[]> = new Subject();

  abstract cancelOrder(orderId):Observable<VOOrder>;

  abstract sellLimit(base:string, coin:string, amountCoin:number, rate:number):Observable<VOOrder>;

  abstract buyLimit(base:string, coin:string, amountCoin:number, rate:number):Observable<VOOrder>;

  abstract getOpenOrders(base:string, coin:string):Observable<VOOrder[]>

  abstract downloadOrders(base:string, coin:string):Observable<VOOrder[]>

 abstract downloadBalances():Observable<VOBalance[]>

  abstract getMarketURL(base:string, coin:string):string;


/////////////////////////// balances //////////////////////////////////////////


  private balancesSub: BehaviorSubject<VOBalance[]> = new BehaviorSubject<VOBalance[]>(null);
  isLoadingBalances: boolean;


  refreshBalances():void{
    if(!this.isLogedInSub.getValue()){
      console.warn(' not logged in');
      return;
    }

    if(this.isLoadingBalances) return;
    this.isLoadingBalances = true;
   this.downloadBalances().subscribe(res=>{
     this.isLoadingBalances = false;
      this.dispatchBalances(res);
    }, err=>{
     this.isLoadingBalances = false;
   })
  }

  balances$(){
    let bals =  this.balancesSub.getValue();
    if(!bals) this.refreshBalances();
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

//////////////////////////////////////books //////////////////////////////////////////////////////////

  urlMarketHistory:string;
  mapMarketHistory(res):VOOrder[]{
    return res
  }

  downloadMarketHistory(base:string, coin:string):Observable<VOOrder[]>{

    let url = this.urlMarketHistory.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map(this.mapMarketHistory);
  }




  isBooksLoading:boolean;
  protected booksSub:Subject<VOBooks>;

  urlBooks:string;
  urlMarkets:string
   mapBooks(res):any{

   };

  downloadBooks(base:string, coin:string):Observable<VOBooks>{
    let url = this.urlBooks.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map(this.mapBooks)
  }

  private coinsSub:BehaviorSubject<{[symbol:string]:VOMarketCap}> = new BehaviorSubject<{[p: string]: VOMarketCap}>(null);
  getCurrencies():Observable<{[symbol:string]:VOMarketCap}> {
    if(!this.coinsSub.getValue())this.getAllMarkets();
    return this.coinsSub.asObservable();
  }

  mapMarkets(
    result:any,
    marketsAr:VOMarket[],
    indexed:{[pair:string]:VOMarket},
    bases:string[],
    selected:string[]
  ):number{
    return 0;
  }



  getAllMarkets():Observable<VOMarket[]>{
    let markets = this.marketsArSub.getValue();

    if(!markets && !this.isLoadinMarkets){
      let url = this.urlMarkets;
      this.isLoadinMarkets = true;
      console.log(url);
        this.http.get(url).subscribe(result=>{

        let marketsAr: VOMarket[] = [];

        let baseCoins: string[] = [];

        let selected: string[] = this.getMarketsSelected();
        let indexed:{} = {}
        let bases:string[] = [];
        this.mapMarkets(result, marketsAr, indexed, bases, selected);

        this.dispatchMarketsData(marketsAr, indexed, bases);

        this.isLoadinMarkets = false;
      }, error=>{
          this.isLoadinMarkets = false;
        });

    };

    return this.marketsArSub.asObservable();

  }



 /* marketsAr$():Observable<VOMarket[]>{
    let markets = this.marketsArSub.getValue();
    if(!markets)this.loadAllMarketSummaries();
    return this.marketsArSub.asObservable();
  }*/
  /*marketsObj$():Observable<{[pair:string]:VOMarket}>{
    let markets = this.marketsArSub.getValue();
    if(!markets)this.loadAllMarketSummaries();

    return this.marketsObjSub.asObservable();
  }
*/
  protected marketsObjSub:BehaviorSubject<{[pair:string]:VOMarket}> = new BehaviorSubject<{[pair:string]:VOMarket}>(null);
  protected marketsArSub:BehaviorSubject<VOMarket[]> = new BehaviorSubject<VOMarket[]>(null);
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
     // console.log(marketsAr);
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
        if(!mc)console.error(' no price ', MC);
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
