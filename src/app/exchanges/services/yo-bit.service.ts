import { Injectable } from '@angular/core';
import {AuthHttpService} from '../../services/auth-http.service';
import {Observable} from 'rxjs/Observable';
import {VOSearch} from '../../models/app-models';
import {Subject} from 'rxjs/Subject';

@Injectable()
export class YoBitService {

  constructor( private http:AuthHttpService) { }


  private _searchCoin(symbol:string, ar:VOYoBit[]):VOSearch[]{
    return ar.filter(function (item) {
      return item.pair.indexOf(symbol) !== -1;
    }).map(function (item) {
      return {
        exchange:'YoBit',
        symbol:item.pair
      }
    })
  }

  searchCoin(symbol:string):Observable<VOSearch[]>{
    let sub:Subject<VOSearch[]> = new Subject();
    this.getCurrencies().subscribe(res=>{
      sub.next( this._searchCoin(symbol, res));
    })

    return sub.asObservable()
  }



  getCurrencies():Observable<VOYoBit[]>{
    let url = 'api/yo-bit/currencies';
    return this.http.get(url).map(res=>{
      let obj = res.json().pairs;
      let out:VOYoBit[]=[];

      for(let str in obj){
        let coin = obj[str];
        coin.pair = str.toUpperCase();
        coin.market={}
        out.push(coin);
      }

      return out;
    })
  }

  getMarket(pair:string):Observable<VOYBMarket>{
    pair = pair.toLowerCase();
    let url = '/api/yo-bit/market/:pair';
    url = url.replace(':pair', pair);
    return this.http.get(url).map(res=>{
      let out:VOYBMarket = res.json()[pair];
      out.pair = pair;
      return out;
    })
  }
}

export interface VOYBMarket{
  pair:string;
  high: number;
  low: number;
  avg: number;
  vol: number;
  vol_cur: number;
  last: number;
  buy: number;
  sell:number;
  updated: number;
}



export interface VOYoBit{
  symbol:string;
  to:string;
  class?:string;
  pair:string;
  selected:boolean;
  decimal_places:number;
  min_price: number;
  max_price: number;
  min_amount:number;
  min_total: number;
  hidden: number;
  fee: number;
  fee_buyer:number;
  fee_seller:number;
  market:VOYBMarket;
}