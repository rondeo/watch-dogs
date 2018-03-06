import {Observable} from 'rxjs/Observable';
import {AuthHttpService} from '../../../../services/auth-http.service';
import {APIBooksService} from "../../../../services/books-service";
import {VOBalance, VOMarket, VOMarketCap, VOMarketHistory, VOOrderBook} from "../../../../models/app-models";
import {StorageService} from "../../../../services/app-storage.service";

import {ApiLogin} from "../../../../shared/api-login";
import {IExchangeConnector} from "../../connector-api.service";

import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {CryptopiaService} from "../../../../exchanges/services/cryptopia.service";
import {applyMixins} from "../../../../shared/utils";
import {SelectedSaved} from "../../../../com/selected-saved";
import {ApiBase} from "../api-base";
import {MarketCapService} from "../../../../market-cap/market-cap.service";
import {Mappers} from "../../../../com/mappers";
import {SOMarketPoloniex} from "../../../../models/sos";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Subject} from "rxjs/Subject";
import {VOOrder} from "../../my-models";


export class ApiPoloniex extends ApiBase {

  constructor(http: HttpClient,
              storage: StorageService,
              marketCap: MarketCapService) {
    super(storage, 'poloniex', marketCap, http);

  }

  getMarketURL(base:string, coin:string){
    return 'https://poloniex.com/exchange#{{base}}_{{coin}}'.replace('{{base}}', base).replace('{{coin}}', coin);
  }


  cancelOrder(orderId): Observable<VOOrder> {
    return this.call({
      command: 'cancelOrder',
      orderNumber: orderId
    }).map(res => {
      console.log(res);
      if (res)
        return {
          uuid: orderId,
          isOpen: (res.success !==1),
          coin: null,
          base: null,
          rate: 0,
          amountCoin:0
        }
      else return null;
    })
  }


  trackOrder(orderId): Observable<VOOrder> {
    return this.call({
      command: 'returnOrderTrades',
      orderNumber: orderId
    }).map(res => {
      console.log(res);


      if (Array.isArray(res) && res.length) {
        let r = res[0];
        let a = r.currencyPair;

        return {
          uuid: orderId,
          amountCoin: +r.amount,
          amountBase: +r.total,
          isOpen: !r.tradeID,
          action: r.type.toUpperCase(),
          coin: a[1],
          base: a[0],
          rate: +r.rate,
          date: r.date,
          timestamp: (new Date(r.date.replace(' ', 'T'))).getTime()

        }
      } else return {
        uuid: orderId,
        isOpen: true,
        action: null,
        coin: null,
        base: null,
        rate: 0,
        amountCoin:0
      }


    })
  }



  downloadOrders(base: string, coin: string): Observable<VOOrder[]> {

    //let url = 'https://poloniex.com/public?command=returnTradeHistory&{{base}}_{{coin}}';
    return this.call({
      command: 'returnTradeHistory',
      currencyPair: base + '_' + coin
    });
  }

  getOpenOrders(base: string, coin: string): Observable<VOOrder[]>{
    return this.call({
      command: 'returnOpenOrders',
      currencyPair: base + '_' + coin
    }).map(res=>{

      console.warn(res);
      return res.map(function (o) {
        return{
          uuid:o.orderNumber,
          action:o.type.toUpperCase(),
          isOpen:true,
          rate:+o.rate,
          coin:coin,
          base:base,
          exchange:'poloniex',
          amountCoin:o.amount,
          amountBase:o.amount * o.rate,
          date:o.date,
          timestamp:new Date(o.date).getTime(),
          fee:0

        }
      })
    })

  }

  /*getMarketSummary(base:string, coin:string):Observable<VOMarket>{
    return this.marketsObj$().map(res=>{
      if(res)return res[base+'_'+coin];
    });
  }*/

  downloadMarketHistory$;
  downloadMarketHistory(base:string, coin:string):Observable<VOOrder[]>{

      if (this.downloadMarketHistory$) return this.downloadMarketHistory$;

      let url = 'https://poloniex.com/public?command=returnTradeHistory&currencyPair={{base}}_{{coin}}';
      url =  url.replace('{{base}}', base).replace('{{coin}}', coin);
      // console.log(url)
     this.downloadMarketHistory$ = this.http.get(url).map((res:any)=>{
       // console.log(res);

       this.downloadMarketHistory$ = null;
        return res.map(function(item) {
          let time = (new Date(item.date.split(' ').join('T')+'Z'));

          return {
            action:item.type.toUpperCase(),
            isOpen:false,
            uuid: item.tradeID,
            exchange: 'poloniex',
            rate:+item.rate,
            amountCoin:+item.amount,
            amountBase:+item.total,
            base: base,
            coin: coin,
            date:item.date,
            minutes:time.getMinutes(),
            timestamp:time.getTime(),
            local:time.toLocaleTimeString()
          };
        });

      }, err=>{
       this.downloadMarketHistory$ = null;
     })
  return this.downloadMarketHistory$

  }



