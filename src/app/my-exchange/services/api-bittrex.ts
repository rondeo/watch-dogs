import {Observable} from 'rxjs/Observable';
import {AuthHttpService} from '../../services/auth-http.service';
import {APIBooksService} from "../../services/books-service";
import {VOBalance, VOMarket, VOMarketCap, VOMarketHistory, VOOrder, VOOrderBook} from "../../models/app-models";
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
import {SOMarketBittrex, SOMarketPoloniex} from "../../models/sos";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Subject} from "rxjs/Subject";

import * as cryptojs from 'crypto-js';

export class ApiBittrex extends ApiBase  {

  constructor(
    private http:HttpClient,
    storage:StorageService,
    marketCap:MarketCapService
  ) {
    super(storage, 'bittrex', marketCap);

  }

  cancelOrder(uuid: string): Observable<VOOrder> {
    let uri = 'https://bittrex.com/api/v1.1/market/cancel';
    return this.call(uri, {uuid: uuid}).map(res=>{
      console.log(' cancelOrder ', res);
      return res;
    });
  }

  trackOrder(orderId):Observable<VOOrder>{
    console.log(' getOrderById  ' + orderId);
    let url = 'https://bittrex.com/api/v1.1/account/getorder';
    return this.call(url, {uuid: orderId}).map(res => {
      let r = <any>res.result;
      console.log('getOrderById ',r);
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


  downloadOrders(base:string, coin:string):Observable<VOOrder[]>{

    //let url = 'https://poloniex.com/public?command=returnTradeHistory&{{base}}_{{coin}}';
    let market = base+'-'+coin;

    let uri = 'https://bittrex.com/api/v1.1/market/getopenorders';
    return this.call(uri, {market: market}).map(res=>{
      console.log(' getOpenOrders  '+ market , res);
      return res;
    })
  }


  getMarketSummary(base:string, coin:string):Promise<VOMarket>{
    let sub = this.marketsObj$();

    return new Promise(function(resolve, reject) {
      sub.subscribe(res=>{
        if(res) resolve(res[base+'_'+coin]);
      })
    })
  }

  downloadMarketHistory(base:string, coin:string){
    let url = 'https://poloniex.com/public?command=returnTradeHistory&currencyPair={{base}}_{{coin}}';
   url =  url.replace('{{base}}', base).replace('{{coin}}', coin);
   // console.log(url)
    this.http.get(url).map((res:any)=>{
      console.log(res)
      return res.map(function(item) {
        return {
          action:item.type.toUpperCase(),
          uuid: item.tradeID,
          exchange: 'poloniex',
          rate:+item.rate,
          amountBase:+item.total,
          base: base,
          coin: coin,
          date:item.date,
          timestamp:(new Date(item.date.split(' ').join('T')+'Z')).getTime()

      }
      })

      /*
 amount
:
"426.99207834"
date
:
"2018-01-21 14:59:06"
globalTradeID
:
332735146
rate
:
"0.00000063"
total
:
"0.00026900"
tradeID
:
5047797
type
:
"sell"*/
    }).toPromise().then(res=>{
      this.dispatchMarketHistory(res)
    }).catch(err=>{
      console.error(err)
    })
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


  isBooksDownloading:boolean
  downloadBooks(base:string, coin:string){

    if(this.isBooksDownloading) return;
    this.isBooksDownloading = true;
    let url = 'https://poloniex.com/public?command=returnOrderBook&currencyPair='+base+'_'+coin+'&depth=100'

    //let url = '/api/poloniex/orderBook/'+base+'_'+coin+'/100';
    console.log(url)
    this.http.get(url).map((res:any)=>{
      this.isBooksDownloading = false;
      console.log(res);
      let buy = res.bids.map(function (item) {
        return{
          Quantity:+item[1],
          Rate:+item[0]
        }
      })

      let sell = res.asks.map(function (item) {
        return{
          Quantity:+item[1],
          Rate:+item[0]
      }
      });

      return {
        market:base+'_'+coin,
        exchange:this.exchange,
        buy:buy,
        sell:sell
      }

    }).toPromise().then(res=>{

      this.dispatchBook(res)
    }).catch(err=>{
      this.isBooksDownloading = false;
    })
  }


  isLoadingBalances:boolean;
  refreshBalances():void {
    if(!this.isLogedInSub.getValue()){
      console.warn(' not logged in');
      return;
    }


    if(this.isLoadingBalances) return;
    this.isLoadingBalances = true;


    console.log('%c refreshBalances  ','color:pink');

    let uri = 'https://bittrex.com/api/v1.1/account/getbalances';
    this.call(uri, {}).map(res => {

      if(!res){
        console.log('refreshBalances null')
        return null;
      }

      return res.result.map(function (item) {

        return {
          symbol: item.Currency,
          address: item.CryptoAddress,
          balance: item.Balance,
          available: item.Available,
          pending: item.Pending,
          priceUS:0,
          balanceUS:0
        }
      })
    }).toPromise().then(res=>{
      this.isLoadingBalances = false;
      this.dispatchBalances(res);
    }).catch(err=>{
      this.isLoadingBalances = false;
      this.onError(err);

    });
  }


  loadAllMarketSummaries():void {
    console.log('%c bittrex  loadAllMarketSummaries   ', 'color:orange');
    if (this.isLoadinMarkets) return;
    this.isLoadinMarkets = true;

   // let url = '/api/poloniex/markets-summary';
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

  }


  static mapMarkets(
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
