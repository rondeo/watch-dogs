import {Observable} from 'rxjs/Observable';
import {AuthHttpService} from '../../../services/auth-http.service';
import {APIBooksService} from "../../../services/books-service";
import {VOBalance, VOMarket, VOMarketCap, VOMarketHistory, VOOrderBook} from "../../../models/app-models";
import {StorageService} from "../../../services/app-storage.service";

import {ApiLogin} from "../../../shared/api-login";
import {IExchangeConnector} from "../connector-api.service";

import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {CryptopiaService} from "../../../exchanges/services/cryptopia.service";
import {applyMixins} from "../../../shared/utils";
import {SelectedSaved} from "../../../com/selected-saved";
import {ApiBase} from "./api-base";
import {MarketCapService} from "../../../market-cap/market-cap.service";
import {Mappers} from "../../../com/mappers";
import {SOMarketBittrex, SOMarketPoloniex} from "../../../models/sos";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Subject} from "rxjs/Subject";

import * as cryptojs from 'crypto-js';
import {VOBooks, VOOrder} from "../my-models";
import * as _ from 'lodash';
export class ApiBittrex extends ApiBase  {

  constructor(
    http:HttpClient,
    storage:StorageService,
    marketCap:MarketCapService
  ) {
    super(storage, 'bittrex', marketCap, http);

  }

  getMarketURL(base:string, coin:string){
    return 'https://bittrex.com/Market/Index?MarketName={{base}}-{{coin}}'.replace('{{base}}', base).replace('{{coin}}', coin);
  }

  cancelOrder(uuid: string): Observable<VOOrder> {
    let uri = 'https://bittrex.com/api/v1.1/market/cancel';
    return this.call(uri, {uuid: uuid}).map(res=>{
     // console.log(' cancelOrder ', res);
      if(res.success) return {uuid:uuid}
      else return res;
    });
  }

 trackOrder(orderId):Observable<VOOrder>{
   // console.log(' getOrderById  ' + orderId);
    let url = 'https://bittrex.com/api/v1.1/account/getorder';
    //console.log(url);
    return this.call(url, {uuid: orderId}).map(res => {
      let r = <any>res.result;
     // console.log('getOrderById ',r);
      let a = r.Exchange.split('-');

      return {
        uuid:r.OrderUuid,
        action:r.Type.split('_')[1].substr(0,1),
        isOpen:r.IsOpen,
        base:a[0],
        coin:a[1],
        rate:+r.PricePerUnit,
        amountBase:r.Price,
        amountCoin:r.Quantity,
        fee:r.CommissionPaid
      }
    });

  }

  getOpenOrders(base:string, coin:string):Observable<VOOrder[]>{
    let market = base+'-'+coin;
    let uri = 'https://bittrex.com/api/v1.1/market/getopenorders';
    return this.call(uri, {market: market}).map(res=>{
      console.log(' getOpenOrders  '+ market , res);

      return res.result.map(function(o){
        let a = o.Exchange.split('-')
        return {
          uuid:o.OrderUuid,
          action:o.OrderType.substr(6),
          isOpen:!o.Closed,
          rate:o.Limit,
          coin:a[1],
          base:a[0],
          exchange:'bittrex',
          amountCoin:o.Quantity,
          amountBase:o.Price,
          date:o.Opened,
          fee:0,
          timestamp:new Date(o.Opened).getTime()
        }
      });
    })
  }

  downloadOrders(base:string, coin:string):Observable<VOOrder[]>{
    let market = base+'-'+coin;
    let uri = 'https://bittrex.com/api/v1.1/account/getorderhistory';
    //console.log(uri);
    return this.call(uri, {market: market}).map(res=>{
      //console.log(' getorderhistory  '+ market , res);
      return res.result.map(function(o){
        return {
          uuid:o.OrderUuid,
          action:o.OrderType.substr(6),
          isOpen:!o.Closed,
          rate:o.PricePerUnit,
          coin:this.coin,
          base:this.base,
          exchange:'bittrex',
          amountCoin:o.Quantity,
          amountBase:o.Price,
          date:o.TimeStamp,
          fee:o.Commission,
          timestamp:new Date(o.TimeStamp).getTime()
        }
      },{base:base, coin:coin});
    })
  }


