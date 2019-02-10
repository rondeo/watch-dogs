import {ApiPrivateAbstaract} from './api-private-abstaract';
import {StorageService} from '../../services/app-storage.service';
import {HttpClient} from '@angular/common/http';

import {VOBalance, VOOrder} from '../../../amodels/app-models';
import {UtilsBooks} from '../../../acom/utils-books';
import {ApiPublicPoloniex} from '../api-public/api-public-poloniex';

import * as cryptojs from 'crypto-js';

import {UserLoginService} from '../../services/user-login.service';
import {UTILS} from '../../../acom/utils';
import {Observable} from 'rxjs/internal/Observable';
import {map} from 'rxjs/operators';
import {Subject} from 'rxjs/internal/Subject';

export class ApiPrivatePoloniex extends ApiPrivateAbstaract {
  apiPublic: ApiPublicPoloniex
  exchange = 'poloniex';

  constructor(
    private http: HttpClient,
    userLogin: UserLoginService
  ) {
    super(userLogin);
  }


  /* sellCoin(sellCoin:VOSellCoin):Observable<VOSellCoin>{
     if(!sellCoin.coinPrice) throw new Error(' need coin price')
     return this.getBalance(sellCoin.coin).switchMap(balance =>{
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

  downloadAllOpenOrders(): Observable<VOOrder[]> {
    //let url = 'https://poloniex.com/public?command=returnTradeHistory&{{base}}_{{coin}}';
    return this.call({
      command: 'returnOpenOrders',
      currencyPair: 'all'
    }).pipe(map(res => {
      let out = [];
     //  console.log(' AllOpenOrders ', res);
      for(let str in res) {
        const orders:any[] = res[str];
        if(orders.length) {
          const ar = str.split('_');
          out = out.concat(orders.map(function (o) {
            return {
              uuid: o.orderNumber,
              action: o.type.toUpperCase(),
              isOpen: true,
              rate: +o.rate,
              coin: ar[1],
              base: ar[0],
              exchange: 'poloniex',
              amountCoin: o.amount,
              amountBase: o.amount * o.rate,
              date: o.date,
              timestamp: new Date(o.date).getTime(),
              fee: 0
            }
          }))
        }

      }
      return out;

    }));
  }

  getAllOrders(base: string, coin: string): Observable<VOOrder[]> {

    //let url = 'https://poloniex.com/public?command=returnTradeHistory&{{base}}_{{coin}}';
    return this.call({
      command: 'returnTradeHistory',
      currencyPair: base + '_' + coin
    }).pipe(map(res => {

      console.log(' AllOrders ' + base + '_' + coin, res);
      return res.map(function (o) {
        return {
          uuid: o.orderNumber,
          action: o.type.toUpperCase(),
          isOpen: true,
          rate: +o.rate,
          coin: coin,
          base: base,
          exchange: 'poloniex',
          amountCoin: o.amount,
          amountBase: o.amount * o.rate,
          date: o.date,
          timestamp: new Date(o.date).getTime(),
          fee: 0

        }
      })
    }));
  }

  getOpenOrders(base: string, coin: string): Observable<VOOrder[]> {
    return this.call({
      command: 'returnOpenOrders',
      currencyPair: base + '_' + coin
    }).pipe(map(res => {

      console.log(' OpenOrders ' + base + '_' + coin, res);
      return res.map(function (o) {
        return {
          uuid: o.orderNumber,
          action: o.type.toUpperCase(),
          isOpen: true,
          rate: +o.rate,
          coin: coin,
          base: base,
          exchange: 'poloniex',
          amountCoin: o.amount,
          amountBase: o.amount * o.rate,
          date: o.date,
          timestamp: new Date(o.date).getTime(),
          fee: 0

        }
      })
    }));

  }

  cancelOrder(orderId): Observable<VOOrder> {
    return this.call({
      command: 'cancelOrder',
      orderNumber: orderId
    }).pipe(map(res => {
      console.log(res);
      if (res)
        return {
          uuid: orderId,
          isOpen: (res.success !== 1),
          coin: null,
          base: null,
          rate: 0,
          amountCoin: 0,
          market:null,
        }
      else return null;
    }))
  }


  getOrder(orderId, base: string, coin: string): Observable<VOOrder> {
    return this.call({
      command: 'returnOrderTrades',
      orderNumber: orderId
    }).pipe(map(res => {
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
          market:base+'_'+coin,
          timestamp: (new Date(r.date.replace(' ', 'T'))).getTime()

        }
      } else return {
        uuid: orderId,
        isOpen: true,
        action: null,
        coin: null,
        base: null,
        rate: 0,
        market:base+'_'+coin,
        amountCoin: 0
      }


    }))

  }

  // balancesSub: Subject<VOBalance[]>

  /*  getBalance(symbol: string, isRefresh): Observable<VOBalance> {
      if (this.isLoadingBalances) return this.balancesSub.asObservable()
        .map(balabces => {
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

    isLoadingBalances: boolean;*/

