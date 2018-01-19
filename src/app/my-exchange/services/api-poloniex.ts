import {Observable} from 'rxjs/Observable';
import {AuthHttpService} from '../../services/auth-http.service';
import {APIBooksService} from "../../services/books-service";
import {VOMarket, VOMarketCap, VOOrderBook} from "../../models/app-models";
import {StorageService} from "../../services/app-storage.service";

import {ApiLogin} from "../../shared/api-login";
import {IExchangeConnector} from "./connector-api.service";
import {ApiCryptopia, VOCtopia} from "./api-cryptopia";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {CryptopiaService} from "../../exchanges/services/cryptopia.service";
import {applyMixins} from "../../shared/utils";
import {SelectedSaved} from "../../com/selected-saved";
import {ApiBase} from "./api-base";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {Mappers} from "../../com/mappers";
import {SOMarketPoloniex} from "../../models/sos";


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

  /*getCurrencies():Observable<VOCtopia[]>{

    let url = '/api/cryptopia/currencies';
    return this.http.get(url).map(res=>{
      let obj = res.json();
      // console.log(obj);
      //let out:VOCryptopia[]=[];
      return obj.Data.map(function (item) {
        return item;

      });

    })
  }*/

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
    console.log('%c ploniex  loadAllMarketSummaries   ', 'color:orange');
    if (this.isLoadinMarkets) return;
    this.isLoadinMarkets = true;

    let url = '/api/poloniex/markets-summary';
    console.log(url);

    this.http.get(url).subscribe(result => {

      console.log(result);
      let marketsAr: VOMarket[] = [];

      let baseCoins: string[] = [];


      let selected: string[] = this.getMarketsSelected();

      let indexed:{}
      let bases:string[] = [];

      ApiPoloniex.mapMarkets(result, marketsAr, indexed, bases, selected);
      this.setMarketsData(marketsAr, indexed, bases);

      this.isLoadinMarkets = false;
    })

  }


  static mapMarkets(
    result:{[index:string]:SOMarketPoloniex},
    marketsAr:VOMarket[],
    indexed:{[pair:string]:VOMarket},
    bases:string[],
    selected:string[]
    //marketCap:{[symbol:string]:VOMarketCap}
  ):number{

    let i = 0;
    for (let str in result) {

      i++;
      let market: VOMarket = new VOMarket();

      let data = result[str];

      let ar: string[] = str.split('_');
      market.base = ar[0];
      if (bases.indexOf(market.base) === -1) bases.push(market.base);
      market.coin = ar[1];
      market.pair = str;
      market.selected = selected.indexOf(str) !==-1;
      market.id = str;
      market.exchange = 'poloniex';

      market.Volume = +data.quoteVolume;
      market.Last = +data.last;
      market.High = +data.highestBid;
      market.Low = +data.lowestAsk;
      market.Ask = +data.lowestAsk;
      market.Bid = +data.highestBid;
      market.BaseVolume = +data.baseVolume;
      market.disabled = data.isFrozen !=='0';

      market.PrevDay = (+data.high24hr + +data.low24hr) / 2;

     // let mcBase = marketCap[market.base];
      //let basePrice = mcBase ? mcBase.price_usd : 1;

      //Mappers.mapDisplayValues(market, basePrice, 4, marketCap[market.coin]);

      //let mc = marketCap[market.coin];
      //if (!mc) {
      //  //console.log('no mc for ' + market.coin);
       // market.usMC = '';

     // } else market.usMC = mc.price_usd.toFixed(2);

      marketsAr.push(market);
    }
    return i;
  }

}
