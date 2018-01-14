import {Injectable} from '@angular/core';

import {
  IExchangePublic, VOMarket, VOMarketB, VOMarketCap, VOMarketHistory, VOOrder, VOOrderBook,
  VOSearch
} from '../../models/app-models';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import * as _ from 'lodash';
import {MarketCapService, VOExchangeCoin} from '../../market-cap/market-cap.service';
import {Mappers} from '../../com/mappers';
import {HttpClient} from "@angular/common/http";
import * as moment  from "moment";
import {StorageService} from "../../services/app-storage.service";
import {MappersBooks} from "../../com/mappers-books";
import {APIBooksService} from "../../services/books-service";


@Injectable()
export class BittrexService implements APIBooksService{

  markets:{[pair:string]:VOMarket};
  //markets$:Observable<{[pair:string]:VOMarket}>;
  //private marketsSub:BehaviorSubject<{[pair:string]:VOMarket}> | Subject<{[pair:string]:VOMarket}>;

  marketsAr:VOMarket[];

  private basesSub:BehaviorSubject<string[]> = new BehaviorSubject(['USDT', 'BTC', 'ETH']);

  private basesPriceSub:BehaviorSubject<number> = new BehaviorSubject(0);
  private coinsSub:BehaviorSubject<{[symbol:string]:VOMarketCap}> = new BehaviorSubject<{[p: string]: VOMarketCap}>(null);



  private marketsAr$:Observable<VOMarket[]>;
  private marketsArSub:BehaviorSubject<VOMarket[]> | Subject<VOMarket[]>;


  //private marketsLiteAr:VOMarketBLite[];


  private serachResults:VOMarket[];
  serachResults$:Observable<VOMarket[]>;
  private serachResultsSub:Subject<VOMarket[]>;

  private progressSub:Subject<number>;
  progress$:Observable<number>;

  baseCoins:string[];


  currencies:string[];

  constructor(
    private http: HttpClient,
    public marketCap:MarketCapService,
    private storage:StorageService

  ) {

    this.marketsArSub = new BehaviorSubject(null);
    this.marketsAr$ = this.marketsArSub.asObservable();

    //this.marketsSub = new BehaviorSubject(null);
   // this.markets$ = this.marketsSub.asObservable();

    this.progressSub = new Subject();
    this.progress$ = this.progressSub.asObservable();

    this.serachResultsSub = new Subject();
    this.serachResults$ =  this.serachResultsSub.asObservable();


  }

  getBasePrice(symbol:string):Observable<number>{
    return this.marketCap.getCoinsObs().switchMap(MC=>{
      return this.basesSub.asObservable().map(bases=>{
        if (bases.indexOf(symbol) !==-1) return 0;
        else return MC[symbol].price_usd;
      })
    })
  }

  isSymbolBase(symbol:string):Observable<boolean>{
    return this.basesSub.asObservable().map(bases=>{
      return (bases.indexOf(symbol) !==-1)
    })
  }

 /* private _searchCoin(symbol:string, ar:VOMarket[]):VOMarket[]{
    return ar.filter(function (item) {
      return item.coin === this.symbol || item.base === this.symbol;
    },{symbol:symbol});
  }
*/

 getMarketsAr(){
   if(!this.marketsAr) this.loadAllMarketSummaries();
   return this.marketsAr$;
 }


 getLastCoinPrice(symbol:string):number{
   if(this.markets['USDT_'+symbol]) return this.markets['USDT_'+symbol].Last;
   if(this.markets['BTC_'+symbol]) {
     let btcLast = this.markets['USDT_BTC'].Last;
     return this.markets['BTC_'+symbol].Last * btcLast;
   }
   console.error(' no market for '+  symbol);
   return 0;
 }

  searchCoinsMarkets(symbols:string[]):Observable<VOMarket[]>{

    return this.getMarketsAr().map(marketsAr=>{
      //console.log(marketsAr);
      if(!marketsAr) return null;
      return marketsAr.filter(function (item) {
        return this.symbols.indexOf(item.coin) !==-1;
      },{symbols:symbols});


      //setTimeout(()=>sub.unsubscribe(), 100);
    })
  }

  searchCoinMarkets(symbol:string, base:boolean =  false, coin:boolean = false):void{//Observable<VOMarketBLite[]>{

    let sub = this.getMarketsAr().subscribe(marketsAr=>{
      if(!marketsAr) return;

      let res =  marketsAr.filter(function (item) {
        if(this.base) return item.base === this.symbol;
        if(this.coin) return item.coin === this.symbol;
        return item.coin === this.symbol || item.base === this.symbol;
      },{symbol:symbol, base:base, coin:coin});

      this.serachResultsSub.next(res);
      setTimeout(()=>sub.unsubscribe(), 100);
    })



  }


  marketsSelected:string[];
  getMarketsSelecetd():string[]{
    if(!this.marketsSelected) this.marketsSelected = JSON.parse(this.storage.getItem('bitterx-markets-selected') || '[]');
    return this.marketsSelected;

  }

