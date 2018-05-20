import {StorageService} from "../../../services/app-storage.service";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {VOBalance, VOBooks, VOMarket, VOMarketCap, VOOrder, VOOrderBook} from "../../../models/app-models";
import {MarketCapService} from "../../../market-cap/services/market-cap.service";
import {Mappers} from "../../../apis/mappers";
import * as _ from 'lodash';


import * as cryptojs from 'crypto-js';
import {Subject} from "rxjs/Subject";
import {HttpClient} from "@angular/common/http";




export interface IApiPublic{
  exchange:string;
  downloadTrades(base:string, coin:string):Observable<VOOrder[]>
  downloadMarketHistoryForPeriod(base:string, coin:string, periodMin:number, resolutionMin:number):Observable<any>
  downloadMarkets():Observable<VOMarket[]>
  downloadMarket(base:string, coin:string):Observable<VOMarket>
  getCurrency():Promise<string[]>
}

export enum PrivateCalls{
  ORDERS_HISTORY,
  BALANCES,
  CANCEL_ORDER,
  OPEN_ORDERS,
  BUY_LIMIT,
  SELL_LIMIT
}

/*
export class MyHttpOne{

  Q:string[]
  inProcess:boolean;


  private call(url:string, sub:Subject<any>){

    console.log(url);
    this.http.get(url).subscribe((res:any) => {

      setTimeout(()=>{
        this.inProcess = false;
      }, 500);

      if(res.error){
        console.warn(res.message);

      }else {
        sub.next(res);
      }

    }, err =>{

      console.error(err);
      setTimeout(()=>{
        this.inProcess = false;
      }, 1500);
    })
  }


 private  recall(url:string, sub:Subject<any>){

   if(this.inProcess)  setTimeout(()=>this.recall(url, sub), 500);
   else {
     this.call(url, sub);
   }
  }

  get(url:string){
    const sub = new Subject();

    if(this.inProcess){
      setTimeout(()=>this.recall(url, sub), 1000)
    }else this.call(url, sub);

    return sub;

  }
  constructor(private http:HttpClient){

  }
}
*/


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


  mongoInsert(follow:any){
   return this.http.post('http://localhost:8080/mongodb',{follow:follow})
  }

  downloadMarketHistoryForPeriod(base:string, coin:string, periodMin:number, resolutionMin:number):Observable<any>{
    return null
  }


  downloadTrades(base:string, coin:string):Observable<VOOrder[]>{
    return null;
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


  stopLoss(base: string, coin:string,  quantity: number, rate: number): Observable<VOOrder>{
return null;
  }

  abstract sellLimit(base:string, coin:string, amountCoin:number, rate:number):Observable<VOOrder>;

  abstract buyLimit(base:string, coin:string, amountCoin:number, rate:number):Observable<VOOrder>;

  abstract getOpenOrders(base:string, coin:string):Observable<VOOrder[]>

  abstract downloadOrders(base:string, coin:string):Observable<VOOrder[]>

 abstract downloadBalances():Observable<VOBalance[]>

  abstract getMarketURL(base:string, coin:string):string;


  getBalance(coin:string, isRefresh = false ):Promise<VOBalance>{
    return new Promise((resolve, reject)=>{

      this.balances$().subscribe(balances=>{
        if(!balances) return;
          let balance = _.find(balances, {symbol:coin});
          if(balance) resolve(balance)
           else resolve({balance:0, symbol:coin})
      })


    })
  }

  getRate(base:string, coin:string):Promise<number>{
    return new Promise((resolve, reject)=>{

      let sub = this.getAllMarkets().subscribe(res=>{

        if(!res) return;

        let indexed = this.marketsObjSub.getValue();
       if(!indexed){
         console.warn(' no indexed ', res)
         return reject(0);
       }
        let vo = indexed[base+'_'+coin];
        if(vo)resolve(vo.Last);
        else reject(0);
      })
    })
  }
/////////////////////////// balances //////////////////////////////////////////


  protected balancesSub: BehaviorSubject<VOBalance[]> = new BehaviorSubject<VOBalance[]>(null);
  isLoadingBalances: boolean;


  refreshBalances():void{
    //if(!this.isLogedInSub.getValue()){
   //   console.warn(' not logged in');
//    }
/*
    if(this.isLoadingBalances) return;
   this.isLoadingBalances = true;
   this.downloadBalances().subscribe(res=>{
     if(!res) throw new Error(' no balances');
     this.isLoadingBalances = false;

     this.mapBalancesToMC(res).then(res=>this.dispatchBalances(res)).catch(console.error);
    }, err=>{
     this.isLoadingBalances = false;
   })*/
  }

  balances$(){
    let bals =  this.balancesSub.getValue();
    if(!bals) this.refreshBalances();
    return this.balancesSub.asObservable();
  }

 /* mapBalancesToMC(balances:VOBalance[]){
    return new Promise<VOBalance[]>( (resolve, reject)=> {

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

        }, {MC:MC});
        resolve(balances)
      }, err=>reject(balances))
    })


  }*/

  dispatchBalances(balances:VOBalance[]):void{
    if(!balances) balances = this.balancesSub.getValue();
    this.balancesSub.next(balances);
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

  private marketsSub:BehaviorSubject<VOMarket[]> = new BehaviorSubject([]);
  isMarkets = false;
  getMarkets(refresh = false):Observable<VOMarket[]>{
    if(!this.isMarkets){
      this.isMarkets = true;
      let url = this.urlMarkets;
      this.http.get(url).subscribe(result=>{

      })

    }
    return this.marketsSub.asObservable()

  }

  marketsList:string[];

  getMarketsList(){
    return new Promise((resolve, reject)=>{
      if(this.marketsList) resolve(this.marketsList);
      else{
        let url = this.urlMarkets;

        this.http.get(url).toPromise().then(result=>{

        });
      }
    })


  }

  getAllMarkets(refresh = false):Observable<VOMarket[]>{
    let markets = this.marketsArSub.getValue();

    if(refresh)this.isMarketsLoaded = false;
    if(!this.isMarketsLoaded){

      let url = this.urlMarkets;
      this.isMarketsLoaded = true;
      console.log(url);
        this.http.get(url).subscribe(result=>{


        let marketsAr: VOMarket[] = [];

        let baseCoins: string[] = [];

        let selected: string[] = this.getMarketsSelected();
        let indexed:{} = {}
        let bases:string[] = [];
        this.mapMarkets(result, marketsAr, indexed, bases, selected);

        this.dispatchMarketsData(marketsAr, indexed, bases);
      }, error=>{
          this.isMarketsLoaded = false;

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
  isMarketsLoaded:boolean = false;
  bases:string[];
  protected dispatchMarketsData( marketsAr, indexed, bases){

    let sub = this.marketCap.getCoinsObs().subscribe(MC=>{
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

  /*getPriceForBase(base: string):Promise<number> {
    return new Promise( (resolve, reject) => {
      this.marketCap.getCoinsObs().subscribe(MC=>{
        if(!MC) return;
        let mc = MC[base];
        if(!mc)console.error(' no price ', MC);
        mc?resolve(mc.price_usd):reject(0);
      })
    })
  }*/

  private credentials: { apiKey: string, password: string };

  protected getCredentials(): Observable<{ apiKey: string, password: string }> {
    if (!!this.credentials) return Observable.of(this.credentials);
    let credentials = null;
    const sub = new Subject<{ apiKey: string, password: string }>();

    let str = this.storage.getItem(this.exchange + '-credentials', true);
    if (str) {
      let credentials: { apiKey: string, password: string } = JSON.parse(str);
      if (credentials && credentials.apiKey && credentials.password) {
        this.credentials = credentials;
      }
    }

    return new BehaviorSubject(this.credentials).asObservable()
  }
}

