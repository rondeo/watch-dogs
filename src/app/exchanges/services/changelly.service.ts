import { Injectable } from '@angular/core';
import {Http} from '@angular/http';
import {VOCoin, VOSearch} from '../../models/app-models';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

@Injectable()
export class ChangellyService {

  constructor(private http:Http) {

  }

  getCurrencies():Observable<{symbol:string, name:string}[]>{
    let url = '/api/exchange/changelly/getCurrencies';
    return this.http.get(url).map(res=>{
     let data =  res.json()
     // console.log(data);
      return data.map(function (item) {
        return {symbol:item.toUpperCase(), name:item.toUpperCase()};
      });
    });
  }

  getExchangeAmount(from_to:string, amount:number){
    let url = '/api/exchange/changelly/getExchangeAmount/'+from_to+'/'+amount;
    return this.http.get(url).map(res=>res.json());
  }

  getMinAmount(from_to:string){
    let url = '/api/exchange/changelly/getMinAmount/'+from_to;
    return this.http.get(url).map(res=>res.json());
  }

  generateAddress(from_to:string, address:string){
    let url = '/api/exchange/changelly/generateAddress/'+from_to+'/'+address;
    return this.http.get(url).map(res=>res.json());

  }

  getTransactions(symbol:string, address){
    let url = '/api/exchange/changelly/getTransactions/'+symbol+'/'+address;
    return this.http.get(url).map(res=>res.json());
  }


  private _searchCoin(symbol:string, ar:{symbol:string, name:string}[]):VOSearch[]{
    return ar.filter(function (item) {
      return item.symbol.indexOf(symbol) !== -1;
    }).map(function (item) {
      return {
        exchange:'Changely',
        symbol:item.symbol
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

}
