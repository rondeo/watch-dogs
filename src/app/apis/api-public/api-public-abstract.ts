import {VOBooks, VOMarket, VOOrder} from "../../models/app-models";
import {Observable} from "rxjs/Observable";
import {HttpClient} from "@angular/common/http";
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/empty';

export interface MarketDay {
  Ask: number[];
  BaseVolume: number[];
  Bid: number[];
  High: number[];
  Last: number[];
  Low: number[];
  OpenBuyOrders?: number[];
  OpenSellOrders?: number[];
  percentChange?: number[];
  Volume: number[];
  stamps: number[];
}


export abstract class ApiPublicAbstract {
  exchange: string;
  allCoins: { [coin: string]: { [base: string]: number } };


  constructor(protected http: HttpClient) {

  }

  getAllCoins(fromCache = true):Observable<{ [coin: string]: { [base: string]: number } }> {
    if (this.allCoins) return Observable.of(this.allCoins);
    else {
      if (fromCache) {
        const str = localStorage.getItem(this.exchange + '-coins');
        if (str) {
          this.allCoins = JSON.parse(str);
          return Observable.of(this.allCoins);
        }
      }
      return this.downloadTicker().map((r) =>{
        console.log(this.exchange , r);
        localStorage.setItem(this.exchange + '-coins', JSON.stringify(this.allCoins));
        return this.allCoins
      } )
    }
  }

  getMarketDay(base: string, coin: string, from: string, to: string): Observable<MarketDay> {

    return this.getAllCoins().switchMap(allCoins =>{
      if(!!allCoins[coin])  return this.http
        .get('/api/front-desk/' + this.exchange + '-history?base=' + base
          + '&coin=' + coin + '&from=' + from + '&to=' + to).map(this.mapCoinDay);
      else {
       // console.log(' no coin ' + coin , allCoins);
        return Observable.empty();
      }
    })

  }

  abstract downloadBooks(base: string, coin: string): Observable<VOBooks>;

  abstract downloadMarketHistory(base: string, coin: string): Observable<VOOrder[]>;

  abstract downloadTicker(): Observable<{ [market: string]: VOMarket }>;

  abstract mapCoinDay(data): MarketDay;

}
