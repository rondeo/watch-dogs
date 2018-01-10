
import {ConfigAPI, VOMarket, VOMarketB, VOMarketCap} from '../models/app-models';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {MarketCapService} from '../market-cap/market-cap.service';
import * as _ from 'lodash';
import {Http} from '@angular/http';
import {StorageService} from '../services/app-storage.service';
import {Mappers} from '../com/mappers';

export class CoinSerciceBase{


  apiKey:string;
  password: string;
  uid:string;

  selected:boolean;

  serchCreteria:string;

  markets:{[pair:string]:VOMarket};
  markets$:Observable<{[pair:string]:VOMarket}>;
  marketsSub:BehaviorSubject<{[pair:string]:VOMarket}>

  marketsAr:VOMarket[];
  marketsAr$:Observable<VOMarket[]>;
  marketsArSub:BehaviorSubject<VOMarket[]>;

  progressSub:Subject<number>;
  progress$:Observable<number>;

  numMarketsSub:BehaviorSubject<number>;
  numMarkets$:Observable<number>;


  baseMarkets:{[name:string]:VOMarket};
  baseMarketsSub:BehaviorSubject<{[name:string]:VOMarket}>;
  baseMarkets$:Observable<{[name:string]:VOMarket}>;

  serachResults:VOMarket[];
  serachResults$:Observable<VOMarket[]>;
  serachResultsSub:Subject<VOMarket[]>;

  baseCurrenciesAr:string[];
 // coinsAvailable:string[];
  //coinsAvailableSub:BehaviorSubject<string[]>;
  //coinsAvailable$:Observable<string[]>;

  isLoggedIn$:Observable<boolean>;
  private isLogedInSub:BehaviorSubject<boolean>;

  constructor(
    public config:ConfigAPI,
    private marketCapData:{[symbol:string]:VOMarketCap},
    private http:Http,
    private storage:StorageService
  ){
   // console.log(config);
    this.uid = config.uid;
    this.marketsArSub = new BehaviorSubject(null);
    this.marketsAr$ = this.marketsArSub.asObservable();

    this.marketsSub = new BehaviorSubject(null);
    this.markets$ = this.marketsSub.asObservable();

    this.progressSub = new Subject();
    this.progress$ = this.progressSub.asObservable();

    this.numMarketsSub = new BehaviorSubject(0);

    this.isLogedInSub = new BehaviorSubject(false);
    this.isLoggedIn$ = this.isLogedInSub.asObservable();

    this.serachResultsSub = new Subject();
    this.serachResults$ = this.serachResultsSub.asObservable();

   // this.coinsAvailableSub = new BehaviorSubject(null);
   // this.coinsAvailable$ = this.coinsAvailableSub.asObservable();

    //setTimeout(()=>this.autoLogin(), 3000);
  }

  autoLogin(){
    //if(!this.storage.isLoggedIn()) return;

   // console.log('autologin ' + this.config.uid);
    let str = this.storage.getItem(this.config.uid+'credetials', true);

    if(str){
      let credentials:{apiKey:string, password:string} = JSON.parse(str);
      // console.log(credentials);
      if(credentials && credentials.apiKey && credentials.password) this.login(credentials.apiKey, credentials.password)
    }else console.log(' no credetials for '+this.config.uid );
  }



  logout() {
    this.apiKey = null;
    this.password = null;
    this.isLogedInSub.next(false)
  }

  login(apiKey:string, password:string){
    this.apiKey = apiKey;
    this.password = password;
    this.isLogedInSub.next(true);
  }

  /*private _searchCoin(symbol:string, ar:VOMarket[], isBase:boolean):VOMarket[]{
    return ar.filter(function (item) {
      if(isBase) return item.base === symbol;
      else return item.coin === symbol;
    })
  }
*/
  private sCb
  searchCoin(symbol:string, isBase:boolean = false):void{
    console.log(this.config.name+ ' serach ' + symbol);

    if(!this.marketsAr){
      this.loadMarkets();
      setTimeout(()=>this.searchCoin(symbol, isBase), 500);
      return;
    }


    let ar = this.marketsAr;
    ar = ar.filter(function (item) {
         if (isBase) return item.base === symbol;
         else return item.coin === symbol;
       });

       console.log(ar);

       if(this.config.isMarketComplex){
         let nodata = ar.filter(function (item) {
           return !item.Last;
         })

         if(nodata.length) this.loadMarketsDetailsAr(nodata);
       }


    this.serachResults = ar;
    this.serachResultsSub.next(ar);

  }

  dispatchMarketsAr():void{
    if(!this.marketsAr) this.loadMarkets();
    else this.marketsArSub.next(this.marketsAr);
  }

