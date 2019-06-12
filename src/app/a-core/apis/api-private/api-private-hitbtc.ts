
import {VOBalance, VOBooks, VOOrder, VOTrade} from '../../../amodels/app-models';
import {ApiPrivateAbstaract} from './api-private-abstaract';
import {StorageService} from '../../services/app-storage.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ApiPublicPoloniex} from '../api-public/api-public-poloniex';
import {ApiPublicHitbtc} from '../api-public/api-public-hitbtc';
import {UtilsBooks} from '../../../acom/utils-books';
import {UserLoginService} from '../../services/user-login.service';
import {Observable} from 'rxjs/internal/Observable';
import {map} from 'rxjs/operators';
import {Subject} from 'rxjs/internal/Subject';
import {MATH} from '../../../acom/math';
import {UTILS} from '../../../acom/utils';

export class ApiPrivateHitbtc extends ApiPrivateAbstaract {
  apiPublic: ApiPublicHitbtc;
  exchange = 'hitbtc';

  url = '/api/proxy/https://api.hitbtc.com/api/2';

  static parseOrder(item) {
    console.log(item.status);
    let base = item.symbol.slice(-3);
    if (base === 'USD') base = 'USDT';
    const coin = item.symbol.slice(0, -3);
    let isOpen = item.status === 'new';
    return {
      id: item.id,
      isOpen: isOpen,
      uuid: item.clientOrderId,
      action: item.side.toUpperCase(),
      rate: +item.price,
      base: base,
      coin: coin,
      amountCoin: +item.quantity,
      amountBase: +item.price * +item.quantity,
      date: item.createdAt,
      timestamp: new Date(item.createdAt).getTime(),
      status: item.status
    };
  }

  constructor(
    private http: HttpClient,
    userLogin: UserLoginService,
    storage: StorageService
  ) {
    super(userLogin, storage);
  }

  getOpenOrders(base: string, coin: string): Observable<VOOrder[]> {
    const url = 'api/proxy//order?symbol={{coin}}{{base}}'.replace('{{base}}', base).replace('{{coin}}', coin);
    return this.call(url, null).pipe(map(res => {
      console.log('getOpenOrders', res);
      return res.map(ApiPrivateHitbtc.parseOrder);
    }));
  }

  downloadAllOpenOrders(): Observable<VOOrder[]> {
    const url = 'api/hitbtc/order';
    return this.call(url, null).pipe(map(res => {
      console.log(' getAllOpenOrders result', res);
      return res.map(ApiPrivateHitbtc.parseOrder);
    }));
  }

  getAllOrders(base: string, coin: string): Observable<VOOrder[]> {
    const url = 'api/hitbtc/history/order';
    return this.call(url, null).pipe(map(res => {
      console.log('getAllOrders', res);
      return res.map(ApiPrivateHitbtc.parseOrder);
    }));
  }


  getOrder(orderId, base: string, coin: string): Observable<VOOrder> {
    const url = 'api/hitbtc/order?symbol={{coin}}{{base}}'.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.call(url, null).pipe(
      map((res: any[]) => {
        console.log(res);

        return res.map(function (item) {
          return {
            isOpen: true,
            id: item.id,
            uuid: item.clientOrderId,
            action: item.side.toUpperCase(),
            rate: +item.price,
            amountCoin: +item.quantity,
            amountBase: +item.price * +item.quantity,
            date: item.createdAt,
            timestamp: new Date(item.createdAt).getTime(),
            status: item.status,
            market:base+'_'+coin
          };
        }).find(function (item: VOOrder) {
          return item.uuid === orderId;
        }) || {
          uuid: orderId,
          isOpen: false,
          market:base+'_'+coin,
          action: 'UNKNOWN'
        };
      }));
  }

  cancelOrder(uuid: string): Observable<VOOrder> {
    const url = 'api/hitbtc-delete/' + uuid;
    return this.call(url, null)
      .pipe(map((res: any) => {
        console.log(res);
        let result: any = res;
        return {
          uuid: res.clientOrderId,
          isOpen: !(res.status === 'canceled'),
          action: res.side.toUpperCase(),
          rate: +res.price,
          amountCoin: +res.quantity,
          date: res.createdAt,
          market:null,
          timestamp: new Date(res.createdAt).getTime()
        };
      }));
  }

