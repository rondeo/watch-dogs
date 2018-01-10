import { Injectable } from '@angular/core';
import {AuthHttpService} from '../../services/auth-http.service';
import {IExchangePublic, VOExchange, VOMarketB, VOSearch} from '../../models/app-models';
import * as _ from 'lodash';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

@Injectable()
export class PoloniexService implements IExchangePublic {

  marketsInd:{[market:string]:VOExchange};
  usd_btc:VOExchange;
  usd_dash:VOExchange;
  usd_ltc:VOExchange;
  usd_nxt:VOExchange;
  usd_str:VOExchange;
  usd_xrp:VOExchange;
  usd_eth:VOExchange;
  usd_etc:VOExchange;
  usd_zec:VOExchange;
  usd_bch:VOExchange;
  usd_rep:VOExchange;



  private marlets:VOExchange[];
  constructor(  private http:AuthHttpService) {


  }

  private _searchCoin(symbol:string, ar:VOExchange[]):VOSearch[]{
    return ar.filter(function (item) {
      return item.pair.indexOf(symbol) !== -1;
    }).map(function (item) {
      return {
        exchange:'Poloniex',
        symbol:item.pair
      }
    })
  }

  searchCoin(symbol:string):Observable<VOSearch[]>{
    let sub:Subject<VOSearch[]> = new Subject();
    this.getTicker().subscribe(res=>{

      sub.next( this._searchCoin(symbol, res));
    })

    return sub.asObservable()
  }




  getTicker():Observable<VOExchange[]>{
    let url = '/api/poloniex/returnTicker';
    return this.http.get(url).map(res=>{
      let data = res.json();
      this.marketsInd = data;
      this.usd_btc = data['USDT_BTC'];

      for (let str in data){
        data[str]['pair'] = str;
      }

      return <VOExchange[]>_.values(data).map(function (item:VOExchange) {
        for (let str in item) if(!isNaN(item[str]))item[str]=+item[str];
        item.low = item.lowestAsk;
        item.high = item.highestBid;
        return item;
      })

    })
  }

  currencies:any;
  getCurrencies() {
    let url = 'api/poloniex/currencies';
    return this.http.get(url).map(res => res.json()).do(res=>{
      this.currencies = res;
    })
  }








}
