import {Observable} from 'rxjs/Observable';
import {AuthHttpService} from '../../services/auth-http.service';
import {APIBooksService} from "../../services/books-service";
import {VOMarket, VOMarketCap, VOOrderBook} from "../../models/app-models";
import {StorageService} from "../../services/app-storage.service";

import {ApiLogin} from "../../shared/api-login";
import {IExchangeConnector} from "./connector-api.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {CryptopiaService} from "../../exchanges/services/cryptopia.service";
//import {applyMixins} from "../../shared/utils";
import {SelectedSaved} from "../../com/selected-saved";
import {applyMixins} from "rxjs/util/applyMixins";
import {SOMarketCryptopia} from "../../models/sos";
import {Mappers} from "../../com/mappers";
import {ApiBase} from "./api-base";
import {MarketCapService} from "../../market-cap/market-cap.service";


export class ApiCryptopia extends ApiBase {


  constructor(
    private http:AuthHttpService,
    storage:StorageService,
    marketCap:MarketCapService
  ) {
    super(storage, 'cryptopia', marketCap);

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

 /* getCurrencies():Observable<VOCtopia[]>{

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




  loadAllMarketSummaries():void {
    console.log('%c cruptopia  loadAllMarketSummaries   ','color:orange');
    if(this.isLoadinMarkets) return;
    this.isLoadinMarkets = true;

    let url = '/api/cryptopia/summaries';
    // let url = 'https://bittrex.com/api/v1.1/public/getmarketsummaries';

    //let marketCap = this.marketCap.getAllCoinsData();

    this.http.get(url).subscribe(result=>{

      console.log(result);
      let marketsAr:VOMarket[] = [];
      let bases:string[] = [];

      let selected:string[] = this.getMarketsSelected();
      let indexed = {};

      ApiCryptopia.mapMarkets(result, marketsAr, indexed, bases, selected);

      this.setMarketsData(marketsAr, indexed, bases);

      this.isLoadinMarkets = false;
    })


  }

  static mapMarkets(
    result:any,
    marketsAr:VOMarket[],
    indexed:{[pair:string]:VOMarket},
    bases:string[],
    selected:string[]
  ):number{
    let ar: SOMarketCryptopia[] = result.Data;
    ar.forEach(function (item:SOMarketCryptopia) {
      let ar:string[] = item.Label.split('/');

      let market:VOMarket = new VOMarket();
      market.base = ar[1];
      if(this.bases.indexOf(market.base) === -1) this.bases.push(market.base);
      market.coin = ar[0];

      market.pair =  ar[1] + '_' +  ar[0];
      market.id = item.Label;
      market.exchange = 'cryptopia';

      market.selected = this.selected.indexOf(market.pair) !==-1;

      market.Volume = +item.Volume;
      market.Last = item.LastPrice;
      market.High = item.High;
      market.Low = item.Low;
      market.Ask = item.AskPrice;
      market.Bid = item.BidPrice;
      market.BaseVolume = item.BaseVolume;
      market.PrevDay = 0;
      market.OpenBuyOrders = item.BuyVolume;
      market.OpenSellOrders = item.SellVolume;

      this.indexed[market.pair] = market;
      this.marketsAr.push(market);

    },{bases:bases,indexed:indexed, marketsAr:marketsAr, selected:selected });

    return result.length;
  }


}
/*
0.00011745
BaseVolume
  :
  3.52946064
BidPrice
  :
  0.00011153
BuyBaseVolume
  :
  0.9521777
BuyVolume
  :
  1063210.49169201
Change
  :
  -3.67
Close
  :
  0.00011138
High
  :
  0.000249
Label
  :
  "AUR/BTC"
LastPrice
  :
  0.00011138
Low
  :
  0.00009056
Open
  :
  0.00011562
SellBaseVolume
  :
  542.08534169
SellVolume
  :
  21441.73847993
TradePairId
  :
  2671
Volume
  :
  26239.32002954
*/

applyMixins (ApiCryptopia, [SelectedSaved]);

export interface VOCtopia{
  Id:number;
  Name:string;
  Symbol:string;
  Algorithm:string;
  WithdrawFee:number;
  MinWithdraw:number;
  MinBaseTrade:number;
  IsTipEnabled:boolean;
  MinTip:number;
  DepositConfirmations:number;
  Status:string;
  StatusMessage:string;
  ListingStatus:string;
}

export interface VOCtopiaPair{

}