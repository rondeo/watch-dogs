import {HttpClient} from '@angular/common/http';

import {VOBooks, VOMarket, VOOrder} from '../../../amodels/app-models';
import {ApiPublicAbstract} from './api-public-abstract';
import {StorageService} from '../../services/app-storage.service';
import * as moment from 'moment';
import {UTILS} from '../../../acom/utils';
import {VOCandle} from '../../../amodels/api-models';
import {SocketBase} from '../sockets/soket-base';
import {BinanceTradesSocket} from '../sockets/binance-trade-socket';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs/internal/Observable';


export class ApiPublicBinance extends ApiPublicAbstract {

  exchange = 'binance';
  private prefix = '/api/proxy/';
  static instance: ApiPublicBinance;

  constructor(http: HttpClient, storage: StorageService) {
    super(http, storage);
    ApiPublicBinance.instance = this;
  }

  hasSocket() {
    this.socket = new BinanceTradesSocket();
    return true;
  }

  getMarketUrl2(market: string): string {
    return 'https://www.binance.com/en/trade/pro/' + market.split('_').reverse().join('_')
  }

  getMarketUrl(base: string, coin: string): string {

    return 'https://www.binance.com/trade.html?symbol={{coin}}_{{base}}'
      .replace('{{base}}', base).replace('{{coin}}', coin);
  }

  async downloadCandles(market: string, interval: string, limit: number, endTime = 0): Promise<VOCandle[]> {
    // const markets = await this.getMarkets();
    // if(!markets[market]) return Promise.resolve([]);
    const params: any = {
      symbol: market.split('_').reverse().join(''),
      interval: interval,
      limit: String(limit)
    };
    if (endTime) params.endTime = endTime;
    const url = this.prefix + 'https://api.binance.com/api/v1/klines';
    // console.log(url);
    return await this.http.get(url, {params}).pipe(map((res: any[]) => {
      //  console.log(res);
      return res.map(function (item) {
        return {
          from: +item[0],
          to: +item[6],
          open: +item[1],
          high: +item[2],
          low: +item[3],
          close: +item[4],
          Trades: +item[8],
          Volume: +item[5]
        }
      })
    })).toPromise();

  }

  async getCandlesticks(base: string, coin: string, limit = 100, from = 0, to = 0): Promise<VOCandle[]> {
    const markets = await this.getMarkets();
    if (!markets[base + '_' + coin]) return Promise.resolve([]);
    const params = {
      symbol: coin + base,
      interval: '5m',
      limit: limit,
      startTime: from,
      endTime: to
    };
    if (!limit) delete params.limit;
    if (!from) delete params.startTime;
    if (!to) delete params.endTime;

    const url = this.prefix + 'https://api.binance.com/api/v1/klines?' + UTILS.toURLparams(params);
    console.log(url);
    return this.http.get(url).pipe(map((res: any[]) => {
      return res.map(function (item) {
        return {
          from: +item[0],
          to: +item[6],
          open: +item[1],
          high: +item[2],
          low: +item[3],
          close: +item[4],
          Trades: +item[8],
          Volume: +item[5]
        }
      })


    })).toPromise()

  }

  static parseSymbol(symbol: string): { base: string, coin: string } {
    let coin: string;
    let base: string;
    const id: string = symbol;
    switch (id.slice(-3)) {
      case 'BTC':
        coin = id.slice(0, -3);
        base = 'BTC';
        break;
      case 'ETH':
        coin = id.slice(0, -3);
        base = 'ETH';
        break;
      case 'SDT':
        coin = id.slice(0, -4);
        base = 'USDT';
        break;
      case 'BNB':
        coin = id.slice(0, -3);
        base = 'BNB';
        break;
    }
    return {base, coin};
  }

  downloadTicker(): Observable<{ [market: string]: VOMarket }> {
    // const url = '/api/proxy/api.binance.com/api/v3/ticker/price';
    const url = this.prefix + 'https://api.binance.com/api/v1/ticker/24hr';
    console.log(url);
    return this.http.get(url).pipe(map((res: any[]) => {
      const indexed = {};
      const allCoins = {};
      if (!Array.isArray(res)) return null;
      /// filter dead markets;
      res = res.filter(function (item) {
        return +item.volume;
      });

      res.forEach(function (item) {

        const market = ApiPublicBinance.parseSymbol(item.symbol);
        const coin = market.coin;
        const base = market.base;
        const id = item.symbol;

        const BaseVolume = 1e10,
          Volume = +item.volume,
          Bid = +item.bidPrice,
          Ask = +item.askPrice,
          High = +item.highPrice,
          Low = +item.lowPrice,
          Last = +item.lastPrice;
        const exchange = 'binance';


        if (!allCoins[coin]) allCoins[coin] = {};
        allCoins[coin][base] = Last;

        indexed[base + '_' + coin] = {
          exchange,
          id,
          coin,
          base,
          Last,
          Bid,
          Ask,
          High,
          Low,
          Volume,
          BaseVolume
        }
      })

      this.allCoins = allCoins;
      return indexed;
    }));
  }

  downloadBooks(base: string, coin: string): Observable<VOBooks> {
    let url = this.prefix + 'https://api.binance.com/api/v1/depth?symbol={{coin}}{{base}}&limit=100'
      .replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).pipe(map((res: any) => {
      let r = (<any>res);


      return {
        market: base + '_' + coin,
        exchange: 'binance',
        buy: r.bids.map(function (o) {
          return {amountCoin: +o[1], rate: +o[0]}
        }),
        sell: r.asks.map(function (o) {
          return {amountCoin: +o[1], rate: +o[0]}
        })
      }
    }, console.error));
  }

  downloadMarketHistory(base: string, coin: string): Observable<VOOrder[]> {
    let url = this.prefix + 'https://api.binance.com/api/v1/trades?symbol={{coin}}{{base}}&limit=200'
      .replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).pipe(map((res: any[]) => {

      //console.log(res);
      return res.reverse().map(function (o) {
        return {
          uuid: o.id,
          isOpen: false,
          base: base,
          coin: coin,
          market: base + '_' + coin,
          exchange: 'binance',
          action: o.isBuyerMaker ? 'SELL' : 'BUY',
          timestamp: o.time,
          amountCoin: +o.qty,
          rate: +o.price
        }
      })
    }));
  }

  mapCoinDay(res) {
    let ar: any[] = res.data;

    let Ask = [];
    let BaseVolume = [];

    let Bid = [];


    let High = [];
    let Last = [];
    let Low = [];

    let percentChange = [];
    let OpenSellOrders = [];
    let Volume = [];
    let stamps = [];
    ar.forEach(function (item) {
      Ask.push(+item.askPrice);
      BaseVolume.push(+item.quoteVolume);
      Bid.push(+item.bidPrice);
      High.push(+item.highPrice);
      Last.push(+item.lastPrice);
      Low.push(+item.lowPrice);
      percentChange.push(+item.priceChangePercent);
      Volume.push(+item.volume);
      stamps.push(item.stamp);
    });

    return {
      Ask,
      BaseVolume,
      Bid,
      High,
      Last,
      Low,
      percentChange,
      Volume,
      stamps
    }
  }


}