  saveMarketsSelected(){
    let ar = this.getMarketsSelecetd();
    this.storage.setItem('bitterx-markets-selected', JSON.stringify(ar))

  }

  isLoading:boolean;


  loadAllMarketSummaries():void {
    console.log('%c bittrex  loadAllMarketSummaries   ','color:orange');
    if(this.isLoading) return;
    this.isLoading = true;
    this.marketCap.getCoinsObs().subscribe(MC=>{

      if(!MC) {
        //this.marketCap.refresh();
        return;
      }

        let url = 'api/bittrex/summaries';
        // let url = 'https://bittrex.com/api/v1.1/public/getmarketsummaries';

        //let marketCap = this.marketCap.getAllCoinsData();

        this.http.get(url).subscribe(result=>{

          console.log(result);
          let marketsAr:VOMarket[] = [];
          let indexed:{[pair:string]:VOMarket} ={};
          let baseCoins:string[] = [];
          let localCoins:{[symbol:string]:VOMarketCap} = {};
          //let coinsAvailable:string[]=[];


          let selected:string[] = this.getMarketsSelecetd();
          Mappers.bittrexMarkets( result, marketsAr, indexed, baseCoins, MC, selected, localCoins);

          this.marketsAr = marketsAr;
          this.markets = indexed;
          this.baseCoins = baseCoins;
          this.coinsSub.next(localCoins);
          this.marketsArSub.next(marketsAr);
          this.isLoading = false;
        })

    })
  }


  private booksObs:Observable<any>;

  getOrderBook(base:string, coin: string, depthMax = '50') {

    let url = 'api/bittrex/getorderbook/' +base +'-' +coin + '/' + depthMax;
    if(!!this.booksObs) return this.booksObs;
    console.log(url);
     this.booksObs =  this.http.get(url).map(res => {
        let r = (<any>res).result;
        console.log('books ', r);
        this.booksObs = null
        return r;// MappersBooks.bittrex(r, price);

    });
     return this.booksObs;

  }
  getAllMarkets(){
    return this.markets
  }


  getMarketSummary(base:string, coin:string):Observable<VOMarket> {


    let url = 'api/bittrex/market/' + base+'-'+coin;

    return this.http.get(url).map(res => {
      let item = (<any>res).result[0];

      let ar:string[] = item.MarketName.split('-');
      let market:VOMarket = new VOMarket();
      market.base = ar[0];
      market.coin = ar[1];
      //market.marketCap = marketCap[market.coin];
      market.pair = ar.join('_');
      market.id = item.MarketName;

      market.Volume = +item.Volume;
      market.Last = +item.Last;
      market.High = +item.High;
      market.Low = +item.Low;
      market.Ask = +item.Ask;
      market.Bid = +item.Bid;
      market.BaseVolume = +item.BaseVolume;
      market.OpenSellOrders = item.OpenSellOrders;
      market.OpenBuyOrders = item.OpenBuyOrders
      return market;
    });
  }


  private loadMarket(market:string) {
    let url = 'api/bittrex/market/'+ market;
    return this.http.get(url).map(res => res)
  }

  getCurrencies():Observable<{[symbol:string]:VOMarketCap}> {
    if(!this.coinsSub.getValue())this.loadAllMarketSummaries();

    return this.coinsSub.asObservable();
  /*  let url = 'api/bittrex/currencies';
    return this.marketCap.getCoinsObs().switchMap(MC=>{
     return this.http.get(url).map(res => {
        if (!MC) return null;
        let coins = (<any>res).result;

        return coins.map(function (item) {
          return this.MC[item.Currency]
        }, {MC:MC}).filter(function (item) {
          return !!item;
        });

      })

    })*/

  }


  private loadMarkets():Observable<VOMarketBLite[]> {
    let url = 'api/bittrex/markets';

    return this.http.get(url).map(res => {
      return (<any>res).result;
    })
  }


  getMarketHistory(base:string, coin:string):Observable<VOMarketHistory[]> {
    let market = base + '-'+coin;
    let url = 'api/bittrex/getmarkethistory/'+ market;
    console.log(url);
    return this.http.get(url).map(res =>{
      return  (<any>res).result.map(function (item:VOMarketHistory) {

        //item.timestamp = 1;
       // item.time = moment.utc(item.TimeStamp).local().format('HH:mm:ss');
        return item
      });
    });
  }

  refershMarkets() {
    this.loadAllMarketSummaries();
  }
}


export interface VOMarketBLite{
  exchange?:string;
  BaseCurrency:string;
  BaseCurrencyLong:string
  Created:string;
  IsActive:boolean;
  IsSponsored:boolean;
  LogoUrl:string;
  MarketCurrency:string;
  MarketCurrencyLong:string;
  MarketName:string
  MinTradeSize:number;
  Notice:string;
}