 /* getMarketSummary(base:string, coin:string):Observable<VOMarket>{
    return this.marketsObj$().map(res=>{

     if(res) return res[base+'_'+coin];
    })

  }*/

  downloadMarketHistory$;
  downloadMarketHistory(base:string, coin:string):Observable<VOOrder[]>{


      if (this.downloadMarketHistory$) return this.downloadMarketHistory$;

      let market = base + '-' + coin;
      let url = 'api/bittrex/getmarkethistory/' + market;
      console.log(url);

    this.downloadMarketHistory$ = this.http.get(url).map((res: any) => {

      console.log(res);
      this.downloadMarketHistory$ = null;
        return (<any>res).result.map(function (item: VOMarketHistory) {

          let time = (new Date(item.TimeStamp + 'Z'));

          return {
            action: item.OrderType,
            uuid: item.Id,
            exchange: 'bittrex',
            rate: item.Price,
            amountBase: +item.Total,
            amountCoin:+item.Quantity,
            coin: coin,
            base: base,

            timestamp: time.getTime(),
            date: item.TimeStamp,
            minutes:time.getMinutes() +':'+ time.getSeconds(),
            local:time.toLocaleTimeString()
          }
        });

      }, err=>{
      this.downloadMarketHistory$ = null;
    });

    return this.downloadMarketHistory$;
  }



  buyLimit(base: string, coin:string,  quantity: number, rate: number): Observable<VOOrder> {
    let market = base+'-'+coin;
    console.log(' buy market ' + market + '  quantity: ' + quantity + ' rate:' + rate);
    let uri = 'https://bittrex.com/api/v1.1/market/buylimit';
    return this.call(uri, {
      market: market,
      quantity: quantity,
      rate: rate
    }).map(res=>{
      console.log(' buyLimit market ' + market , res);

      return res.result;
    });
  }

  /*{"orderNumber":31226040,"resultingTrades":[{"amount":"338.8732","date":"2014-10-18 23:03:21","rate":"0.00000173","total":"0.00058625","tradeID":"16164","type":"buy"}]}*/

