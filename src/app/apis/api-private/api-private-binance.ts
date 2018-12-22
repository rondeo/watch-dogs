import {VOBalance, VOBooks, VOOrder, VOWatchdog} from '../../models/app-models';

import {ApiPrivateAbstaract} from './api-private-abstaract';

import * as cryptojs from 'crypto-js';
import * as _ from 'lodash';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {StorageService} from '../../services/app-storage.service';
import {ApiPublicBittrex} from '../api-public/api-public-bittrex';

import {UtilsBooks} from '../../com/utils-books';

import {UserLoginService} from '../../services/user-login.service';
import {type} from 'os';
import {WatchDog} from '../../models/watch-dog';
import * as moment from 'moment';
import {UTILS} from '../../com/utils';
import {ApiPublicBinance} from '../api-public/api-public-binance';
import {MATH} from '../../com/math';
import {Observable} from 'rxjs/internal/Observable';
import {map} from 'rxjs/operators';
import {Subject} from 'rxjs/internal/Subject';

enum RequestType {
  GET,
  POST,
  DELETE
}

export class ApiPrivateBinance extends ApiPrivateAbstaract {


  exchange = 'binance';
  private prefix = '/api/proxy/';


  constructor(
    private http: HttpClient,
    userLogin: UserLoginService,
    private storage: StorageService = null
  ) {
    super(userLogin);
  }

  downloadBooks(market: string): Promise<{ amountCoin: string, rate: string }[]> {
    const symbol = market.split('_').reverse().join('');
    const params = {
      symbol,
      limit: '5'
    };
    let url = this.prefix + 'https://api.binance.com/api/v1/depth';

    return this.http.get(url, {params}).pipe(map((res: any) => {
      let r = (<any>res);
      const buy = r.bids.map(function (o) {
        return {amountCoin: +o[1], rate: +o[0]}
      });
      const sell = r.asks.map(function (o) {
        return {amountCoin: +o[1], rate: +o[0]}
      });
      return buy.concat(sell)

    }, console.error)).toPromise();
  }

  decimals = {};

  async getDecimals(market: string): Promise<{ amountDecimals: number, rateDecimals: number }> {
    if (market === 'BTC_NAV') return Promise.resolve({amountDecimals: 2, rateDecimals: 7});
    if (this.decimals[market]) {
      console.log(market, this.decimals[market]);
      return Promise.resolve(this.decimals[market]);
    }

    return this.downloadBooks(market).then(res => {
      this.decimals[market] = UTILS.parseDecimals(res);
      return this.decimals[market]
    })
  }

  getAllOrders(base: string, coin: string, startTime: number, endTime: number): Observable<VOOrder[]> {
    let url = this.prefix + 'https://api.binance.com/api/v3/myTrades';
    const data = {
      symbol: coin + base,
      startTime,
      endTime
    };

    const mapFunction = function(res) {
      return res.filter(function (item) {
        return item.status !== 'CANCELED';
      }).map(function (item) {
        return {
          uuid: item.orderId,
          action: item.isBuyer ? 'BUY' : 'SELL',
          isOpen: false,
          base: base,
          coin: coin,
          rate: +item.price,
          amountBase: -1,
          amountCoin: +item.qty,
          timestamp: item.time,
          fee: item.commission,
          date: moment(item.time).format('MM-DD HH a')
        }
      });
    };


    console.log(url);
    return this.call(url, data, RequestType.GET)
      .pipe(
      map(mapFunction)
    );
  }

  downloadAllOpenOrders(): Observable<VOOrder[]> {
    let url = this.prefix + 'https://api.binance.com/api/v3/openOrders';
    console.log(url);
    return this.call(url, null, RequestType.GET).pipe(map(res => {
      //  console.log(' allOpenOrders ', res);

      return res.map(function (item) {
        const market = ApiPublicBinance.parseSymbol(item.symbol);
        const coin = market.coin;
        const base = market.base;
        return {
          uuid: item.orderId,
          action: item.side,
          type: item.type,
          stopPrice: +item.stopPrice,
          isOpen: item.status !== 'FILLED',
          base: base,
          coin: coin,
          market: base + '_' + coin,
          rate: +item.price,
          amountBase: -1,
          amountCoin: +item.origQty,
          timestamp: item.time,
          fee: -1
        }
      })
    }));
  }

