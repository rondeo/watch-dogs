import {VOBalance, VOOrder, VOWatchdog} from '../../../amodels/app-models';

import {ApiPrivateAbstaract} from './api-private-abstaract';

import * as cryptojs from 'crypto-js';
import * as _ from 'lodash';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {StorageService} from '../../services/app-storage.service';
import {ApiPublicBittrex} from '../api-public/api-public-bittrex';
import {UtilsBooks} from '../../../acom/utils-books';
import {UserLoginService} from '../../services/user-login.service';
import {MarketOrderModel} from '../../../amodels/market-order-model';
import {Observable} from 'rxjs/internal/Observable';
import {map} from 'rxjs/operators';
import {Subject} from 'rxjs/internal/Subject';

export class ApiPrivateBittrex extends ApiPrivateAbstaract {

  balances: VOBalance[];
  exchange = 'bittrex';

  constructor(
    private http: HttpClient,
    userLogin: UserLoginService,
    storage: StorageService
  ) {
    super(userLogin, storage);
  }

 /* sellCoin(sellCoin: MarketOrderModel): Observable<MarketOrderModel> {
    if (!sellCoin.coinUS) throw new Error(' need coin price')
    return this.getBalance(sellCoin.coin).switchMap(balance => {
      // console.log(balance);
      if (balance.balance * sellCoin.coinUS < 10) {
        sellCoin.balanceCoin = 0;
      } else sellCoin.balanceCoin = balance.balance;

      if (!sellCoin.balanceCoin) {
        sellCoin.balanceCoin = 0;
        return Observable.of(sellCoin);
      }

      return this.apiPublic.downloadBooks(sellCoin.base, sellCoin.coin).switchMap(books => {
        // console.log(books);

        let rate = UtilsBooks.getRateForAmountCoin(books.buy, sellCoin.balanceCoin);
        const myCoinprice = sellCoin.baseUS * rate;
        // sellCoin.booksDelta = +(100 * (myCoinprice - sellCoin.coinUS) / sellCoin.coinUS).toPrecision(2);
        rate = +(rate - (rate * 0.01)).toFixed(8);
        return this.sellLimit(sellCoin.base, sellCoin.coin, sellCoin.balanceCoin, rate).switchMap(order => {
          console.log(order);
          if (order.uuid) {
            sellCoin.id = order.uuid;
            return this.getOrder(order.uuid, sellCoin.base, sellCoin.coin).switchMap(order => {

              return Observable.of(sellCoin)
            })

          } else throw new Error(order.message)

        })
      })
    })

  }*/

