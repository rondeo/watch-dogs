import {Observable} from 'rxjs/Observable';
import {AuthHttpService} from '../../../services/auth-http.service';
import {VOBalance, VOBooks, VOMarket, VOMarketCap, VOOrder, VOOrderBook, VOTrade} from "../../../models/app-models";
import {StorageService} from "../../../services/app-storage.service";

import {ApiLogin} from "../../../shared/api-login";
import {IExchangeConnector} from "../connector-api.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {SelectedSaved} from "../../../com/selected-saved";
import {ApiBase, PrivateCalls} from "./api-base";
import {MarketCapService} from "../../../market-cap/services/market-cap.service";
import {Mappers} from "../../../apis/mappers";
import {SOMarketBittrex, SOMarketPoloniex} from "../../../models/sos";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Subject} from "rxjs/Subject";

import * as cryptojs from 'crypto-js';
import {HttpDelay} from "../../../apis/http-delay";




export class ApiHitbtc extends ApiBase  {

  inProcess: boolean;

  myHttp: HttpDelay;
  constructor(
    http:HttpClient,
    storage:StorageService,
    marketCap:MarketCapService,

  ) {
    super(storage, 'hitbtc', marketCap, http);
    this.myHttp = new HttpDelay(http);

  }

  getMarketURL(base:string, coin:string){
    return 'https://hitbtc.com/exchange/{{coin}}-to-{{base}}'.replace('{{base}}', base).replace('{{coin}}', coin);
  }

  cancelOrder(uuid: string): Observable<VOOrder> {
  return this.privateCall(PrivateCalls.CANCEL_ORDER, {uuid:uuid})
  }



  buyLimit(base: string, coin:string,  quantity: number, rate: number): Observable<VOOrder> {
   return this.privateCall(PrivateCalls.BUY_LIMIT,
     {
       action:'BUY',
       amount:quantity,
       rate:rate,
       base:base,
       coin:coin
     })
  }


  sellLimit(base: string, coin:string, quantity: number, rate: number): Observable<VOOrder> {
    return this.privateCall(PrivateCalls.SELL_LIMIT,
      {
        action:'SELL',
        amount:quantity,
        rate:rate,
        base:base,
        coin:coin
      })

  }



  privateCall(method:PrivateCalls, data:any):Observable<any>{
    if(!this.apiKey){

     // const cred = JSON.parse(this.storage.getItem(this.exchange + '-credentials', true));
     // this.apiKey = cred.apiKey;
     // this.password = cred.password;

    }

    if(data && data.base && data.base ==='USDT') data.base = 'USD';


    let headers: HttpHeaders = new HttpHeaders().set("Authorization", "Basic " + btoa(this.apiKey + ":" +this.password));
    let url:string;
    switch(method){
      case PrivateCalls.BALANCES:
      //  console.warn(' balances');


          url = 'api/hitbtc/trading/balance';

          console.log(url);

          return this.http.get(url, {headers})
            .map((res:any[])=>res.map(function (item:any) {
              if(item.currency ==='USD')item.currency = 'USDT';
              return{
                symbol:item.currency,
                balance:+item.available + (+item.reserved),
                available:+item.available
              }
            }));

      case PrivateCalls.ORDERS_HISTORY:
        url = 'api/hitbtc/coindatas/trades?symbol={{coin}}{{base}}'.replace('{{base}}',data.base).replace('{{coin}}', data.coin);
        console.log(url);
        return this.http.get(url, {headers})
          .map(res=>{
            //console.log(res);
              let result:any = res;
             return result.map(function (item) {
                return{
                  uuid:item.orderId,
                  action:item.side.toUpperCase(),
                  fee:+item.fee,
                  rate:+item.price,
                  amountCoin:+item.quantity,
                  amountBase:+item.quantity * +item.price,
                  date:item.timestamp,
                  timestamp:new Date(item.timestamp).getTime()

                }
              })


          });

      case PrivateCalls.CANCEL_ORDER:
        url = 'api/hitbtc-delete/'+data.uuid;
        return this.http.get(url, {headers})
          .map((res:any)=>{
            console.log(res);
            let result:any = res;
            return {
              uuid:res.clientOrderId,
              isOpened:!(res.status==='canceled'),
              action:res.side.toUpperCase(),
              rate:+res.price,
              amountCoin:+res.quantity,
              date:res.createdAt,
              timestamp:new Date(res.createdAt).getTime()
            }
          });

      case PrivateCalls.OPEN_ORDERS:
        url = 'api/hitbtc/order?symbol={{coin}}{{base}}'.replace('{{base}}',data.base).replace('{{coin}}', data.coin);
        console.log(url);
        return this.http.get(url, {headers})
          .map((res:any[])=>{
            console.log(res);

            return res.map(function (item) {
              return{
                isOpen:true,
                id:item.id,
                uuid:item.clientOrderId,
                action:item.side.toUpperCase(),
                rate:+item.price,
                amountCoin:+item.quantity,
                amountBase:+item.price * +item.quantity,
                date:item.createdAt,
                timestamp:new Date(item.createdAt).getTime(),
                status:item.status
              }
            });
          });

      case PrivateCalls.BUY_LIMIT:

      let dataB= {
        side:data.action.toLowerCase(),
        quantity:data.amount,
        price:data.rate,
        symbol:data.coin+data.base
      }

        url = 'api/hitbtc/order';
        console.log(url, dataB)
        return this.http.post(url, dataB,{headers})

          .map((res:any)=>{
            console.log(res);
            let result:any = res;
            return {
              id:res.id,
              uuid:res.clientOrderId,
              isOpen:res.status ==='new',
              action:res.side.toUpperCase(),
              amountCoin:+res.quantity,
              rate:+res.price,
              status:res.status
            }
          });

      case PrivateCalls.SELL_LIMIT:

        let dataS= {
          side:data.action.toLowerCase(),
          quantity:data.amount,
          price:data.rate,
          symbol:data.coin+data.base
        }
        url = 'api/hitbtc/order';
        console.log(url, dataS)
        return this.http.post(url, dataS,{headers})
          .map((res:any)=>{
            console.log(res);

            let result:any = res;

            return {
              id:res.id,
              isOpen:res.status ==='new',
              uuid:res.clientOrderId,
              action:res.side.toUpperCase(),
              amountCoin:+res.quantity,
              rate:+res.price,
              status:res.status

            }
          });


    }

  }



////////////////////////////////////////////////////////////////////////////////////////


