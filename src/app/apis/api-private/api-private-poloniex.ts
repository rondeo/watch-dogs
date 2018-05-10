import {ApiPrivateAbstaract} from "./api-private-abstaract";
import {StorageService} from "../../services/app-storage.service";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {VOBalance, VOOrder} from "../../models/app-models";
import {UtilsBooks} from "../../com/utils-books";
import {ApiPublicPoloniex} from "../api-public/api-public-poloniex";

import * as cryptojs from 'crypto-js';
import {Subject} from "rxjs/Subject";

export class ApiPrivatePoloniex extends ApiPrivateAbstaract{
  apiPublic: ApiPublicPoloniex
  constructor(
    private http:HttpClient,
    storage:StorageService
  ){
    super(storage)
  }


 /* sellCoin(sellCoin:VOSellCoin):Observable<VOSellCoin>{
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

  }*/

  getOrder(orderId):Observable<VOOrder>{
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

  balancesSub: Subject<VOBalance[]>

  downloadBalance(symbol:string):Observable<VOBalance>{
    if(this.isLoadingBalances) return this.balancesSub.asObservable()
      .map(balabces=>{
      return balabces.find(function (bal) {
        return bal.symbol === symbol;
      })
    })
   return this.downloadBalances().map(res => {
     return res.find(function (bal) {
       return bal.symbol === symbol;
     })
   })
  }

  isLoadingBalances:boolean;

  downloadBalances():Observable<VOBalance[]> {
    this.balancesSub = new Subject();
    this.isLoadingBalances = true;
    return this.call( {command:'returnBalances'}).map(res => {
      //console.log(res);


      if (!res) {
        console.warn('refreshBalances null')
        return null;
      }
      if (res.error) {
        throw new Error(res.error);
      }

      let out = [];

      for (let str in res) {
        let bal = new VOBalance();
        bal.balance = +res[str];
        bal.symbol = str;
        out.push(bal)
      }

      this.isLoadingBalances = false;
      this.balancesSub.next(out);
      return out;
    });
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

  private call(post: any): Observable<any> {

    return this.getCredentials().switchMap(cred=>{
      if(!cred) throw new Error('login reqired');

      post.nonce = Math.ceil(Date.now() / 1000);

      let load = Object.keys(post).map(function (item) {
        return item + '=' + this.post[item];
      }, {post: post}).join('&');


      let signed = this.hash_hmac(load, cred.password);
      let url = '/api/poloniex/private';;
      console.log(url);
      return this.http.post(url, {apiKey: cred.apiKey, signed: signed, postData:load}).map(res=>{

        return res
      })

    });

  }

  hash_hmac(text, password) {
    let dg: any = cryptojs.HmacSHA512(text, password);
    return dg.toString(cryptojs.enc.Hex);
  }



}
