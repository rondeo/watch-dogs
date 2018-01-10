import { Injectable } from '@angular/core';
import {AuthHttpService} from '../../services/auth-http.service';
import {Observable} from 'rxjs/Observable';
import {VOSearch} from '../../models/app-models';
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import * as _ from 'lodash';



@Injectable()
export class KrakenService {

  marketAr:VOKMarket[];
  marketArSub:BehaviorSubject<VOKMarket[]>;
  marketAr$:Observable<VOKMarket[]>;

  markets:{[kid:string]:VOKMarket};


  constructor( private http:AuthHttpService) {
    this.marketArSub = new BehaviorSubject([]);
    this.marketAr$ = this.marketArSub.asObservable();
  }




  private _searchCoin(symbol:string, ar:VOKMarket[]):VOSearch[]{
    return ar.filter(function (item) {
      return item.pair.indexOf(symbol) !== -1;
    }).map(function (item) {
      return {
        exchange:'Kraken',
        symbol:item.pair
      }
    })
  }

  searchCoin(symbol:string):Observable<VOSearch[]>{
    let sub:Subject<VOSearch[]> = new Subject();

    this.getCurencies().subscribe(res=>{
      //console.log(res);

      let result = this._searchCoin(symbol, res);
      // console.log(result);

      setTimeout(()=>sub.next(result), 50);

    })

    return sub.asObservable()
  }



  getMarket(kuid:string):Observable<any>{
    let url ='/api/kraken/market/' + kuid;
    return this.http.get(url).map(res=>res.json().result);
  }


  getCurencies():Observable<VOKMarket[]>{ //:Observable<{[kid:string]:VOKMarket}>{

    if(!this.marketAr){
      let url1 = '/api/kraken/currencies';
      let url2 = '/api/kraken/markets';
      this.http.get(url1).switchMap(res1=>{
        return this.http.get(url2).map(res2=>{
          let out = [];
          let result1:{[kid:string]:Result1}= res1.json().result;
          let result2:{[kid:string]:VOKMarket} = res2.json().result;

          for(let str in result2){
            let item:VOKMarket = result2[str];
            let coin1:Result1 = result1[item.base];
            if(!coin1) console.warn(' no base for ' + item.base);
            let coin2:Result1 = result1[item.quote];
            if(!coin2) console.warn(' no quote for ' + item.quote);
            item.pair = coin1.altname+'_'+coin2.altname;
            item.kid = str;
            // out.push(item)
          }          // console.log(out1, out2);
          //console.log(result1, result2);
          return result2;
        });
      }).subscribe(res =>{

        this.markets = res;
        this.marketAr = _.values(res);
        this.marketArSub.next(this.marketAr);
          })

    }

    return this.marketAr$


  }
}

interface Result1{
  aclass: string;
  altname: string;
  decimals: number;
  display_decimals:number;
}

export interface VOKMarket{
  pair:string;
  kid:string;
  aclass_base: string;
  altname: string;
  base:string;
  quote:string;
  fee_volume_currency:string;
  fees:number[][];
  fees_marker:number[][];
  leverage_buy:any[];
  leverage_sell:any[];
  lot:string;
  lot_decimals:number;
  lot_multiplier:number;
  margin_call:number;
  margin_stop:number;
  pair_decimals:number;
  a?:number[];
  b?:number[];
  c?:number[];
  h?:number[];
  l:number[];
  o:number;
  p:number[];
  t:number[];
  v:number[]

}

