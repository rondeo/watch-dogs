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


  getMarketURL(base:string, coin:string){
    return 'https://www.cryptopia.co.nz/Exchange?market={{coin}}_{{base}}'.replace('{{base}}', base).replace('{{coin}}', coin);
  }

  cancelOrder(uuid: string): Observable<VOOrder> {
    let url = 'https://www.cryptopia.co.nz/Api/CancelTrade';
    let params = {
      Type:'Trade',
      OrderId: uuid
    };

    var header_value = this.createHeader(url, params);
    console.log(url, params)
    return this.http.post('api/cryptopia/private', {
      method: url,
      header_value: header_value,
      params: params
    })
      .map((res: any) => {
        console.log(res);
       res = res.Data
        return {
          uuid: res[0],
          isOpen:false
        }
      });
  }



  buyLimit(base: string, coin:string,  quantity: number, rate: number): Observable<any> {

    let url = 'https://www.cryptopia.co.nz/Api/SubmitTrade';
    let params= {
      Type: 'Buy',
      Amount: quantity,
      Rate: rate,
      Market: coin + '/' + base
    };

    var header_value = this.createHeader(url, params);
    console.log(url, params)
    return this.http.post('api/cryptopia/private', {
      method: url,
      header_value: header_value,
      params: params
    }).map((res: any) => {
        console.log(res);
         res = res.Data;
         if(res.FilledOrders){
           return {
             uuid: res.res.FilledOrders[0],
             isOpen: false
           }
         }else{
           return {
             uuid: res.OrderId,
             isOpen: true
           }

         }

      });
  }


  sellLimit(base: string, coin:string, quantity: number, rate: number): Observable<VOOrder> {

   let  url = 'https://www.cryptopia.co.nz/Api/SubmitTrade';
    let params = {
      Type: 'Sell',
      Amount: quantity,
      Rate: rate,
      Market: coin + '/' + base
    };

    var header_value = this.createHeader(url, params);

    console.log(url, params)
    return this.http.post('api/cryptopia/private', {
      method: url,
      header_value: header_value,
      params: params
    })
      .map((res: any) => {
        console.log(res);
        res = res.Data;

        if(res.FilledOrders && res.FilledOrders.length){
          return {
            uuid: res.FilledOrders[0],
            isOpen: false
          }
        }else{
          return {
            uuid: res.OrderId,
            isOpen: true
          }

        }
      });


  }


  private createHeader(url, params){
    let   API_KEY= this.apiKey;
    let  API_SECRET= this.password;
    var requestContentBase64String = cryptojs.MD5( JSON.stringify(params) ).toString(cryptojs.enc.Base64);
    var nonce = new Date().getTime();
    var signature = this.apiKey + "POST" + encodeURIComponent(url).toLowerCase() + nonce + requestContentBase64String;
    let hmacsignature = cryptojs.HmacSHA256(signature, cryptojs.enc.Base64.parse(API_SECRET)).toString(cryptojs.enc.Base64);

    return "amx " + API_KEY + ":" + hmacsignature + ":" + nonce;
  }



  getOpenOrders(base:string, coin:string):Observable<VOOrder[]>{

    let url = 'https://www.cryptopia.co.nz/Api/GetOpenOrders';
    let params = {
      Market: coin + '/' + base
    };

    var header_value = this.createHeader(url, params);
    console.log(url, params)
    return this.http.post('api/cryptopia/private', {
      method: url,
      header_value: header_value,
      params: params
    })
      .map((res: any) => {
        //console.log(res);
        res = res.Data;

        return res.map(function (item) {
          let a = item.Market.split('/');
          return {
            uuid:item.OrderId,
            isOpen:true,
            amountCoin:item.Amount,
            amountBase:item.Total,
            rate:item.Rate,
            action:item.Type,
            base:a[1],
            coin:a[0],
            exchange:'cryptopia'

          }
        })
      });
  }

  downloadOrders(base:string, coin:string):Observable<VOOrder[]>{
    let url = 'https://www.cryptopia.co.nz/Api/GetTradeHistory';
    let params = {
      Market: coin + '/' + base
    };

    var header_value = this.createHeader(url, params);
    console.log(url, params)
    return this.http.post('api/cryptopia/private', {
      method: url,
      header_value: header_value,
      params: params
    })
      .map((res: any) => {
       // console.log(res);
        res = res.Data;
        return res.map(function (item) {
          let a = item.Market.split('/');
          return{
            uuid:item.TradeId,
            isOpen:false,
            action:item.Type.toUpperCase(),
            amountCoin:+item.Amount,
            amountBase:+item.Total,
            rate:+item.Rate,
            fee:item.Fee,
            base:a[1],
            coin:a[0],
            date:item.TimeStamp,
            timestamp:new Date(item.TimeStamp).getTime()

          }
        })
      });
    //return this.privateCall(PrivateCalls.ORDERS_HISTORY, {base,coin})
  }



  downloadBalances(){
   // console.error('bals');

    let url = 'https://www.cryptopia.co.nz/Api/GetBalance';
    // params = { Currency: 'USDT' }
    let params = {

    }
    var header_value = this.createHeader(url, params);
    console.log(url);
    return this.http.post('api/cryptopia/private', {
      method: url,
      header_value: header_value,
      params: params
    })
      .map((res: any) => {
        // console.warn(res);
        return res.Data.map(function (item: any) {
          return {
            symbol: item.Symbol,
            balance: +item.Total,
            available: +item.Available
          }
        })
      });



  //return this.privateCall(PrivateCalls.BALANCES, {})

/*this.isBal.subscribe(res=>{
  console.warn(res);
})*/

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
      res = res.Data;
      console.log('MarketHistory '+res.length);
      return res.map(function(item) {
        let time = new Date(item.Timestamp *1000);
        return {
          action:item.Type.toUpperCase(),
          isOpen:false,
          uuid:item.Timestamp,
          exchange: 'cryptopia',
          rate:+item.Price,
          amountBase:+item.Total,
          amountCoin:+item.Amount,
          date:time.toUTCString(),
          minutes:time.getMinutes(),
          timestamp:item.Timestamp *1000,
          local:time.toLocaleTimeString()
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
    //console.log(ar);
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

  hash_hmac256(text, password) {
    let dg: any = cryptojs.HmacSHA256(text, password);
    return dg.toString(cryptojs.enc.Hex);
  }



}
