import { Injectable } from '@angular/core';
import {AuthHttpService} from '../../services/auth-http.service';
import {Observable} from 'rxjs/Observable';
import {VOSearch} from '../../models/app-models';
import {Subject} from 'rxjs/Subject';

@Injectable()
export class BitfinexService {

  constructor(private http:AuthHttpService) { }



  private _searchCoin(symbol:string, ar:VOBFMarket[]):VOSearch[]{
    return ar.filter(function (item) {
      return item.pair.indexOf(symbol) !== -1;
    }).map(function (item) {
      return {
        exchange:'BitFinex',
        symbol:item.pair
      }
    })
  }

  searchCoin(symbol:string):Observable<VOSearch[]>{
    let sub:Subject<VOSearch[]> = new Subject();

    this.getMarkets().subscribe(res=>{
      //  console.log(res);
      sub.next(this._searchCoin(symbol, res));
    })

    return sub.asObservable()
  }
  getMarkets():Observable<VOBFMarket[]>{
    let url = '/api/bitfinex/symbols';
    return this.http.get(url).map(res=>{
      return res.json().map(function (item) {
        return {
          pair:item
        };
      });
    });
  }
  getMarket(pair:string):Observable<VOBFMarket>{
    let url = '/api/bitfinex/market/'+pair;
    return this.http.get(url).map(res=>res.json());
  }

 /* getMarket(pair:string):Observable<any>{
    let url = '/api/bitfinex/market/'+pair;
    return this.http.get(url).map(res=>res.json());
  }*/
}


export interface VOBFMarket{
  pair:string;
  mid:number;
  bid:number;
  ask:number;
  last_price:number;
  low:number;
  high:number;
  volume:number;
  timestamp:string;
}
