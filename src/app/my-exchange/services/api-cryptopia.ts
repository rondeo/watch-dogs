import {Observable} from 'rxjs/Observable';
import {AuthHttpService} from '../../services/auth-http.service';
import {APIBooksService} from "../../services/books-service";
import {VOBalance, VOMarket, VOMarketCap, VOOrder, VOOrderBook} from "../../models/app-models";
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
import {ApiBase, VOBooks} from "./api-base";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {HttpClient} from "@angular/common/http";


export class ApiCryptopia extends ApiBase {


  constructor(
    http:HttpClient,
    storage:StorageService,
    marketCap:MarketCapService
  ) {
    super(storage, 'cryptopia', marketCap, http);

  }



  cancelOrder(orderId):Observable<VOOrder>{
    return this.call({
      command:'cancelOrder',
      orderNumber:orderId
    })
  }


  trackOrder(orderId):Observable<VOOrder>{
    return this.call({
      command:'returnOrderTrades',
      orderNumber:orderId
    })

  }


  downloadOrders(base:string, coin:string):Observable<VOOrder[]>{

    //let url = 'https://poloniex.com/public?command=returnTradeHistory&{{base}}_{{coin}}';
    return this.call({
      command:'returnTradeHistory',
      currencyPair: base+'_'+coin
    })
  }

/*
  getMarketSummary(base:string, coin:string):Observable<VOMarket>{
    let sub = this.marketsObj$().map(res=>{
      return res[base+'_'+coin];
    });
    return sub;

  }*/

  downloadMarketHistory(base:string, coin:string):Observable<VOOrder[]>{

      if (this.isMarketHistoryDoawnloading) return this.marketHistorySub.asObservable();
      this.isMarketHistoryDoawnloading = true;

      let url = 'https://poloniex.com/public?command=returnTradeHistory&currencyPair={{base}}_{{coin}}';
      url = url.replace('{{base}}', base).replace('{{coin}}', coin);
      // console.log(url)
      this.http.get(url).map((res: any) => {
        console.log(res)
        return res.map(function (item) {
          return {
            action: item.type,
            uuid: item.tradeID,
            exchange: 'poloniex',
            rate: +item.rate,
            amountBase: +item.total,
            base: base,
            coin: coin,
            date: item.date,
            timestamp: (new Date(item.date.split(' ').join('T') + 'Z')).getTime()

          }
        })


      }).toPromise().then(res => {

        this.dispatchMarketHistory(res)
        return res;
      }).catch(err => {

        console.error(err)
      })
    return this.marketHistorySub.asObservable();
  }



  ////////////////////////////////////////


  buyLimit(base: string, coin:string,  quantity: number, rate: number): Observable<VOOrder> {
    let market = base+'-'+coin;
    console.log(' buy market ' + market + '  quantity: ' + quantity + ' rate:' + rate);
    let ri = 'https://bittrex.com/api/v1.1/market/buylimit';
    return this.call( {
      market: market,
      quantity: quantity,
      rate: rate
    }).map(res=>{
      console.log(' buyLimit market ' + market , res);

      return res.result;
    });
  }

  sellLimit(base: string, coin:string, quantity: number, rate: number): Observable<VOOrder> {
    let market = base+'-'+coin;
    console.log(' sell market ' + market + '  quantity: ' + quantity + ' rate:' + rate);

    let uri = 'https://bittrex.com/api/v1.1/market/selllimit';
    return this.call( {
      market: market,
      quantity: quantity,
      rate: rate
    }).map(res=>{
      console.log(' sellLimit market '+market , res);
      if(res.success) return res.result;
      else return {
        uuid:'',
        message:res.message
      }
    });
  }


  /*downloadBooks(base:string, coin:string):Observable<VOBooks>{

    let url = '/api/poloniex/orderBook/'+base+'_'+coin+'/100';
    return this.http.get(url).map(res=>{
      console.log(res);
      return <any>res
    })
  }*/


  isLoadingBalances:boolean;
  refreshBalances():void {
    if(!this.isLogedInSub.getValue()){
      console.warn(' not logged in');
      return;
    }

    if(this.isLoadingBalances) return;
    this.isLoadingBalances = true;

    //console.log('%c refreshBalances  ','color:pink');

    this.call( {command:'returnBalances'}).map(res => {
      console.log(res);


      if(!res){
        console.warn('refreshBalances null')
        return null;
      }
      if(res.error){

        this.onError(res);

        return null;
      }

      let out =[];

      for(let str in res) {
        let bal = new VOBalance();
        bal.balance = +res[str];
        bal.symbol = str;
        out.push(bal)
      }

      return out;
    }).toPromise().then(res=>{
      this.isLoadingBalances = false;
      this.dispatchBalances(res);

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
      let obj = <any>res;
      // let out:VOCryptopia[]=[];
      return obj.markets.map(function (item) {
        return item;

      });

    })
  }

  getMarkets():Observable<VOCtopia[]>{

    let url = '/api/cryptopia/markets';
    return this.http.get(url).map(res=>{
      let obj = <any>res;
      return obj.markets.map(function (item) {
        return item;

      });

    })
  }



/*

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

      this.dispatchMarketsData(marketsAr, indexed, bases);

      this.isLoadinMarkets = false;
    })


  }
*/
//////////////////////////////////////////////////////////////////////////////////////////////

  //TODO
  urlBalances = 'api/2/trading/balance';


  urlMarketHistory = 'https://poloniex.com/public?command=returnTradeHistory&currencyPair={{base}}_{{coin}}';
  mapMarketHistory(res):VOOrder[]{
    return res.map(function(item) {
      return {
        action:item.type.toUpperCase(),
        isOpen:false,
        uuid: item.tradeID,
        exchange: 'poloniex',
        rate:+item.rate,
        amountBase:+item.total,
        date:item.date,
        timestamp:(new Date(item.date.split(' ').join('T')+'Z')).getTime()
      };
    });
  }


  urlBooks = '/api/hitbtc/public/ticker';
  urlMarkets = '/api/hitbtc/public/ticker';

  mapBooks(res){
    let r = (<any>res).result;
    console.log('books ', r);

    return {
      buy:r.buy,
      sell:r.sell
    }

  }


  mapMarkets(
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


  private call( post: any): Observable<any> {
    if (!this.apiKey) {
      console.error(' no key')
      return new BehaviorSubject(null).asObservable();
    }

    // post.apikey = this.apiKey;
    post.nonce = Date.now();

    let load = Object.keys(post).map(function (item) {
      return item + '=' + this.post[item];
    }, {post: post}).join('&');


    let signed = this.hash_hmac(load, this.password);
    let url = '/api/poloniex/private';

    return this.http.post(url, {key: this.apiKey, signed: signed, postData:load});

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