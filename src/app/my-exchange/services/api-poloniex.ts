import {Observable} from 'rxjs/Observable';
import {AuthHttpService} from '../../services/auth-http.service';
import {APIBooksService} from "../../services/books-service";
import {VOMarket, VOOrderBook} from "../../models/app-models";
import {StorageService} from "../../services/app-storage.service";

import {ApiLogin} from "../../shared/api-login";
import {IExchangeConnector} from "./connector-api.service";
import {VOCtopia} from "./api-cryptopia";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {CryptopiaService} from "../../exchanges/services/cryptopia.service";
import {applyMixins} from "../../shared/utils";
import {SelectedSaved} from "../../com/selected-saved";
import {ApiBase} from "./api-base";
import {MarketCapService} from "../../market-cap/market-cap.service";



export class ApiPoloniex extends ApiBase  {


  constructor(
    private http:AuthHttpService,
    storage:StorageService,
    marketCap:MarketCapService
  ) {
    super(storage, 'poloniex', marketCap);

  }
  private booksObs:Observable<any>;
  getOrderBook(base:string, coin: string, depthMax = '50') {

    let url = 'api/cryptopia/getorderbook/' +base +'-' +coin + '/' + depthMax;
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

  getCurrencies():Observable<VOCtopia[]>{

    let url = '/api/cryptopia/currencies';
    return this.http.get(url).map(res=>{
      let obj = res.json();
      // console.log(obj);
      //let out:VOCryptopia[]=[];
      return obj.Data.map(function (item) {
        return item;

      });

    })
  }

  getPairs():Observable<VOCtopia[]>{

    let url = '/api/cryptopia/pairs';
    return this.http.get(url).map(res=>{
      let obj = res.json();
      // let out:VOCryptopia[]=[];
      return obj.markets.map(function (item) {
        return item;

      });

    })
  }

  getMarkets():Observable<VOCtopia[]>{

    let url = '/api/cryptopia/markets';
    return this.http.get(url).map(res=>{
      let obj = res.json();
      return obj.markets.map(function (item) {
        return item;

      });

    })
  }



 // marketsArSub:BehaviorSubject<VOMarket[]> = new BehaviorSubject<VOMarket[]>(null);
 // isLoadinMarkets:boolean = false;

  loadAllMarketSummaries():void {
    console.log('%c cruptopia  loadAllMarketSummaries   ', 'color:orange');
    if (this.isLoadinMarkets) return;
    this.isLoadinMarkets = true;

    let url = '/api/cryptopia/markets';
    // let url = 'https://bittrex.com/api/v1.1/public/getmarketsummaries';

    //let marketCap = this.marketCap.getAllCoinsData();

    this.http.get(url).subscribe(result => {

      console.log(result);
      let marketsAr: VOMarket[] = [];
      // let indexed:{[pair:string]:VOMarket} ={};
      let baseCoins: string[] = [];
      //let localCoins:{[symbol:string]:VOMarketCap} = {};
      //let coinsAvailable:string[]=[];

      let selected: string[] = this.getMarketsSelected();

      let indexed:{}
      let bases:string[] = [];

      //this.marketsAr = marketsAr;
      // this.markets = indexed;
      //this.baseCoins = baseCoins;
      //this.coinsSub.next(localCoins);
      this.setMarketsData(marketsAr, indexed, bases)

     // this.marketsArSub.next(marketsAr);
      this.isLoadinMarkets = false;
    })

  }

  /*marketsSelected:string[]
  saveMarketsSelected:()=>void;
  getMarketsSelected:()=>string[];*/

}


  //applyMixins (ApiPoloniex, [SelectedSaved]);