  getOpenOrders(base: string, coin: string): Observable<VOOrder[]> {
    let url = this.prefix + 'https://api.binance.com/api/v3/openOrders';
    const data = {
      symbol: coin + base
    };
    console.warn(url);

    return this.call(url, data, RequestType.GET).pipe(map(res => {
      console.log(' openOrders ', res);

      return res.map(function (item) {
        console.log(item);
        return {
          uuid: item.orderId,
          action: item.side,
          isOpen: item.status !== 'FILLED',
          base: base,
          coin: coin,
          market: base + '_' + coin,
          rate: +item.price,
          amountBase: -1,
          amountCoin: +item.origQty,
          timestamp: item.time,
          fee: -1
        }
      })
    }));
  }


  cancelOrder(orderId: string, base?: string, coin?: string) {
    let url = this.prefix + 'https://api.binance.com/api/v3/order';
    console.log(url);
    const data = {
      symbol: coin + base,
      orderId: orderId
    };
    return this.call(url, data, RequestType.DELETE).pipe(map(res => {
      return {
        uuid: res.orderId,
        action: res.status,
        isOpen: false,
        base: base,
        coin:coin,
        market: base+'_'+coin,
        timestamp: Date.now()
      }
    }));
  }

  getOrder(orderId: string, base: string, coin: string): Observable<VOOrder> {
    // console.log(' getOrderById  ' + orderId);
    let url = this.prefix + 'https://api.binance.com/api/v3/order';
    console.log(url);
    const data = {
      symbol: coin + base,
      orderId: orderId
    };
    return this.call(url, data, RequestType.GET).pipe(map(res => {
      let r = <any>res.result;
      // console.log('getOrderById ',r);
      console.log(res);
      return {
        uuid: res.orderId,
        action: res.side,
        isOpen: res.status !== 'FILLED',
        base: base,
        coin: coin,
        market: base + '_' + coin,
        rate: +res.price,
        amountBase: -1,
        amountCoin: +res.origQty,
        timestamp: res.time,
        fee: -1
      };
    }));
  }


  isLoadingBalances: boolean;

  downloadBalances(): Observable<VOBalance[]> {
    let uri = this.prefix + 'https://api.binance.com/api/v3/account';
    console.log(uri);
    const exchange = this.exchange;
    this.isLoadingBalances = true;
    return this.call(uri, {}, RequestType.GET).pipe(map(res => {
      this.isLoadingBalances = false;
      // console.log(res);
      return res.balances.map(function (item) {
        return new VOBalance({
          exchange: exchange,
          symbol: item.asset,
          available: +item.free,
          pending: +item.locked,
          address: ''
        })
      });
    }));
  }

  /*  async _stopLoss2(market: string, quantity: number, stopPrice: number) {

      const ar = market.split('_');
      const base = ar[0];
      const coin = ar[1];
      if (isNaN(quantity) && isNaN(stopPrice)) {
        console.warn(' not a number ' + quantity + '  ' + stopPrice);
        return null;
      }
      const val = {amountCoin: +quantity, rate: +stopPrice};

      UTILS.formatDecimals(this.exchange, base, coin, val);

      let url = '/api/proxy/https://api.binance.com/api/v3/order';
      let data = {
        symbol: coin + base,
        side: 'SELL',
        type: 'STOP_LOSS',
        quantity: val.amountCoin,
        stopPrice: val.rate
      };

      console.log(url);
      return this.call(url, data, RequestType.POST).map(res => {
        console.log('result STOP_LOSS market ' + market, res);
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
      }).toPromise();

    }*/


