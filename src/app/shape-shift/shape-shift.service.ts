import { Injectable } from '@angular/core';
import {AuthHttpService} from '../a-core/services/auth-http.service';

import * as _ from 'lodash';
import {VOMarketCap, VOSearch} from '../amodels/app-models';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {map} from 'rxjs/operators';




@Injectable()
export class ShapeShiftService {

  private coinsAvailable: any[];
  private coinsIndexed: {[symbol: string]: any};
  private coinsAvailableSub: BehaviorSubject<any[]>;
  coinsAvailable$: Observable<any[]>;
  constructor(private http: AuthHttpService) {

    this.coinsAvailableSub = new BehaviorSubject([]);
    this.coinsAvailable$ = this.coinsAvailableSub.asObservable();
    this.getCoins();
  }

  getCoins(): Observable<any[]> {
    let url = '/api/exchange/shapeshift/getcoins';
    this.http.get(url).pipe(map(res => {
      return res;
    })).subscribe(res => {
      this.coinsIndexed = res;
      this.coinsAvailable = <any> _.values(res).map(function (item: any) {
        item.market = {};
        return item;
      });
      this.coinsAvailableSub.next(this.coinsAvailable);
     // console.log(res);
    });
    return this.coinsAvailable$;
  }

  private _searchCoin(symbol: string, ar: any[]): VOSearch[] {
    return ar.filter(function (item) {
      return item.symbol.indexOf(symbol) !== -1;
    }).map(function (item) {
      return {
        exchange: 'ShapeShift',
        symbol: item.symbol
      };
    });
  }

  searchCoin(symbol: string): Observable<VOSearch[]> {
    let sub: Subject<VOSearch[]> = new Subject();
    if (this.coinsAvailable) {
      let ar = this.coinsAvailable;
      setTimeout( () => {
        sub.next(this._searchCoin(symbol, ar));
      }, 100);

    } else this.getCoins().subscribe(res => this._searchCoin(symbol, res));

    return sub.asObservable();
  }

  getExchangeRate(from_to: string): Observable<SSData> {
    let url = '/api/exchange/shapeshift/marketinfo/' + from_to;
    return this.http.get(url).pipe(map(res => res));
  }


}

/*
export class SSCoin{
  name:string;
  symbol:string;

  rank?: number;
  price_usd?: number;
  percent_change_1h?:number;
  percent_change_24h?:number;
  percent_change_7d?:number;
  market_cap_usd?:number;

  market:VOExchangeData;

}
*/


export interface SSData {
  pair: string;
  rate: number;
  minerFee: number;
  limit: number;
  minimum: number;
  maxLimit: number;
}

