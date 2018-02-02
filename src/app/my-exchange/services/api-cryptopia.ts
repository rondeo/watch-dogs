import {Observable} from 'rxjs/Observable';
import {AuthHttpService} from '../../services/auth-http.service';
import {APIBooksService} from "../../services/books-service";
import {VOBalance, VOMarket, VOMarketCap, VOMarketHistory, VOOrder, VOOrderBook} from "../../models/app-models";
import {StorageService} from "../../services/app-storage.service";

import {ApiLogin} from "../../shared/api-login";
import {IExchangeConnector} from "./connector-api.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {CryptopiaService} from "../../exchanges/services/cryptopia.service";
import {applyMixins} from "../../shared/utils";
import {SelectedSaved} from "../../com/selected-saved";
import {ApiBase, PrivateCalls, VOBooks} from "./api-base";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {Mappers} from "../../com/mappers";
import {SOMarketBittrex, SOMarketCryptopia, SOMarketPoloniex} from "../../models/sos";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Subject} from "rxjs/Subject";

import * as cryptojs from 'crypto-js';


export class ApiCryptopia extends ApiBase  {

  constructor(
    http:HttpClient,
    storage:StorageService,
    marketCap:MarketCapService,

  ) {
    super(storage, 'cryptopia', marketCap, http);

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


    let headers: HttpHeaders;


    let url:string;
    switch(method){
      case PrivateCalls.BALANCES:
        url = 'https://www.cryptopia.co.nz/api/GetBalance?apikey='+this.apiKey+'&nonce='+Math.floor(Date.now()/1000);

        //let signature = this.apiKey + 'POST'+ url + Math.floor(Date.now()/1000);

        let signed = this.hash_hmac(url, this.password);


        headers = new HttpHeaders().set("apisign", signed);//this.apiKey + btoa(this.apiKey + ":" +this.password));


        console.log(url);

        return this.http.post(url, null, {headers})
          .map((res:any[])=>{
            console.warn(res);
            res.map(function (item:any) {


              return{
                symbol:item.currency,
                balance:+item.available + (+item.reserved),
                available:+item.available
              }
            })
          });
      case PrivateCalls.ORDERS_HISTORY:
        url = 'api/hitbtc/history/trades?symbol={{coin}}{{base}}'.replace('{{base}}',data.base).replace('{{coin}}', data.coin);
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


  getOpenOrders(base:string, coin:string):Observable<VOOrder[]>{
    return this.privateCall(PrivateCalls.OPEN_ORDERS, {base,coin})
  }

  downloadOrders(base:string, coin:string):Observable<VOOrder[]>{
    return this.privateCall(PrivateCalls.ORDERS_HISTORY, {base,coin})
  }

  downloadBalances(){
    return  this.privateCall(PrivateCalls.BALANCES, null)
  }

//////////////////////////////////////////   PUBLIC ///////////////////////////


  downloadBooks(base:string, coin:string):Observable<VOBooks>{

    let url = 'https://www.cryptopia.co.nz/api/GetMarketOrders/{{coin}}_{{base}}/100'.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res:any)=>{
     // console.log(res);
      res = res.Data;

      let buy = res.Buy.map(function (item) {
        return{
          Quantity:+item.Total,
          Rate:+item.Price
        }
      });

      let sell = res.Sell.map(function (item) {
        return{
          Quantity:+item.Total,
          Rate:+item.Price
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

  downloadMarketHistory(base:string, coin:string):Observable<VOOrder[]>{


    let url ='https://www.cryptopia.co.nz/api/GetMarketHistory/{{coin}}_{{base}}/1'.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res:any)=>{
      res = res.Data
      console.warn(res);

      return res.map(function(item) {
        return {
          action:item.Type.toUpperCase(),
          isOpen:false,
          uuid:item.Timestamp,
          exchange: 'cryptopia',
          rate:+item.Price,
          amountBase:+item.Total,
          amountCoin:+item.Amount,
          date:item.Timestamp,
          timestamp:item.Timestamp *1000
        };
      });
    });
  }



//////////////////////////////////////////////////////////////////////////////////////MARKETS

  getAllMarkets():Observable<VOMarket[]>{

    let markets = this.marketsArSub.getValue();

    if(!markets && !this.isLoadinMarkets){
      let url = 'https://www.cryptopia.co.nz/api/GetMarkets';
      this.isLoadinMarkets = true;
      console.log(url);
      this.http.get(url).subscribe((res:any)=>{
       let  result = res.Data;

        let marketsAr: VOMarket[] = [];

        let baseCoins: string[] = [];

        let selected: string[] = this.getMarketsSelected();

        let indexed:{} = {}
        let bases:string[] = [];
        ApiCryptopia.mapMarkets(result, marketsAr, indexed, bases, selected);

        this.dispatchMarketsData(marketsAr, indexed, bases);

        this.isLoadinMarkets = false;
      }, error=>{
        this.isLoadinMarkets = false;
      });

    };

    return this.marketsArSub.asObservable();

  }

  static mapMarkets(
    result:any,
    marketsAr:VOMarket[],
    indexed:{[pair:string]:VOMarket},
    bases:string[],
    selected:string[]
  ):number{

    let ar:any = result;
    console.log(ar);
    ar.forEach(function (item:SOMarketCryptopia) {
      let ar:string[] = item.Label.split('/');

      let market:VOMarket = new VOMarket();
      market.base = ar[1];
      if(bases.indexOf(market.base) === -1) bases.push(market.base);
      market.coin = ar[0];

      market.pair =  ar[1] + '_' +  ar[0];
      market.selected = selected.indexOf( market.pair) !==-1;

      market.id = item.Label;
      market.exchange = 'cryptopia';

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

      indexed[market.pair] = market;
      marketsAr.push(market);

    })

    return result.length;
  }

  hash_hmac(text, password) {
    let dg: any = cryptojs.HmacSHA512(text, password);
    return dg.toString(cryptojs.enc.Hex);
  }



}
