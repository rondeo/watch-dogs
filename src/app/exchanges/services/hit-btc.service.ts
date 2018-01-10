import { Injectable } from '@angular/core';
import {AuthHttpService} from '../../services/auth-http.service';
import {Observable} from 'rxjs/Observable';
import {VOSearch} from '../../models/app-models';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';


@Injectable()
export class HitBtcService {



  marketAr:VOHitBtc[];
  marketArSub:BehaviorSubject<VOHitBtc[]>;
  marketAr$:Observable<VOHitBtc[]>;

  constructor(private http:AuthHttpService) {
    this.marketArSub = new BehaviorSubject([]);
    this.marketAr$ = this.marketArSub.asObservable();
  }


  private _searchCoin(symbol:string, ar:VOHitBtc[]):VOSearch[]{
    return ar.filter(function (item) {
      return item.pair.indexOf(symbol) !== -1;
    }).map(function (item) {
      return {
        exchange:'HitBtc',
        symbol:item.pair
      }
    })
  }

  searchCoin(symbol:string):Observable<VOSearch[]>{
    let sub:Subject<VOSearch[]> = new Subject();

    this.getMarkets().subscribe(res=>{
       //console.log(res);

       let result = this._searchCoin(symbol, res);
      // console.log(result);

       setTimeout(()=>sub.next(result), 50);

    })

    return sub.asObservable()
  }


  getMarkets():Observable<VOHitBtc[]>{

    if(!this.marketAr){
      let url = 'api/hit-btc/currencies';
      this.http.get(url).map(res=>{
        let out = res.json().symbols;
        out.forEach(function (item) {
          let l = item.symbol.length;
          item.pair = item.symbol.substr(0,l-3)+'_'+item.symbol.substr(l-3);
        })

        return out;
      }).subscribe(res=>{
        this.marketAr = res;
        this.marketArSub.next(this.marketAr);
      })
    }


    return this.marketAr$;

  }

}


export interface VOHitBtc{
  pair:string;
  symbol:string;
  step:number;
  lot:number;
  currency:string;
  commodity: string;
  takeLiquidityRate:number;
  provideLiquidityRate:number;
}