  downloadBalances(): Observable<VOBalance[]> {
    const exchange = this.exchange;
    return this.call({command: 'returnBalances'}).pipe(map(res => {
    //   console.log(res);

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
        bal.exchange = exchange;
        bal.available = +res[str];
        bal.symbol = str;
        out.push(bal)
      }
      this.balancesSub.next(out);
      return out;
    }));
  }

  async buyLimit(base: string, coin: string, quantity: number, rate: number): Promise<VOOrder> {
    let market = base + '_' + coin;
    console.log(' buy market ' + market + '  quantity: ' + quantity + ' rate:' + rate);

    return this.call({
      command: 'buy',
      currencyPair: market,
      rate: rate,
      amount: quantity
    }).pipe(map(res => {

      console.log(' buyLimit market ' + market, res);

      return {
        uuid: res.orderNumber,
        isOpen: !!res.orderNumber,
        rate: res.rate,
        amountCoin: quantity, //TODO get real property
        base: base,
        coin: coin,
        type: res.type,
        market:base+'_'+coin
      };
    })).toPromise();
  }

  /*{"orderNumber":31226040,"resultingTrades":[{"amount":"338.8732","date":"2014-10-18 23:03:21","rate":"0.00000173","total":"0.00058625","tradeID":"16164","type":"buy"}]}*/

  async sellLimit(base: string, coin: string, quantity: number, rate: number): Promise<VOOrder> {

    let market = base + '_' + coin;
    console.log(' sell market ' + market + '  quantity: ' + quantity + ' rate:' + rate);

    return this.call({
      command: 'sell',
      currencyPair: market,
      rate: rate,
      amount: quantity

    }).pipe(map(res => {
      console.log(' sellLimit market ' + market, res);
      return {
        uuid: res.orderNumber,
        isOpen: !!res.orderNumber,
        rate: res.rate,
        amountCoin: quantity, //TODO get real property
        base: base,
        coin: coin,
        type: res.type,
        market:base+'_'+coin
      };

    })).toPromise();
  }

  private call(post: any): Observable<any> {
    const cred = this.getCredentials();
    if (!cred) {
      const sub = new Subject();
      this.createLogin().then(cred => {
        this.call(post)
          .subscribe(res => sub.next(res), err => sub.error(err));
      })
      return sub.asObservable();
    }


    post.nonce = Date.now();
    let load = UTILS.toURLparams(post);
    let signed = this.hash_hmac(load, cred.password);
    let url = '/api/poloniex/private';
    ;
    console.log(url);
    return this.http.post(url, {apiKey: cred.apiKey, signed: signed, postData: load}).pipe(map(res => {

      return res
    }));


  }

  hash_hmac(text, password) {
    let dg: any = cryptojs.HmacSHA512(text, password);
    return dg.toString(cryptojs.enc.Hex);
  }


}