  sellLimit(base: string, coin:string, quantity: number, rate: number): Observable<VOOrder> {

    let market = base+'-'+coin;
    console.log(' sell market ' + market + '  quantity: ' + quantity + ' rate:' + rate);

    let uri = 'https://bittrex.com/api/v1.1/market/selllimit';
    return this.call(uri, {
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



  downloadBooks$
  downloadBooks(base:string, coin:string):Observable<VOBooks>{

    let url = 'api/bittrex/getorderbook/' +base +'-' +coin + '/' + 50;
    console.log(url)
    if(this.downloadBooks$) return this.downloadBooks$;
    this.downloadBooks$ =  this.http.get(url).map((res:any)=>{

      //console.log(res);
      this.downloadBooks$= null;

      let r = (<any>res).result;
     // console.log('books ', r);

      return {
        market:base+'_'+coin,
        exchange:this.exchange,
        buy:r.buy.map(function (o) { return{  amountCoin:o.Quantity, rate:o.Rate } }),
        sell:r.sell.map(function (o) { return{  amountCoin:o.Quantity, rate:o.Rate } })
      }

    }, error=>{
      this.downloadBooks$= null;
    })
    return this.downloadBooks$;
    //return this.books$()
  }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////TODO
  //urlBalances = 'api/2/trading/balance';
  //isLoadingBalances:boolean;
 /* refreshBalances():void {
    if(!this.isLogedInSub.getValue()){
      console.warn(' not logged in');
      return;
    }


    if(this.isLoadingBalances) return;
    this.isLoadingBalances = true;


    console.log('%c refreshBalances  ','color:pink');

    let uri = 'https://bittrex.com/api/v1.1/account/getbalances';
    this.getBalances().toPromise().then(res=>{

      this.isLoadingBalances = false;
      this.dispatchBalances(res);
    }).catch(err=>{
      this.isLoadingBalances = false;
      this.onError(err);

    });
  }*/



  downloadBalances():Observable<VOBalance[]>{
    let uri = 'https://bittrex.com/api/v1.1/account/getbalances';
    this.isLoadingBalances = true;

    return this.call(uri, {}).map(res => {
      this.isLoadingBalances = false;

      console.log(res);
      return res.result.map(function (item) {
        return {
          symbol: item.Currency,
          address: item.CryptoAddress,
          balance: item.Balance,
          available: item.Available,
          pending: item.Pending,
          priceUS: 0,
          balanceUS: 0
        }
      })

    })
  }

  /*loadAllMarketSummaries():void {
    console.log('%c bittrex  loadAllMarketSummaries   ', 'color:orange');
    if (this.isLoadinMarkets) return;
    this.isLoadinMarkets = true;
    let url = 'api/bittrex/summaries';
    console.log(url);


    this.http.get(url).subscribe((result:any) => {

     // console.log(result);
      let marketsAr: VOMarket[] = [];

      let baseCoins: string[] = [];

      let selected: string[] = this.getMarketsSelected();

      let indexed:{} = {}
      let bases:string[] = [];

      ApiBittrex.mapMarkets(result, marketsAr, indexed, bases, selected);

      this.dispatchMarketsData(marketsAr, indexed, bases);

      this.isLoadinMarkets = false;
    })

  }*/

/////////////////////////////////////////////////////////////////////

  urlMarketHistory = 'api/bittrex/getmarkethistory/{{base}}-{{coin}}';
  mapMarketHistory(res):VOOrder[]{
    return (<any>res).result.map(function (item: VOMarketHistory) {

      return {
        action: item.OrderType,
        uuid: item.Id,
        exchange: 'bittrex',
        rate: item.Price,
        amountBase: item.Total,
        timestamp: (new Date(item.TimeStamp + 'Z')).getTime(),
        date: item.TimeStamp
      }
    });
  }

  /*mapBooks(res){
    let r = (<any>res).result;
    console.log('books ', r);
    return {
      buy:r.buy.map(function (o) { return{  amountCoin:o.Quantity, rate:o.Rate } }),
      sell:r.sell.map(function (o) { return{  amountCoin:o.Quantity, rate:o.Rate } })
    }

  }*/


  //urlBooks = 'api/bittrex/getorderbook/{{base}}-{{coin}}/100';
  urlMarkets = '/api/bittrex/summaries';


  mapMarkets(
    result:any,
    marketsAr:VOMarket[],
    indexed:{[pair:string]:VOMarket},
    bases:string[],
    selected:string[]
  ):number{

    let ar:SOMarketBittrex[] = result.result;
    let BASES ={};

    ar.forEach(function (item:SOMarketBittrex) {

      let ar:string[] = item.MarketName.split('-');

      let market:VOMarket = new VOMarket();

      market.base = ar[0];
      if (bases.indexOf(market.base) === -1) bases.push(market.base);
      market.coin = ar[1];
      // if(market.coin ==='BCC') market.coin= 'BCH';
      //market.marketCap = marketCap[market.coin];
      market.pair = ar.join('_');
      market.selected = selected.indexOf( market.pair) !==-1;

      market.id = item.MarketName;
      market.exchange = 'bittrex';

      market.Volume = +item.Volume;
      market.Last = +item.Last;
      market.High = +item.High;
      market.Low = +item.Low;
      market.Ask = +item.Ask;
      market.Bid = +item.Bid;
      market.BaseVolume = +item.BaseVolume;
      market.PrevDay = item.PrevDay;
      market.OpenBuyOrders = item.OpenBuyOrders;
      market.OpenSellOrders = item.OpenSellOrders;
      indexed[market.pair] = market;
      marketsAr.push(market);

    })

    return result.length;
  }

  callInprogress:boolean;

  private call(uri: string, post: any): Observable<any> {
    if (!this.apiKey) {
      console.error(' no key')
      return new BehaviorSubject(null).asObservable();
    }

    post.apikey = this.apiKey;
    post.nonce = Math.ceil(Date.now() / 1000);


    let load = Object.keys(post).map(function (item) {
      return item + '=' + this.post[item];
    }, {post: post}).join('&');

    uri += '?' + load;
    console.log(uri);
    let signed = this.hash_hmac(uri, this.password);
    let url = '/api/bittrex/private';

    return this.http.post(url, {uri: uri, signed: signed});

  }

  hash_hmac(text, password) {
    let dg: any = cryptojs.HmacSHA512(text, password);
    return dg.toString(cryptojs.enc.Hex);
  }



}
