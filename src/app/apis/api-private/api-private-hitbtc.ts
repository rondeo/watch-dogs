import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {VOBalance, VOOrder} from '../../models/app-models';
import {ApiPrivateAbstaract} from './api-private-abstaract';
import {StorageService} from '../../services/app-storage.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ApiPublicPoloniex} from '../api-public/api-public-poloniex';
import {ApiPublicHitbtc} from '../api-public/api-public-hitbtc';
import {UtilsBooks} from '../../com/utils-books';
import {PrivateCalls} from '../../my-exchange/services/apis/api-base';
import {UserLoginService} from '../../services/user-login.service';

export class ApiPrivateHitbtc extends ApiPrivateAbstaract {
  apiPublic: ApiPublicHitbtc
  exchange = 'hitbtc';

  constructor(
    private http: HttpClient,
    userLogin: UserLoginService
  ) {
    super(userLogin);
  }


  getOrder(orderId, base: string, coin: string): Observable<VOOrder> {
    const url = 'api/hitbtc/order?symbol={{coin}}{{base}}'.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.call(url, null)
      .map((res: any[]) => {
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
            status: item.status
          }
        }).find(function (item) {
          return item.uuid === orderId;
        }) || {
          uuid: orderId,
          isOpen: false
        };
      });
  }

  cancelOrder(uuid: string): Observable<VOOrder> {
    const url = 'api/hitbtc-delete/' + uuid;
    return this.call(url, null)
      .map((res: any) => {
        console.log(res);
        let result: any = res;
        return {
          uuid: res.clientOrderId,
          isOpen: !(res.status === 'canceled'),
          action: res.side.toUpperCase(),
          rate: +res.price,
          amountCoin: +res.quantity,
          date: res.createdAt,
          timestamp: new Date(res.createdAt).getTime()
        }
      });
  }

  balancesSub: Subject<VOBalance[]>

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

  isLoadingBalances: boolean;

  downloadBalances(): Observable<VOBalance[]> {
    this.balancesSub = new Subject();
    this.isLoadingBalances = true;

    const url = 'api/hitbtc/trading/balance';


    return this.call(url, null).map((res: any[]) => res.map(function (item: any) {
      if (item.currency === 'USD') item.currency = 'USDT';
      return {
        symbol: item.currency,
        balance: +item.available + (+item.reserved),
        available: +item.available
      }
    }));
  }


  buyLimit(base: string, coin: string, quantity: number, rate: number): Observable<VOOrder> {

    if (base === 'USDT') base = 'USD';

    const url = 'api/hitbtc/order';
    let data = {
      side: 'buy',
      quantity: quantity,
      price: rate,
      symbol: coin + base
    }

    return this.call(url, data)
      .map((res: any) => {
        console.log(res);
        let result: any = res;
        return {
          id: res.id,
          uuid: res.clientOrderId,
          isOpen: res.status === 'new',
          action: res.side.toUpperCase(),
          amountCoin: +res.quantity,
          rate: +res.price,
          status: res.status
        }
      });

  }

  sellLimit(base: string, coin: string, quantity: number, rate: number): Observable<VOOrder> {

    if (base === 'USDT') base = 'USD';

    const url = 'api/hitbtc/order';
    let data = {
      side: 'sell',
      quantity: quantity,
      price: rate,
      symbol: coin + base
    }

    return this.call(url, data)
      .map((res: any) => {
        console.log(res);
        let result: any = res;

        return {
          id: res.id,
          isOpen: res.status === 'new',
          uuid: res.clientOrderId,
          action: res.side.toUpperCase(),
          amountCoin: +res.quantity,
          rate: +res.price,
          status: res.status

        }
      });
  }

  private call(URL: string, post: any): Observable<any> {

    const cred = this.getCredentials();
   //  console.log(cred);
    if (!cred) {
      const sub = new Subject();
      this.userLogin$().subscribe(login => {
       //  console.log(login);
        if (login) {
          this.call(URL, post).subscribe(res => {
            sub.next(res);
            sub.complete();
          });
        }
      })

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
