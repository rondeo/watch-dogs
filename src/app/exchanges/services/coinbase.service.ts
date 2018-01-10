import { Injectable } from '@angular/core';
import {AuthHttpService} from '../../services/auth-http.service';
import {Observable} from 'rxjs/Observable';
import {VOSearch} from '../../models/app-models';
import {Subject} from 'rxjs/Subject';

@Injectable()
export class CoinbaseService {

  constructor(private http:AuthHttpService) { }

  private _searchCoin(symbol:string, ar:VOCBCurrency[]):VOSearch[]{
    return ar.filter(function (item) {
      return item.code.indexOf(symbol) !== -1;
    }).map(function (item) {
      return {
        exchange:'Coindase',
        symbol:item.code
      }
    })
  }

  searchCoin(symbol:string):Observable<VOSearch[]>{
    let sub:Subject<VOSearch[]> = new Subject();

    this.getCurencies().subscribe(res=>{
      //  console.log(res);
      sub.next(this._searchCoin(symbol, res));
    })

    return sub.asObservable()
  }


  getCurencies():Observable<VOCBCurrency[]>{
    let url = '/api/coinbase/currencies'
    return this.http.get(url).map(res=>res.json().data.map(function (item) {
      return {
        code:item.id,
        label:item.name,
        min:+item.min_size
      }
    }));
  };

  getExchange(symbol:string):Observable<BCRates> {
    let url = '/api/coinbase/exchange-rates/'+symbol;
    return this.http.get(url).map(res => {

      let data = res.json().data.rates;
      for(let str in data)data[str]= +data[str];

      return data
    })
  }

}

export interface VOCBCurrency{
code:string;
label:string;
min:number;
btc:number;
eth:number;
}
export interface BCRates{
  [code:string]:number
}