  downloadBooks(base:string, coin:string):Observable<VOBooks>{
    if(base ==='USDT') base = 'USD';

    let url = '/api/hitbtc/public/orderbook/{{coin}}{{base}}'.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.myHttp.get(url).map((res:any)=>{
      console.log(res);

      let buy:VOTrade[] = res.bid.map(function (item) {
        return{
          amountCoin:+item.size,
          rate:+item.price
        }
      });

      let sell = res.ask.map(function (item) {
        return{
          amountCoin:+item.size,
          rate:+item.price
        }
      });

      return {
        market:null,
        exchange:null,
        buy:buy,
        sell:sell
      }

    })
  }

  downloadMarketHistory$
  downloadMarketHistorySub:Subject<VOOrder[]> = new Subject<VOOrder[]>()

  downloadMarketHistory(base:string, coin:string):Observable<VOOrder[]>{

    if(base ==='USDT') base='USD';
    let url ='/api/hitbtc/public/trades/{{coin}}{{base}}?sort=DESC'.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);

   this.myHttp.get(url).map((res:any)=>{
      console.warn(res);

      return res.map(function(item) {
        let time = new Date(item.timestamp)
        return {
          action:item.side.toUpperCase(),
          isOpen:false,
          uuid: item.id,
          exchange: 'hitbtc',
          rate:+item.price,
          amountBase:+item.quantity * +item.price,
          amountCoin:+item.quantity,
          date:item.timestamp,
          minutes:time.getMinutes(),
          local:time.toLocaleTimeString(),
          timestamp:time.getTime()
        };
      });
    }).subscribe(res =>this.downloadMarketHistorySub.next(res));
    return this.downloadMarketHistorySub.asObservable();
  }

  getOpenOrders(base:string, coin:string):Observable<VOOrder[]>{
    return this.privateCall(PrivateCalls.OPEN_ORDERS, {base,coin})
  }

  downloadOrders(base:string, coin:string):Observable<VOOrder[]>{
    return this.privateCall(PrivateCalls.ORDERS_HISTORY, {base,coin})
  }

  downloadBalances(){
    return  this.privateCall(PrivateCalls.BALANCES, null)
  }


  /* mapBooks(res){
     console.log(res);

     let buy = res.bid.map(function (item) {
       return{
         Quantity:+item.size,
         Rate:+item.price
       }
     });

     let sell = res.ask.map(function (item) {
       return{
         Quantity:+item.size,
         Rate:+item.price
       }
     });

     return {
       market:null,
       exchange:null,
       buy:buy,
       sell:sell
     }

   }
 */

 // urlBooks = '/api/hitbtc/public/orderbook/{{coin}}{{base}}';
  urlMarkets = '/api/hitbtc/public/ticker';

  mapMarkets(
    result:any,
    marketsAr:VOMarket[],
    indexed:{[pair:string]:VOMarket},
    bases:string[],
    selected:string[]
  ):number{

    let ar:any = result;
   // console.log(ar);
    ar.forEach(function (item) {
      let market:VOMarket = new VOMarket();
      market.base = item.symbol.slice(-3);
      if(market.base ==='USD') market.base ='USDT';
      if (bases.indexOf(market.base) === -1) bases.push(market.base);
      market.coin = item.symbol.slice(0,-3);
      market.pair = market.base +'_'+market.coin;
      market.selected = selected.indexOf( market.pair) !==-1;

      market.id = item.symbol;
      market.exchange = 'hitbtc';

    //  market.Volume = +item.volume;
      market.Last = +item.last;
      market.high = +item.high;
      market.low = +item.low;
      market.Ask = +item.ask;
      market.Bid = +item.bid;
      market.BaseVolume =+item.volume *  +item.last;
      market.PrevDay = item.open;
      indexed[market.pair] = market;
      marketsAr.push(market);
    });

    return result.length;
  }

  hash_hmac(text, password) {
    let dg: any = cryptojs.HmacSHA512(text, password);
    return dg.toString(cryptojs.enc.Hex);
  }



}
