
import {VOBalance, VOOrder} from '../../models/app-models';
import {ApiPrivateAbstaract} from './api-private-abstaract';
import {StorageService} from '../../services/app-storage.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ApiPublicPoloniex} from '../api-public/api-public-poloniex';
import {ApiPublicHitbtc} from '../api-public/api-public-hitbtc';
import {UtilsBooks} from '../../com/utils-books';
import {UserLoginService} from '../../services/user-login.service';
import {Observable} from 'rxjs/internal/Observable';
import {map} from 'rxjs/operators';
import {Subject} from 'rxjs/internal/Subject';

export class ApiPrivateHitbtc extends ApiPrivateAbstaract {
  apiPublic: ApiPublicHitbtc;
  exchange = 'hitbtc';

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
    userLogin: UserLoginService
  ) {
    super(userLogin);
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
      console.log('getAllOpenOrders', res);
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
          market:base+'_'+coin
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

    const url = 'api/hitbtc/trading/balance';
    const exchange = this.exchange;

    return this.call(url, null).pipe(map((res: any[]) => res.map(function (item: any) {
      if (item.currency === 'USD') item.currency = 'USDT';
      return {
        exchange: exchange,
        symbol: item.currency,
        balance: +item.available + (+item.reserved),
        available: +item.available,
        pending: 0
      };
    })));
  }


 async buyLimit(base: string, coin: string, quantity: number, rate: number): Promise<VOOrder> {

    if (base === 'USDT') base = 'USD';

    const url = 'api/hitbtc/order';
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

    const url = 'api/hitbtc/order';
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
