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
import {ApiBase, VOBooks} from "./api-base";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {Mappers} from "../../com/mappers";
import {SOMarketPoloniex} from "../../models/sos";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Subject} from "rxjs/Subject";


export class ApiPoloniex extends ApiBase  {

  constructor(
    private http:HttpClient,
    storage:StorageService,
    marketCap:MarketCapService
  ) {
    super(storage, 'poloniex', marketCap);

  }

  cancelOrder(orderId):Observable<VOOrder>{
    return this.call({
      command:'cancelOrder',
      orderNumber:orderId
    }).map(res=>{
      if(res)
      return {
        uuid:orderId,
        isOpen:false,
        coin:null,
        base:null,
        rate:0
      }
      else return null;
    })
  }

  trackOrder(orderId):Observable<VOOrder> {
    return this.call({
      command: 'returnOrderTrades',
      orderNumber: orderId
    }).map(res=>{
      console.log(res);


      if(Array.isArray(res) && res.length){
        let r = res[0];
        let a = r.currencyPair;

        return{
          uuid:orderId,
          amountCoin:+r.amount,
          amountBase:+r.total,
          isOpen: !r.tradeID,
          action:r.type.toUpperCase(),
          coin: a[1],
          base: a[0],
          rate:+r.rate,
          date:r.date,
          timestamp:(new Date(r.date.replace(' ','T'))).getTime()

        }
      }else return{
        uuid:orderId,
        isOpen: true,
        action:null,
        coin: null,
        base: null,
        rate:0
      }


    })
  }


   /*trackOrder(orderId):Observable<VOOrder>{
     return this.call({
       command:'returnOrderTrades',
       orderNumber:orderId
     }).switchMap(res=>{
       console.log(res);



       let a = res.currencyPair;
       if(!a) {
         console.error(res);
         return res;
       }

//116813692494

       return this.call({
         command:'returnOpenOrders',
         currencyPair:res.currencyPair
       }).map(res2=> {

         console.log(res2);

         let uuid = res2.orderNumber;

         if(uuid !==orderId){
           console.error(orderId, res, res2);
         }

         let trades:{
           amount:string,
           date:string,
           rate:string,
           total:string,
           tradeID:string,
           type:string
         }[] = res2.resultingTrades;


         return {
           action: res.type.toUpperCase(),
           uuid: res.tradeID,
           isOpen: true,
           coin: a[0],
           base: a[1],
           rate: res.rate,
           amountCooin: res.amount,
           amountBase: res.total,
           fee: res.fee

         }

       });
     });
   }
*/

  downloadOrders(base:string, coin:string):Observable<VOOrder[]>{

    //let url = 'https://poloniex.com/public?command=returnTradeHistory&{{base}}_{{coin}}';
    return this.call({
      command:'returnTradeHistory',
      currencyPair: base+'_'+coin
    });
  }


  getMarketSummary(base:string, coin:string):Observable<VOMarket>{
    return this.marketsObj$().map(res=>{
      if(res)return res[base+'_'+coin];
    });
  }

  downloadMarketHistory(base:string, coin:string):Observable<VOOrder[]>{

      if (this.isMarketHistoryDoawnloading) return this.marketHistorySub.asObservable();
      this.isMarketHistoryDoawnloading = true;
      let url = 'https://poloniex.com/public?command=returnTradeHistory&currencyPair={{base}}_{{coin}}';
      url =  url.replace('{{base}}', base).replace('{{coin}}', coin);
      // console.log(url)
      this.http.get(url).map((res:any)=>{
        console.log(res)
        return res.map(function(item) {
          return {
            action:item.type.toUpperCase(),
            isOpen:false,
            uuid: item.tradeID,
            exchange: 'poloniex',
            rate:+item.rate,
            amountBase:+item.total,
            base: base,
            coin: coin,
            date:item.date,
            timestamp:(new Date(item.date.split(' ').join('T')+'Z')).getTime()
          };
        });

      }).toPromise().then(res=>{
        this.isMarketHistoryDoawnloading = false;
        this.dispatchMarketHistory(res);
        return res;
      }).catch(err=>{
        this.isMarketHistoryDoawnloading = false;
        console.error(err);
        return err;
      });



  return this.marketHistorySub.asObservable()


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
        base:base,
        coin:coin,
        type:res.type
      };

    });
  }


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

  }

  loadAllMarketSummaries():void {
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
