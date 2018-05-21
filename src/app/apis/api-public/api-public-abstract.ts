import {VOBooks, VOMarket, VOOrder} from '../../models/app-models';
import {Observable} from 'rxjs/Observable';
import {HttpClient} from '@angular/common/http';
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/empty';
import {StorageService} from '../../services/app-storage.service';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/observable/fromPromise';

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


  constructor(
    protected http: HttpClient,
    protected store: StorageService
  ) {

  }

  private updateTicker(){
    return this.downloadTicker().map((r) => {

      this.tickerTimestamp = Date.now();
      console.log('%c ' + this.exchange + ' UPDATED ticker', 'color:blue');
      localStorage.setItem('tickerTimestamp ' + this.exchange, String(this.tickerTimestamp));

      this.store.upsert(this.exchange + '-coins', JSON.stringify(this.allCoins));
      return this.allCoins
    })
  }

  tickerTimestamp:number;

  getAllCoins(fromCache = true): Observable<{ [coin: string]: { [base: string]: number } }> {
    if(!fromCache){
      if(!this.tickerTimestamp) this.tickerTimestamp = +localStorage.getItem('tickerTimestamp ' + this.exchange);
      if((Date.now() - this.tickerTimestamp) > (15 * 60 * 1000)){
        console.log('%c ' + this.exchange + ' updating ticker '+ Math.round((Date.now() - this.tickerTimestamp)/60000) + ' min','color:blue');
        return this.updateTicker();
      }
    }

    if (this.allCoins) return Observable.of(this.allCoins);
    else {
      //if (fromCache) {
        const prom = new Promise<any>((resolve, reject) => {
          this.store.select(this.exchange + '-coins').then(str => {
            if (!str) {
              this.updateTicker().subscribe(resolve, reject);
             /* this.downloadTicker().map((r) => {

                // console.log(this.exchange , r);
                // console.log(this.allCoins);
                this.store.upsert(this.exchange + '-coins', JSON.stringify(this.allCoins));
                // localStorage.setItem(this.exchange + '-coins', JSON.stringify(this.allCoins));
              }).toPromise()*/
            } else {
              // console.log(this.exchange);
              this.allCoins = JSON.parse(str);
              resolve(this.allCoins);
            }
          })
        });
        return Observable.fromPromise(prom);
      //}
/*
      return this.downloadTicker().map((r) => {
        console.log(this.exchange, this.allCoins);
        this.tickerTimestamp = Date.now();
        localStorage.setItem('tickerTimestamp ' + this.exchange, String(this.tickerTimestamp));
          this.store.upsert(this.exchange + '-coins', JSON.stringify(this.allCoins));
        // localStorage.setItem(this.exchange + '-coins', JSON.stringify(this.allCoins));
        return this.allCoins
      })*/
    }
  }

  getMarketDay(base: string, coin: string, from: string, to: string): Observable<MarketDay> {

    return this.getAllCoins().switchMap(allCoins => {
      if (!!allCoins[coin]) return this.http
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
