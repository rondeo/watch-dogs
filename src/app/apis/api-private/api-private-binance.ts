import {VOBalance, VOOrder, VOWatchdog} from '../../models/app-models';
import {Observable} from 'rxjs/Observable';
import {ApiPrivateAbstaract} from './api-private-abstaract';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import * as cryptojs from 'crypto-js';
import * as _ from 'lodash';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {StorageService} from '../../services/app-storage.service';
import {ApiPublicBittrex} from '../api-public/api-public-bittrex';

import {UtilsBooks} from '../../com/utils-books';
import {Subject} from 'rxjs/Subject';
import {UserLoginService} from '../../services/user-login.service';
import {type} from 'os';
import {WatchDog} from '../../models/watch-dog';
import * as moment from 'moment';
import {UTILS} from '../../com/utils';

enum RequestType {
  GET,
  POST,
  DELETE
}

export class ApiPrivateBinance extends ApiPrivateAbstaract {


  exchange = 'binance';


  constructor(
    private http: HttpClient,
    userLogin: UserLoginService
  ) {
    super(userLogin);
  }


  getAllOrderes(base: string, coin: string): Observable<VOOrder[]> {
    let url = '/api/proxy/api.binance.com/api/v3/allOrders';
    const data = {
      symbol: coin + base
    };
    return this.call(url, data, RequestType.GET).map(res => {
      console.log(res);

      return res.map(function (item) {
        return {
          uuid: item.orderId,
          action: item.side,
          isOpen: item.status !== 'FILLED',
          base: base,
          coin: coin,
          rate: +item.price,
          amountBase: -1,
          amountCoin: +item.origQty,
          timestamp: item.time,
          fee: -1,
          date: moment(item.time).format('MM-DD HH a')
        }
      })
    });
  }


  getOpenOrders(base: string, coin: string): Observable<VOOrder[]> {
    let url = '/api/proxy/api.binance.com/api/v3/openOrders';
    const data = {
      symbol: coin + base
    };
    return this.call(url, data, RequestType.GET).map(res => {
      console.log(res);

      return res.map(function (item) {
        return {
          uuid: item.orderId,
          action: item.side,
          isOpen: item.status !== 'FILLED',
          base: base,
          coin: coin,
          rate: +item.price,
          amountBase: -1,
          amountCoin: +item.origQty,
          timestamp: item.time,
          fee: -1
        }
      })
    });
  }


  cancelOrder(orderId: string, base?: string, coin?: string) {
    let url = '/api/proxy/api.binance.com/api/v3/order';
    //console.log(url);
    const data = {
      symbol: coin + base,
      orderId: orderId
    };
    return this.call(url, data, RequestType.POST).map(res => {
      return res
    });
  }

  getOrder(orderId: string, base: string, coin: string): Observable<VOOrder> {
    // console.log(' getOrderById  ' + orderId);
    let url = '/api/proxy/api.binance.com/api/v3/order';
    //console.log(url);
    const data = {
      symbol: coin + base,
      orderId: orderId
    };
    return this.call(url, data, RequestType.GET).map(res => {
      let r = <any>res.result;
      // console.log('getOrderById ',r);
      console.log(res);
      return {
        uuid: res.orderId,
        action: res.side,
        isOpen: res.status !== 'FILLED',
        base: base,
        coin: coin,
        rate: +res.price,
        amountBase: -1,
        amountCoin: +res.origQty,
        timestamp: res.time,
        fee: -1
      };
    });
  }


  isLoadingBalances: boolean;

  downloadBalances(): Observable<VOBalance[]> {
    let uri = '/api/proxy/api.binance.com/api/v3/account';
    this.isLoadingBalances = true;
    return this.call(uri, {}, RequestType.GET).map(res => {
      this.isLoadingBalances = false;
      // console.log(res);
      return res.balances.map(function (item) {
        return new VOBalance({
          symbol: item.asset,
          address: '',
          balance: +item.free,
          available: +item.free,
          pending: +item.locked
        })
      });
    })
  }

