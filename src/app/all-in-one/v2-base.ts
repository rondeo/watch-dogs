
import {ConfigAPI, VOMarket, VOMarketB, VOMarketCap} from '../models/app-models';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {MarketCapService} from '../market-cap/market-cap.service';
import * as _ from 'lodash';
import {Http} from '@angular/http';
import {StorageService} from '../services/app-storage.service';
import {Mappers} from '../com/mappers';
import {relativeTimeRounding} from "moment";
import {HttpClient} from "@angular/common/http";

export class V2BaseSercice{


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
    public config:ConfigAPI2,
    private marketCapData:{[symbol:string]:VOMarketCap},
    private http:HttpClient,
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
  private sCb;
  searchCoin(symbol:string, isBase:boolean = false):Observable<VOMarket[]>{

    if(this.isError) {
      console.log('error in returning null '+this.config.uid)
      return (new BehaviorSubject(null)).asObservable()
    }

    let subj:Subject<VOMarket[]> = new Subject()
    console.log(this.config.uid+ ' serach ' + symbol);


   let sub =  this.marketsAr$.subscribe(res=>{
      if(!res) return;
     let ar = this.marketsAr;
     ar = ar.filter(function (item) {
       if (isBase) return item.base === symbol;
       else return item.coin === symbol;
     });

     setTimeout(()=>subj.next(ar),10);
     console.log(this.config.uid +' has '+ ar.length);


     /*

            if(this.config.isMarketComplex){
              let nodata = ar.filter(function (item) {
                return !item.Last;
              })
              if(nodata.length) this.loadMarketsDetailsAr(nodata);
            }
     */


     //this.serachResults = ar;
     //this.serachResultsSub.next(ar);
     // return ar;
    });
    this.loadMarkets(true);
   return subj.asObservable();


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

  mapAllMarkets(result, result1){
    console.log(this.config.uid, result, result1);
    let marketsAr:VOMarket[] = [];
    let indexed:{[pair:string]:VOMarket} = {};
    let baseCoins:string[] = [];
    let marketCap = this.marketCapData;

    let coinsAvailable:string[]=[];


    if(!marketCap){

      console.warn(' no marketcap ' + this.config.uid);
      return;
    }
    let fn:Function = Mappers[this.config.uid+'Markets'];

    console.log(' mapping with Mappers.'+this.config.uid+'Markets');
    if(typeof fn ==='function'){
      Mappers[this.config.uid+'Markets']( result, marketsAr, indexed, baseCoins, marketCap, result1);
      this.markets = indexed;
      this.baseCurrenciesAr = baseCoins;
      this.marketsAr = marketsAr;
      this.marketsArSub.next(this.marketsAr);
    }
    else console.warn('no parser for '+ this.config.uid, result);

    console.log(' mapping ' + this.config.uid + ' total markets '+ marketsAr.length);

  }

  isMarketsLoaded = false;
  loadMarkets(withDetails = false):void{
    console.log(this.config.uid + ' markets loaded '+this.isMarketsLoaded);

    if(this.isMarketsLoaded) return;
    this.isMarketsLoaded = true;
    console.warn(this.config.uid + ' load markets ', this.config);

    if(this.config.isMarketComplex){



    /* this.http.get(this.config.apiCurrencies).subscribe(res=>{
        res = res.json();
        console.log(res);
        let marketsAr:VOMarket[] = [];
        let indexed:{[pair:string]:VOMarket} = {};
        let baseCoins:string[] = [];
        let marketCap = this.marketCapData;

        switch (this.config.uid){
          case 'bitfinex':
            Mappers.bitfinexCurencies(res, marketsAr, indexed, baseCoins, marketCap)
          break;
          case 'yobit':
            Mappers.yobitCurencies(res, marketsAr, indexed, baseCoins, marketCap)
            break;
        }


        console.log(marketsAr);
        this.markets = indexed;
        this.baseCurrenciesAr = baseCoins;
        this.marketsAr = marketsAr;

        this.marketsArSub.next(this.marketsAr);
      });*/

    }else {

      let summaries = _.find(this.config.apis,{name:'summaries'});

      if(summaries){
        if(summaries.require){

          let marketNames =_.find(this.config.apis,{name:summaries.require});

          console.log(marketNames.api)
          this.http.get(marketNames.api).subscribe(result1=>{

            console.log(result1);

            console.log(summaries.api)
            this.http.get(summaries.api).subscribe(res=>{
              console.log(res);
              this.mapAllMarkets(res, result1),this.onError
            });



          },err=>{
           // console.warn(this.config.uid +'  '+ err.statusText);
            this.onError(err);
            this.marketsArSub.error(this.config.uid +'  '+ err.statusText);

          });


        }else this.http.get(summaries.api).subscribe(res=>this.mapAllMarkets(res, null),err=>{
         // console.warn(this.config.uid +'  '+ err.statusText);
          this.onError(err);
          this.marketsArSub.error(this.config.uid +'  '+ err.statusText);

        });
      }
      else {
        let currencies = _.find(this.config.apis,{name:'currencies'});
        if(currencies){
           this.http.get(currencies.api).subscribe(res=>{

              console.log(res);
              let marketsAr:VOMarket[] = [];
              let indexed:{[pair:string]:VOMarket} = {};
              let baseCoins:string[] = [];
              let marketCap = this.marketCapData;

              switch (this.config.uid){
                case 'bitfinex':
                  Mappers.bitfinexCurencies(res, marketsAr, indexed, baseCoins, marketCap)
                break;
                case 'yobit':
                  Mappers.yobitCurencies(res, marketsAr, indexed, baseCoins, marketCap)
                  break;
              }


              console.log(marketsAr);
              this.markets = indexed;
              this.baseCurrenciesAr = baseCoins;

              if(!Array.isArray(marketsAr)){
                console.error(this.config.uid+ ' paresr error ',  marketsAr);
              }

              this.marketsAr = marketsAr;

             console.log(this.config.uid+ 'error ',  marketsAr);


              if(withDetails) this.loadMarketsDetailsAr(marketsAr, 0, ()=>{

                this.marketsArSub.next(this.marketsAr);
              });

              else this.marketsArSub.next(this.marketsAr);
            });



        }
        console.log(' no summaries in ' + this.config.uid);
       // this.onError(' no summaries in ' + this.config.uid);
       // this.marketsArSub.error(' no summaries in ' + this.config.uid);
      }
    }

  }



  onError(err){
    this.isError = true;
  }

  isError:boolean;

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



  loadMarketsDetailsAr(markets: VOMarket[], i, callBack:Function) {

    console.log(this.config.uid+' i ' + i + ' '+markets.length);
    let market = markets[i++];

    if(!market){
      console.error( this.config.uid + ' market undefined '+i, markets)
      return
    }

    this.loadMarketDetails(market).subscribe(res=>{
      this.marketsArSub.next(this.marketsAr);
      if(i>=markets.length) callBack();
      else {
        setTimeout(()=>this.loadMarketsDetailsAr(markets, i, callBack), 300);
      }
    });
  }


  loadMarketDetails(market:VOMarket):Observable<VOMarket>{

console.log('loadMarketDetails  ', market);

    let marketUrl =  _.find(this.config.apis, {name:'market'});
  //  console.log(marketUrl)

    let url = marketUrl.api.replace(':pair', market.id);

    return this.http.get(url).map(res=>{
      let result;
      try{
        result =res;
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


export interface ConfigAPI2{
  uid: string;
  qs: boolean;
  apiMarket:string;
  webMarket:string;
  isMarketComplex:boolean;
  apis:{api:string, name:string, require:string}[];
}