  downloadAllOpenOrders() :Observable<VOOrder[]>{
    let url = 'https://bittrex.com/api/v1.1/market/getopenorders';
    return this.call(url, null).pipe(map(res =>{
      console.log(' allOpenOrders  ' , res);
      return res.result.map(function(o){
        let a = o.Exchange.split('-');
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
    }));
  }

  getAllOrders(base: string, coin: string, from: number, to: number) :Observable<VOOrder[]>{
    let market = base+'-'+coin;
    let url = 'https://bittrex.com/api/v1.1/account/getorderhistory';
    return this.call(url, {market: market}).pipe(map(res =>{
      console.log(' OrderHistory  '+ market , res);
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
    }));
  }

  getOpenOrders(base:string, coin:string):Observable<VOOrder[]>{
    let market = base+'-'+coin;
    let uri = 'https://bittrex.com/api/v1.1/market/getopenorders';
    return this.call(uri, {market: market}).pipe(map(res=>{
      console.log(' OpenOrders  '+ market , res);

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
    }));
  }

  cancelOrder(uuid: string): Observable<VOOrder> {
    let uri = 'https://bittrex.com/api/v1.1/market/cancel';
    return this.call(uri, {uuid: uuid}).pipe(map(res => {
      // console.log(' cancelOrder ', res);
      if (res.success) return {uuid: uuid, isOpen: true};
      else return res;
    }));
  }

  getOrder(orderId: string, base: string, coin: string): Observable<VOOrder> {
    // console.log(' getOrderById  ' + orderId);
    let url = 'https://bittrex.com/api/v1.1/account/getorder';
    //console.log(url);
    return this.call(url, {uuid: orderId}).pipe(map(res => {
      let r = <any>res.result;
      // console.log('getOrderById ',r);
      let a = r.Exchange.split('-');

      return {
        uuid: r.OrderUuid,
        action: r.Type.split('_')[1].substr(0, 1),
        isOpen: r.IsOpen,
        base: a[0],
        coin: a[1],
        market:base+'_'+coin,
        rate: +r.PricePerUnit,
        amountBase: r.Price,
        amountCoin: r.Quantity,
        fee: r.CommissionPaid
      }
    }));

  }

  downloadBalance(symbol: string): Observable<VOBalance> {
    const data = {
      currency: symbol
    };

    const url = 'https://bittrex.com/api/v1.1/account/getbalance';
    const exchange = this.exchange;
    return this.call(url, data).pipe(map(item => {
      item = item.result;
      return {
        exchange: exchange,
        symbol: item.Currency,
        address: item.CryptoAddress,
        balance: item.Balance,
        available: item.Available,
        pending: item.Pending
      }

    }));
  }



  downloadBalances(): Observable<VOBalance[]> {
    let uri = 'https://bittrex.com/api/v1.1/account/getbalances';
    return this.call(uri, {}).pipe(map(res => {
     //  console.log(res);
      return res.result.map(function (item) {
        return new VOBalance( {
          exchange: 'bittrex',
          symbol: item.Currency,
          address: item.CryptoAddress,
          balance: item.Balance,
          available: item.Available,
          pending: item.Pending
        })
      })

    }))
  }

  async buyLimit(base: string, coin: string, quantity: number, rate: number): Promise<VOOrder> {
    let market = base + '-' + coin;
    console.log(' buy market ' + market + '  quantity: ' + quantity + ' rate:' + rate);
    let uri = 'https://bittrex.com/api/v1.1/market/buylimit';
    return this.call(uri, {
      market: market,
      quantity: quantity,
      rate: rate
    }).pipe(map((res: any) => {
      console.log(' buyLimit market ' + market, res);

      return <VOOrder>res.result;
    })).toPromise();
  }

  /*{"orderNumber":31226040,"resultingTrades":[{"amount":"338.8732","date":"2014-10-18 23:03:21","rate":"0.00000173","total":"0.00058625","tradeID":"16164","type":"buy"}]}*/

  async sellLimit(base: string, coin: string, quantity: number, rate: number): Promise<VOOrder> {

    let market = base + '-' + coin;
    console.log(' sell market ' + market + '  quantity: ' + quantity + ' rate:' + rate);

    let uri = 'https://bittrex.com/api/v1.1/market/selllimit';
    return this.call(uri, {
      market: market,
      quantity: quantity,
      rate: rate
    }).pipe(map(res => {
      console.log(' sellLimit market ' + market, res);
      if (res.success) return res.result;
      else return {
        uuid: '',
        message: res.message
      }
    })).toPromise();
  }


  private call(URL: string, post: any): Observable<any> {

    const cred = this.getCredentials();
    if (!cred) {
      const sub = new Subject();
      this.createLogin().then(cred =>{
        this.call(URL, post)
          .subscribe(res=> sub.next(res), err=>sub.error(err));
      })
      return sub.asObservable();
    }

    if(!post) post = {};
    post.apikey = cred.apiKey;
    post.nonce = Math.ceil(Date.now() / 1000);
    let load = Object.keys(post).map(function (item) {
      return item + '=' + this.post[item];
    }, {post: post}).join('&');

    URL += '?' + load;
    console.log(URL);
    let signed = this.hash_hmac(URL, cred.password);
    let url ='api/proxy/' + URL; //'/api/bittrex/private';
    const headers = new HttpHeaders({apisign:signed});

    return this.http.get(url, {headers});
  }

  hash_hmac(text, password) {
    let dg: any = cryptojs.HmacSHA512(text, password);
    return dg.toString(cryptojs.enc.Hex);
  }


}