  /* balancesSub: Subject<VOBalance[]>

   getBalance(symbol: string): Observable<VOBalance> {
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

    const url = this.url + '/trading/balance';
    const exchange = this.exchange;

    return this.call(url, null).pipe(map((res: any[]) => res.map(function (item: any) {
      if (item.currency === 'USD') item.currency = 'USDT';
      return new VOBalance({
        exchange: exchange,
        symbol: item.currency,
        balance: +item.available + (+item.reserved),
        available: +item.available,
        pending: +item.reserved
      });
    })));
  }


 async buyLimit(base: string, coin: string, quantity: number, rate: number): Promise<VOOrder> {

    if (base === 'USDT') base = 'USD';

    const url = this.url + '/order';
    let data = {
      side: 'buy',
      quantity: quantity,
      price: rate,
      symbol: coin + base
    };

    return this.call(url, data)
      .pipe(map((res: any) => {
        console.log(res);
        let result: any = res;
        return {
          id: res.id,
          uuid: res.clientOrderId,
          isOpen: res.status === 'new',
          action: res.side.toUpperCase(),
          amountCoin: +res.quantity,
          rate: +res.price,
          status: res.status,
          market:base+'_'+coin
        };
      })).toPromise();

  }

  async sellLimit(base: string, coin: string, quantity: number, rate: number): Promise<VOOrder> {

    if (base === 'USDT') base = 'USD';

    const url =  this.url + '/order';
    let data = {
      side: 'sell',
      quantity: quantity,
      price: rate,
      symbol: coin + base
    };

    return this.call(url, data)
      .pipe(map((res: any) => {
        console.log(res);
        let result: any = res;
        return {
          id: res.id,
          isOpen: res.status === 'new',
          uuid: res.clientOrderId,
          action: res.side.toUpperCase(),
          amountCoin: +res.quantity,
          rate: +res.price,
          status: res.status,
          market:base+'_'+coin

        };
      })).toPromise();
  }


  async _stopLoss(market: string, amountCoin: number, stopPriceN: number, sellPriceN: number) {

    const ar = market.split('_');

    if (isNaN(amountCoin) || isNaN(stopPriceN) || !stopPriceN || !sellPriceN) {
      console.error(' not a number amountCoin ' + amountCoin + ' stopPriceN  ' + stopPriceN + ' sellPriceN ' +sellPriceN);
      return Promise.resolve();
    }

    const decimals: { amountDecimals: number, rateDecimals: number } = await this.getDecimals(market);


    const quantity = '' + MATH.formatDecimals(amountCoin, decimals.amountDecimals);// Math.ceil(amountCoin * Math.pow(10, decimals.amountDecimals))/Math.pow(10, decimals.amountDecimals);
    const stopPrice = stopPriceN.toFixed(decimals.rateDecimals);
    const price = sellPriceN.toFixed(decimals.rateDecimals);

    //  const amountDecimals = val.amountDecimals;
    // data.amountCoin = +data.amountCoin.toFixed(val.amountDecimals);
    // data.rate = +data.rate.toFixed(val.rateDecimals);
    console.log(this.exchange + ' !!! STOP LOSS DOESNT WORK ' ,  market , quantity, stopPrice, price);

    const url =  this.url + '/order';
    let data = {
      side: 'sell',
      quantity,
      type: 'stopLimit',
      stopPrice,
      price,
      symbol:ApiPrivateHitbtc.toMarket(market)
    };

    return this.call(url, data)
      .pipe(map((res: any) => {
        console.log( this.exchange + '- ' + market + ' STOP_LOSS result ', res);
        let result: any = res;
        return {
          id: res.id,
          isOpen: res.status === 'new',
          uuid: res.clientOrderId,
          action: res.side.toUpperCase(),
          amountCoin: +res.quantity,
          rate: +res.price,
          status: res.status,
          market: market

        };
      })).toPromise();
  }


  static toMarket(market) {
    return market.split('_').reverse().join('');
  }


  downloadBooks(market: string, limit: number): Promise<VOBooks> {
    let url = ('/api/proxy-5min/https://api.hitbtc.com/api/2/public/orderbook/{{market}}?limit=' + limit)
      .replace('{{market}}', ApiPrivateHitbtc.toMarket(market));
    console.log(url);
    return this.http.get(url).pipe(map((res: any) => {

      if (!res.bid) {
        console.log(res);
        throw new Error(this.exchange + ' wromg data ');
      }
      let buy: VOTrade[] = res.bid.map(function (item) {
        return {
          amountCoin: +item.size,
          rate: +item.price
        }
      });

      let sell = res.ask.map(function (item) {
        return {
          amountCoin: +item.size,
          rate: +item.price
        }
      });

      return {
        market,
        exchange: 'hitbtc',
        buy: buy,
        sell: sell
      }

    })).toPromise();
  }

  private call(URL: string, post: any): Observable<any> {

    const cred = this.getCredentials();
    if (!cred) {
      const sub = new Subject();
      this.createLogin().then(cred => {
        this.call(URL, post)
          .subscribe(res => sub.next(res), err => sub.error(err));
      });
      return sub.asObservable();
    }

    let headers: HttpHeaders = new HttpHeaders().set('Authorization', 'Basic ' + btoa(cred.apiKey + ':' + cred.password));

    if (post) {
      return this.http.post(URL, post, {headers});
    } else {
      return this.http.get(URL, {headers});
    }


  }
}
