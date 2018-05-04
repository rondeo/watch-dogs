import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {VOBalance, VOOrder} from "../../models/app-models";
import {ApiPrivateAbstaract} from "./api-private-abstaract";
import {StorageService} from "../../services/app-storage.service";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {ApiPublicPoloniex} from "../api-public/api-public-poloniex";
import {ApiPublicHitbtc} from "../api-public/api-public-hitbtc";
import {UtilsBooks} from "../../com/utils-books";

export class ApiPrivateHitbtc extends ApiPrivateAbstaract {
  apiPublic: ApiPublicHitbtc
  exchange = 'hitbtc';

  constructor(
    private http: HttpClient,
    storage: StorageService
  ) {
    super(storage)
  }


  getOrder(orderId): Observable<VOOrder> {
    return null

  }

  balancesSub: Subject<VOBalance[]>

  downloadBalance(symbol: string): Observable<VOBalance> {
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

  private call(url: string, post: any): Observable<any> {

    return this.getCredentials().switchMap(cred => {
      if (!cred) throw new Error('login reqired');

      let headers: HttpHeaders = new HttpHeaders().set("Authorization", "Basic " + btoa(cred.apiKey + ":" + cred.password));

      if (post) {
        return this.http.post(url, post, {headers})
      } else {
        return this.http.get(url)
      }

    });

  }
}