  buyLimit(base: string, coin:string,  quantity: number, rate: number): Observable<VOOrder> {
    let market = base+'_'+coin;
    console.log(' buy market ' + market + '  quantity: ' + quantity + ' rate:' + rate);

    return this.call( {
      command:'buy',
      currencyPair:market,
      rate:rate,
      amount:quantity
    }).map(res=>{


      console.log(' buyLimit market ' + market , res);

      return {
        uuid:res.orderNumber,
        isOpen:!!res.orderNumber,
        rate:res.rate,
        amountCoin:quantity, //TODO get real property
        base:base,
        coin:coin,
        type:res.type
      };
    });
  }

  /*{"orderNumber":31226040,"resultingTrades":[{"amount":"338.8732","date":"2014-10-18 23:03:21","rate":"0.00000173","total":"0.00058625","tradeID":"16164","type":"buy"}]}*/

  sellLimit(base: string, coin:string, quantity: number, rate: number): Observable<VOOrder> {
    let market = base+'_'+coin;
    console.log(' sell market ' + market + '  quantity: ' + quantity + ' rate:' + rate);

    return this.call( {
        command:'sell',
        currencyPair:market,
        rate:rate,
        amount:quantity

    }).map(res=>{
      console.log(' sellLimit market '+market , res);
      return {
        uuid:res.orderNumber,
        isOpen:!!res.orderNumber,
        rate:res.rate,
        amountCoin:quantity, //TODO get real property
        base:base,
        coin:coin,
        type:res.type
      };

    });
  }


/*
  isBooksDownloading:boolean
  downloadBooks(base:string, coin:string):Observable<VOBooks>{

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
    return this.books$();
  }
*/
//TODO
  urlBalances = 'api/2/trading/balance';


  isLoadingBalances:boolean;
 /* refreshBalances():void {

    if(!this.isLogedInSub.getValue()){
      console.warn(' not logged in');
      return;
    }
    if(this.isLoadingBalances) return;
    this.isLoadingBalances = true;

    //console.log('%c refreshBalances  ','color:pink');

    this.call( {command:'returnBalances'}).map(res => {
      //console.log(res);


      if(!res){
        console.warn('refreshBalances null')
        return null;
      }
      if(res.error){
        res.api='returnBalances';
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
      err.api='poloniex returnBalances';
      this.onError(err);

    });
  }*/

  downloadBalances():Observable<VOBalance[]>{

    return this.call( {command:'returnBalances'}).map(res => {
      //console.log(res);


      if (!res) {
        console.warn('refreshBalances null')
        return null;
      }
      if (res.error) {
        res.api = 'returnBalances';
        this.onError(res);

        return null;
      }

      let out = [];

      for (let str in res) {
        let bal = new VOBalance();
        bal.balance = +res[str];
        bal.symbol = str;
        out.push(bal)
      }

      return out;
    });
  }


  /////////////////////////////////////////////////////////////////////////////////////////


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


  urlBooks = 'https://poloniex.com/public?command=returnOrderBook&currencyPair={{base}}_{{coin}}&depth=100';
  urlMarkets = 'https://poloniex.com/public?command=returnTicker';


  mapBooks(res:any):{buy:VOOrder[], sell:VOOrder[]}{
    let buy = res.bids.map(function (item) {
      return{
        amountCoin:+item[1],
        rate:+item[0]
      }
    })

    let sell = res.asks.map(function (item) {
      return{
        amountCoin:+item[1],
        rate:+item[0]
      }
    });

    return {
      buy:buy,
      sell:sell
    }

  }

  /*loadAllMarketSummaries():void {
    console.log('%c ploniex  loadAllMarketSummaries   ', 'color:orange');
    if (this.isLoadinMarkets) return;
    this.isLoadinMarkets = true;

   // let url = '/api/poloniex/markets-summary';
    let url = 'https://poloniex.com/public?command=returnTicker';
    console.log(url);


    this.http.get(url).subscribe((result:any) => {

     // console.log(result);
      let marketsAr: VOMarket[] = [];

      let baseCoins: string[] = [];


      let selected: string[] = this.getMarketsSelected();

      let indexed:{} = {}
      let bases:string[] = [];

      ApiPoloniex.mapMarkets(result, marketsAr, indexed, bases, selected);
      this.dispatchMarketsData(marketsAr, indexed, bases);

      this.isLoadinMarkets = false;
    })

  }*/


  mapMarkets(
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

      indexed[market.pair] = market;
      marketsAr.push(market);
    }
    return i;
  }


  callInprogress:boolean;
  private call( post: any): Observable<any> {



    if (!this.apiKey) {
      console.error(' no key')
      return new BehaviorSubject(null).asObservable();    }

    if(this.callInprogress){

      setTimeout(()=>this.call(post), 300);
    }
    this.callInprogress = true;

    post.nonce = Date.now();

    let load = Object.keys(post).map(function (item) {
      return item + '=' + this.post[item];
    }, {post: post}).join('&');


    let signed = this.hash_hmac(load, this.password);
    let url = '/api/poloniex/private';
   // let url = 'https://poloniex.com/tradingApi';

   /* let headers = new HttpHeaders();

    headers = headers
      //.set('Content-Type',' text/plain')
      .set('Sign', signed)
      .set('Key', this.apiKey);

    console.log(headers.get('Key'));



    return this.http.post(url, post,{headers:headers}).map(res=>{
      this.callInprogress = false;
      return res
    })*/

    return this.http.post(url, {apiKey: this.apiKey, signed: signed, postData:load}).map(res=>{
      this.callInprogress = false;

      return res
    })


  }




}
