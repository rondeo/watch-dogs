import {VOBooks, VOMarket, VOOrder} from '../../../amodels/app-models';
import {HttpClient} from '@angular/common/http';
import {StorageService} from '../../services/app-storage.service';
import {UTILS} from '../../../acom/utils';
import {VOCandle} from '../../../amodels/api-models';
import {SocketBase} from '../sockets/soket-base';
import * as _ from 'lodash';
import {filter, map} from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';

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

  private _markets$  = new BehaviorSubject(null);
  get markets$(): Observable<string[]> {
    if(!this._markets$.getValue()) {
      this.getMarkets().then(markets => this._markets$.next(Object.keys(markets)));
    }
    return  this._markets$.pipe(filter(markets => !!markets));
  }

  constructor(
    protected http: HttpClient,
    protected store: StorageService
  ) {

  }
  exchange: string;
  allCoins: { [coin: string]: { [base: string]: number } };

  protected socket: SocketBase;

  private marketsData: { timestamp: number, markets: { [symbol: string]: VOMarket } };

  marketsTimestamp = 0;

  booksProgress = false;
  booksSub = new BehaviorSubject<VOBooks>(null);

  isTicker;

  private ticker5minSub: BehaviorSubject<{ [market: string]: VOMarket }> = new BehaviorSubject<{ [market: string]: VOMarket }>(null);

  async getAllCoins(): Promise<string[]> {
    const markets = await this.getMarkets();
    return Object.values(markets).map(function (item) {
      return item.coin;
    });
  }

  async getMarkets(): Promise<{ [symbol: string]: VOMarket }> {
    const timeout = Date.now() - 0//(50 * 60 * 1000);

    if (this.marketsData && this.marketsData.timestamp > timeout) return Promise.resolve(this.marketsData.markets);

    const marketsData:
      { timestamp: number, markets: { [symbol: string]: VOMarket } } = await this.store.select(this.exchange + '-markets');

    if (marketsData && marketsData.timestamp && marketsData.timestamp > timeout) {
      this.marketsData = marketsData;
      return marketsData.markets;
    }

    const markets = await this.downloadTicker().toPromise();
    this.marketsData = {
      timestamp: Date.now(),
      markets: markets
    };
    await this.store.upsert(this.exchange + '-markets', this.marketsData);
    return markets;

  }

  getLastMinuteCandle(market: string): Promise<VOCandle> {
    return this.downloadCandles(market, '1m', 1).then(res => res[0]);

  }

  downloadCandles(market: string, interval: string, limit: number, endTime = 0): Promise<VOCandle[]> {

    return null;
  }

  async getCandlesticks(base: string, coin: string, limit = 100, from = 0, to = 0): Promise<VOCandle[]> {
    return Promise.resolve([]);
  }

  refreshBooks(market: string) {
    if (this.booksProgress) return;
    this.booksProgress = true;
    const ar = market.split('_');
    this.downloadBooks(ar[0], ar[1]).subscribe(res => {
      this.booksSub.next(res);
      this.booksProgress = false;
    }, err => {
      this.booksProgress = false;
    });
  }

  books$(market: string) {
    const books = this.booksSub.getValue();
    if (!books || books.market !== market) this.refreshBooks(market);
    return this.booksSub.asObservable();
  }

  hasSocket() {
    return false;
  }

  getTradesSocket(): SocketBase {
    return this.socket;
  }

  downloadBooks2(market: string) {
    const ar = market.split('_');
    return this.downloadBooks(ar[0], ar[1]);
  }

  downloadOrders(market) {
    const ar = market.split('_');
    return this.downloadMarketHistory(ar[0], ar[1]);
  }

  startRefrshTicker() {
    if (this.isTicker) return;
    this.isTicker = true;
    this.refreshTicker();
    setInterval(() => this.refreshTicker(), 6e4);
  }

  async refreshTicker() {
    const tickers = await this.downloadTicker().toPromise();
    this.ticker5minSub.next(tickers);
    return tickers;
  }

  ticker5min$(market: string) {
    return this.ticker5minSub.asObservable().pipe(map(function (o) {
      if (o) return o[market];
    }));
  }

  async getMarketTicker(market: string) {
     // this.startRefrshTicker();
    return new Promise((resolve, reject) => {
      this.ticker5min$(market).subscribe(ticker => {
        if (ticker) resolve(ticker);
      });
    });
  }

  async downloadHistory(market: string) {
    const ar = market.split('_');
    return this.downloadMarketHistory(ar[0], ar[1]).toPromise();
  }

  abstract downloadBooks(base: string, coin: string): Observable<VOBooks>;

  abstract downloadMarketHistory(base: string, coin: string): Observable<VOOrder[]>;

  abstract downloadTicker(): Observable<{ [market: string]: VOMarket }>;

  getMarketUrl2(market: string){
    const ar = market.split('_');
    return this.getMarketUrl(ar[0], ar[1]);
  }

  abstract getMarketUrl(base: string, coin: string): string;

  getMarketURL(market: string): string {
    const ar = market.split('_');
    return this.getMarketUrl(ar[0], ar[1]);
  }
}