  buyLimit(base: string, coin: string, quantity: number, rate: number): Observable<VOOrder> {
    let market = base + '-' + coin;
    const val = {amountCoin: quantity, rate: rate};

    UTILS.formatDecimals(this.exchange, base, coin, val);

    console.log(' buy market ' + market + '  quantity: ' + quantity + ' rate:' + rate);
    let url = '/api/proxy/api.binance.com/api/v3/order';
    let data = {
      symbol: coin + base,
      side: 'BUY',
      type: 'LIMIT',
      quantity: val.amountCoin,
      price: val.rate,
      timeInForce: 'GTC'
    };

    return this.call(url, data, RequestType.POST).map(res => {
      console.log('result buyLimit market ' + market, res);
      return {
        uuid: res.orderId,
        action: res.side,
        isOpen: res.status !== 'FILLED',
        base: base,
        coin: coin,
        rate: +res.price,
        amountBase: -1,
        amountCoin: +res.origQty,
        fee: -1
      }
    });
  }

  /*{"orderNumber":31226040,"resultingTrades":[{"amount":"338.8732","date":"2014-10-18 23:03:21","rate":"0.00000173","total":"0.00058625","tradeID":"16164","type":"buy"}]}*/

  sellLimit(base: string, coin: string, quantity: number, rate: number): Observable<VOOrder> {
    let market = base + '-' + coin;
    console.log(' sell market ' + market + '  quantity: ' + quantity + ' rate:' + rate);
    let url = '/api/proxy/api.binance.com/api/v3/order';

    const decimals = UTILS.decimals[this.exchange + base + coin];
    if (decimals) {
      quantity = UTILS.floorTo(quantity, decimals.amountDecimals);
      rate = UTILS.floorTo(rate, decimals.rateDecimals);
    }

    let data = {
      symbol: coin + base,
      side: 'SELL',
      type: 'LIMIT',
      quantity: quantity,
      price: rate,
      timeInForce: 'GTC'
    };

    return this.call(url, data, RequestType.POST).map(res => {
      console.log('result sellLimit market ' + market, res);

      return {
        uuid: res.orderId,
        action: res.side,
        isOpen: res.status !== 'FILLED',
        base: base,
        coin: coin,
        rate: +res.price,
        amountBase: -1,
        amountCoin: +res.origQty,
        fee: -1
      }
    });
  }

  private call(URL: string, data: any, type: RequestType): Observable<any> {

    const cred = this.getCredentials();
    if (!cred) {
      const sub = new Subject();
      this.createLogin().then(cred => {
        this.call(URL, data, type)
          .subscribe(res => sub.next(res), err => sub.error(err));
      })
      return sub.asObservable();
    }


    data.recvWindow = 60000;
    data.timestamp = Date.now();
    let load = Object.keys(data).map(function (item) {
      return item + '=' + this.post[item];
    }, {post: data}).join('&');
    let signed = this.hash_hmac(load, cred.password);
    // console.log(URL);
    let url = URL;
    const headers = new HttpHeaders().set('X-MBX-APIKEY', cred.apiKey).append('Content-type', 'application/x-www-form-urlencoded');
    url = URL + '?' + load + '&signature=' + signed;
    switch (type) {
      case RequestType.GET:
        return this.http.get(url, {headers});
      case RequestType.POST:
        url = URL + '?signature=' + signed;
        return this.http.post(url, load, {headers});
      case RequestType.DELETE:
        return this.http.delete(url, {headers});
    }
  }

  hash_hmac(text, password) {
    // let dg: any = cryptojs.HmacSHA512(text, password);
    let dg: any = cryptojs.HmacSHA256(text, password);
    return dg.toString(cryptojs.enc.Hex);
  }


  signedRequest = function (url, data = {}, callback, method = 'GET') {
    /* if ( !options.APIKEY ) throw Error('apiRequest: Invalid API Key');
     if ( !options.APISECRET ) throw Error('signedRequest: Invalid API Secret');
     data.timestamp = new Date().getTime() + info.timeOffset;
     if ( typeof data.recvWindow === 'undefined' ) data.recvWindow = options.recvWindow;*/
    let query = Object.keys(data).reduce(function (a, k) {
      a.push(k + '=' + encodeURIComponent(data[k]));
      return a
    }, []).join('&');

    // let signature = this.h
    //let signature = crypto.createHmac('sha256', options.APISECRET).update(query).digest('hex'); // set the HMAC hash header

    /*  let opt = reqObj(
        url+'?'+query+'&signature='+signature,
        data,
        method,
        options.APIKEY
      );
      proxyRequest(opt, callback);*/
  }


}
