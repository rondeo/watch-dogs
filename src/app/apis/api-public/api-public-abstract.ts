import {VOBooks, VOMarket, VOOrder} from '../../models/app-models';
import {Observable} from 'rxjs/Observable';
import {HttpClient} from '@angular/common/http';
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/empty';
import {StorageService} from '../../services/app-storage.service';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/observable/fromPromise';
import {UTILS} from '../../com/utils';
import {VOCandle} from '../../models/api-models';

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

  async getAllCoins(): Promise<string[]> {
    const markets = await this.getMarkets();
    return Object.values(markets).map(function (item) {
      return item.coin;
    })
  }

  private marketsData: { timestamp: number, markets: { [symbol: string]: VOMarket } };

  async getMarkets(): Promise<{ [symbol: string]: VOMarket }> {
    if (this.marketsData) return Promise.resolve(this.marketsData.markets);
    const marketsData: { timestamp: number, markets: { [symbol: string]: VOMarket } } = await this.store.select(this.exchange + '-markets');

    if (marketsData && marketsData.timestamp) {
      this.marketsData = marketsData;
      return marketsData.markets;

    }
    const markets = await this.downloadTicker().toPromise();
    this.marketsData = {
      timestamp: Date.now(),
      markets: markets
    }
    await this.store.upsert(this.exchange + '-markets', this.marketsData);
    return markets;
  }

  marketsTimestamp: number = 0;


  async getCandlesticks(base: string, coin: string, from: number, to: number): Promise<VOCandle[]> {
    return Promise.resolve([]);
  }

  abstract downloadBooks(base: string, coin: string): Observable<VOBooks>;

  abstract downloadMarketHistory(base: string, coin: string): Observable<VOOrder[]>;

  abstract downloadTicker(): Observable<{ [market: string]: VOMarket }>;

}
