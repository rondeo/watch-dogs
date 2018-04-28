import {VOBalance, VOOrder} from "../../models/app-models";
import {Observable} from "rxjs/Observable";
import {ApiPrivateAbstaract} from "./api-private-abstaract";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import * as cryptojs from 'crypto-js';
import * as _ from 'lodash';
import {HttpClient} from "@angular/common/http";
import {StorageService} from "../../services/app-storage.service";
import {ApiPublicBittrex} from "../api-public/api-public-bittrex";
import {VOSellCoin} from "../../my-bot/services/bot-sell-coin.service";
import {UtilsBooks} from "../../com/utils-books";
import {Subject} from "rxjs/Subject";

export class ApiPrivateBittrex extends ApiPrivateAbstaract{

  balances:VOBalance[];
  exchange ='bittrex'
  apiPublic:ApiPublicBittrex;

  constructor(
    private http:HttpClient,
    storage:StorageService
  ){
    super(storage);
    this.apiPublic  = new ApiPublicBittrex(http);
  }

  sellCoin(sellCoin:VOSellCoin):Observable<VOSellCoin>{
    if(!sellCoin.coinPrice) throw new Error(' need coin price')
   return this.downloadBalance(sellCoin.coin).switchMap(balance =>{
    // console.log(balance);
     if(balance.balance * sellCoin.coinPrice < 10) {
       sellCoin.balance = 0;
     }else sellCoin.balance = balance.balance;

     if(!sellCoin.balance) {
       sellCoin.balance = 0;
       return Observable.of(sellCoin);
     }

     return this.apiPublic.downloadBooks(sellCoin.base, sellCoin.coin).switchMap(books => {
      // console.log(books);

       let rate = UtilsBooks.getRateForAmountCoin(books.buy, sellCoin.balance);
       const myCoinprice = sellCoin.basePrice * rate;
       sellCoin.priceDiff = +(100*(myCoinprice - sellCoin.coinPrice)/sellCoin.coinPrice).toPrecision(2);
       rate = +(rate - (rate* 0.01)).toFixed(8);
       return this.sellLimit(sellCoin.base, sellCoin.coin, sellCoin.balance, rate).switchMap(order =>{
         console.log(order);
         if(order.uuid){
           sellCoin.uuid = order.uuid;
          return this.getOrder(order.uuid).switchMap(order =>{

            return Observable.of(sellCoin)
          })

         }else throw new Error(order.message)



       })


     })


   })

  }

  getOrder(orderId):Observable<VOOrder>{
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

  downloadBalance(symbol:string):Observable<VOBalance>{
    const data = {
      currency:symbol
    };

    const url = 'https://bittrex.com/api/v1.1/account/getbalance';
    return this.call(url, data).map(item=>{
      item = item.result;
        return {
          symbol: item.Currency,
          address: item.CryptoAddress,
          balance: item.Balance,
          available: item.Available,
          pending: item.Pending
        }

    })
  }
  isLoadingBalances:boolean;
  downloadBalances():Observable<VOBalance[]> {
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
          pending: item.Pending
        }
      })

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

  private call(uri: string, post: any): Observable<any> {

    return this.getCredentials().switchMap(cred=>{
      if(!cred) throw new Error('login reqired');
      post.apikey = cred.apiKey;
      post.nonce = Math.ceil(Date.now() / 1000);
      let load = Object.keys(post).map(function (item) {
        return item + '=' + this.post[item];
      }, {post: post}).join('&');

      uri += '?' + load;
      console.log(uri);
      let signed = this.hash_hmac(uri, cred.password);
      let url = '/api/bittrex/private';
      return this.http.post(url, {uri: uri, signed: signed});
    });

  }

  hash_hmac(text, password) {
    let dg: any = cryptojs.HmacSHA512(text, password);
    return dg.toString(cryptojs.enc.Hex);
  }




}