  getCoins():Observable<string[]> {
    return this.getAllMarketsAr().map(ar => {

      if(!ar) return null;
      return ar.map(function (item) {
        return item.coin;
      })
    })


  }

  mapAllMarkets(res){

    let result = res.json();
   // console.log(this.config.uid, result);
    let marketsAr:VOMarket[] = [];
    let indexed:{[pair:string]:VOMarket} = {};
    let baseCoins:string[] = [];
    let marketCap = this.marketCapData;
    let coinsAvailable:{[symbol:string]:VOMarketCap} ={};


    let i;
    switch(this.config.uid){
      case 'bittrex':
       i= Mappers.bittrexMarkets( result, marketsAr, indexed, baseCoins, marketCap, [], coinsAvailable);

        break;
      case 'poloniex':
       i = Mappers.poloniexMarkets( result, marketsAr, indexed, baseCoins, marketCap);
        break;
      case 'novaexchange':
       i  = Mappers.novaexchangeMarkets(result, marketsAr, indexed, baseCoins,  marketCap);
        break;
      case 'cryptopia':
       i = Mappers.cryptopiaMarkets(result, marketsAr, indexed, baseCoins, marketCap);
        break;

      case 'hitbtc':
       i = Mappers.hitbtcMarkets( result, marketsAr, indexed, baseCoins, marketCap);
        break;
      case 'livecoin':
        i = Mappers.livecoinMarkets(result, marketsAr, indexed, baseCoins, marketCap);
        break;
    }

    console.log(' result ' + this.config.name + ' markets '+ i +' active: '+marketsAr.length);
   // console.log(marketCap);
   // console.log(arr);




    this.markets = indexed;
    this.baseCurrenciesAr = baseCoins;
    this.marketsAr = marketsAr;
    this.marketsArSub.next(this.marketsAr);
    //this.coinsAvailable = coinsAvailable;
    //this.coinsAvailableSub.next(coinsAvailable);

  }

  private loadMarkets():void{
    if(this.config.isMarketComplex){

      this.http.get(this.config.apiCurrencies).subscribe(res=>{
        res = res.json();
        console.log(res);
        let marketsAr:VOMarket[] = [];
        let indexed:{[pair:string]:VOMarket} = {};
        let baseCoins:string[] = [];
        let marketCap = this.marketCapData;
        let i;
        switch (this.config.uid){
          case 'bitfinex':
          i = Mappers.bitfinexCurencies(res, marketsAr, indexed, baseCoins, marketCap)
          break;
          case 'yobit':
            i = Mappers.yobitCurencies(res, marketsAr, indexed, baseCoins, marketCap)
            break;
        }


        console.log(marketsAr);
        this.markets = indexed;
        this.baseCurrenciesAr = baseCoins;
        this.marketsAr = marketsAr;

        this.marketsArSub.next(this.marketsAr);
      });


    }else this.http.get(this.config.apiMarkets).subscribe(res=>this.mapAllMarkets(res));

  }

  getAllMarketsAr():Observable<VOMarket[]>{
    if(!this.marketsAr) this.loadMarkets();
    return this.marketsAr$;
  }

  getAllMarkets():Observable<{[pair:string]:VOMarket}>{
    if(!this.markets) this.loadMarkets();
    return this.markets$
  }


  getMarketUrl(market: VOMarket):string {
    let ar:string[] =  market.pair.split('_');
    return this.config.webMarket.replace('{{base}}',ar[0]).replace('{{coin}}', ar[1]);
  }

  loadMarketsDetailsAr(markets: VOMarket[], i = 0) {

    console.log('loadMarketsDetailsAr' +i)

    /*this.loadMarketDetails(markets[i++]).subscribe(res=>{




      if(i>=markets.length) return;
      this.loadMarketsDetailsAr(markets, i);
    });*/
  }


  loadMarketDetails(market:VOMarket):Observable<VOMarket>{


    let url = this.config.apiMarket.replace('{{id}}', market.id);

    return this.http.get(url).map(res=>{
      let result;
      try{
        result =res.json();
      }catch (e){

        console.log(url);

       // console.log(res.text())
        console.error(e);

        return null
      }

      let mcB = this.marketCapData[market.base];

      let base = mcB?mcB.price_usd:-1;
      console.log(market);
      switch(market.exchange){
        case 'bitfinex':

          Mappers.bitfinexMarketDetails(result, market, base,  this.marketCapData[market.coin]);
          break;
        case 'yobit':

          Mappers.yobitMarketDetails(result, market, base,  this.marketCapData[market.coin]);
          break
      }
      console.log(result);
      return result
    })
  }
}