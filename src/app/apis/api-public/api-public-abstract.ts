import {VOBooks, VOMarket, VOOrder} from "../../models/app-models";
import {Observable} from "rxjs/Observable";
import {HttpClient} from "@angular/common/http";

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

  async getAllCoins(fromCache = true): Promise<{ [coin: string]: { [base: string]: number } }> {
    if (this.allCoins) return Promise.resolve(this.allCoins);
    else {
      if (fromCache) {
        const str = localStorage.getItem(this.exchange + '-coins');
        if (str) {
          this.allCoins = JSON.parse(str);
          return Promise.resolve(this.allCoins);
        }
      }
      return this.downloadTicker().map(() => this.allCoins).toPromise();
    }
  }

  getMarketDay(base: string, coin: string, from: string, to: string): Observable<MarketDay> {
    return this.http.get('/api/front-desk/' + this.exchange + '-history?base=' + base + '&coin=' + coin + '&from=' + from + '&to=' + to).map(this.mapCoinDay);
  }

  abstract downloadBooks(base: string, coin: string): Observable<VOBooks>;

  abstract downloadMarketHistory(base: string, coin: string): Observable<VOOrder[]>;

  abstract downloadTicker(): Observable<{ [market: string]: VOMarket }>;

  abstract mapCoinDay(data): MarketDay;

}