  async _stopLoss(market: string, amountCoin: number, stopPriceN: number, sellPriceN: number) {

    const ar = market.split('_');
    const base = ar[0];
    const coin = ar[1];
    if (isNaN(amountCoin) && isNaN(stopPriceN)) {
      console.warn(' not a number ' + amountCoin + '  ' + stopPriceN);
      return null;
    }

    const decimals: { amountDecimals: number, rateDecimals: number } = await this.getDecimals(market);


    const quantity = '' + MATH.formatDecimals(amountCoin, decimals.amountDecimals);// Math.ceil(amountCoin * Math.pow(10, decimals.amountDecimals))/Math.pow(10, decimals.amountDecimals);
    const stopPrice = stopPriceN.toFixed(decimals.rateDecimals);
    const price = sellPriceN.toFixed(decimals.rateDecimals);

    //  const amountDecimals = val.amountDecimals;
    // data.amountCoin = +data.amountCoin.toFixed(val.amountDecimals);
    // data.rate = +data.rate.toFixed(val.rateDecimals);
    console.log('!!! STOP LOSS ', market, quantity, stopPrice, price);

    let url = this.prefix + 'https://api.binance.com/api/v3/order';
    let data = {
      symbol: coin + base,
      side: 'SELL',
      type: 'STOP_LOSS_LIMIT',
      quantity,
      stopPrice,
      price,
      timeInForce: 'GTC'
    };


    return this.call(url, data, RequestType.POST).pipe(map(res => {
      console.log('result STOP_LOSS market ' + market, res);
      return {
        uuid: res.orderId,
        action: res.side,
        isOpen: res.status !== 'FILLED',
        base: base,
        coin: coin,
        market: market,
        rate: +res.price,
        amountBase: -1,
        amountCoin: +res.origQty,
        fee: -1
      }
    })).toPromise();

  }

  takeProfit(market: string, quantity: number, stopPrice: number) {

  }

  async buyLimit(base: string, coin: string, amountCoin: number, rate: number): Promise<VOOrder> {
    let market = base + '_' + coin;
    console.log(' buy market ' + base + coin + '  amountCoin: ' + amountCoin + ' rate:' + rate);
    if (isNaN(amountCoin) || isNaN(rate)) {
      console.warn(' not a number ' + amountCoin + '  ' + rate);
    }

    const decimals: { amountDecimals: number, rateDecimals: number } = await this.getDecimals(market);
    const quantity = '' + MATH.formatDecimals(amountCoin, decimals.amountDecimals);
    const price = rate.toFixed(decimals.rateDecimals);


    let url = this.prefix + 'https://api.binance.com/api/v3/order';
    let data = {
      symbol: coin + base,
      side: 'BUY',
      type: 'LIMIT',
      quantity,
      price,
      timeInForce: 'GTC'
    };

    console.log(url, data);

    return this.call(url, data, RequestType.POST).pipe(map(res => {
      console.log('result buyLimit market ' + base + coin, res);
      return {
        uuid: res.orderId,
        action: res.side,
        isOpen: res.status !== 'FILLED',
        base: base,
        coin: coin,
        market: base + '_' + coin,
        rate: +res.price,
        amountBase: -1,
        amountCoin: +res.origQty,
        fee: -1
      }
    })).toPromise();
  }

  /*{"orderNumber":31226040,"resultingTrades":[{"amount":"338.8732","date":"2014-10-18 23:03:21","rate":"0.00000173","total":"0.00058625","tradeID":"16164","type":"buy"}]}*/

  async sellLimit(base: string, coin: string, amountCoin: number, rate: number): Promise<VOOrder> {
    let market = base + '_' + coin;
    console.log(' sell market ' + market + '  quantity: ' + amountCoin + ' rate:' + rate);
    let url = this.prefix + 'https://api.binance.com/api/v3/order';

    const decimals: { amountDecimals: number, rateDecimals: number } = await this.getDecimals(market);
    const quantity = '' + MATH.formatDecimals(amountCoin, decimals.amountDecimals);
    const price = rate.toFixed(decimals.rateDecimals);

    let data = {
      symbol: coin + base,
      side: 'SELL',
      type: 'LIMIT',
      quantity,
      price,
      timeInForce: 'GTC'
    };

    return this.call(url, data, RequestType.POST).pipe(map(res => {
      console.log('result sellLimit market ' + market, res);

      return {
        uuid: res.orderId,
        action: res.side,
        isOpen: res.status !== 'FILLED',
        base: base,
        coin: coin,
        market: base + '_' + coin,
        rate: +res.price,
        amountBase: -1,
        amountCoin: +res.origQty,
        fee: -1
      }
    })).toPromise();
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

    if (!data) data = {};

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
