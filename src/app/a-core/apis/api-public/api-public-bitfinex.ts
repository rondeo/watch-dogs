import {HttpClient} from "@angular/common/http";
import {VOBooks, VOMarket, VOTrade} from "../../../amodels/app-models";

import {SOMarketBittrex} from "../../../amodels/sos";

import {ApiPublicAbstract} from "./api-public-abstract";
import {StorageService} from "../../services/app-storage.service";
import {VOCandle} from '../../../amodels/api-models';
import {UTILS} from '../../../acom/utils';
import {concatMap, delay, map} from 'rxjs/operators';
import {Observable} from 'rxjs/internal/Observable';
import {from} from 'rxjs/internal/observable/from';

export class ApiPublicBitfinex extends ApiPublicAbstract{
  exchange = 'bitfinex';

  private allMarkets: string[];
  constructor(http: HttpClient, storage:StorageService) {
    super(http, storage);
  }

  getMarketUrl(base:string, coin: string): string{
    return 'https://www.bfxdata.com/orderbooks/{{coin}}{{base}}'
      .replace('{{base}}', base.toLowerCase()).replace('{{coin}}', coin.toLowerCase())
  }

  downloadCandles(market:string, interval: string, limit: number, to: number): Promise<VOCandle[]>{
    market = market.replace('USDT','USD').split('_').reverse().join('');

    const url = 'api/proxy/https://api.bitfinex.com/v2/candles/trade:'+interval+':t'+
      market+'/hist';
   //  console.log(url);
    const params:any = {
     limit:String(limit)
    };
    if(to) params.end = to;

    return this.http.get(url, {params}).pipe(map((res: any[]) => {
       // console.warn(res);
       res.reverse();
      return res.map(function (item) {
        return {
          from:0,
          to:+item[0],
          open:+item[1],
          high: +item[3],
          low: +item[4],
          close: +item[2],
          Volume: +item[5]
        }
      })
    })).toPromise();
  }
  async getCandlesticks(base: string, coin: string, limit = 100, from = 0, to = 0): Promise<VOCandle[]>{
   // const markets = await this.getMarkets();
   // if(!markets[base+'_'+coin]) return Promise.resolve([]);
    const params = {
      start: from,
      end: to
    };
    if(!from) delete params.start;
    if(!to) delete params.end;
    if(base === 'USDT') base = 'USD';

    const url = 'api/proxy/https://api.bitfinex.com/v2/candles/trade:5m:t'
      +coin+base+'/hist?limit='+limit+'?'+UTILS.toURLparams(params);
    console.log(url);
    return this.http.get(url).pipe(map((res: any[]) => {
      return res.reverse().map(function (item) {
        return {
          from:0,
          to:+item[0],
          open:+item[1],
          high: +item[3],
          low: +item[4],
          close: +item[2],
          Volume: +item[5]
        }
      })


    })).toPromise()

  }

  downloadBooks(base: string, coin: string): Observable<VOBooks> {
    const url = '/api/proxy/https://api.bitfinex.com/v1/book/' + coin +(base === 'USDT'?'USD':base);
    console.log(url)
    return this.http.get(url).pipe(map((res: any) => {
      let r = (<any>res);
      return {
        market: base + '_' + coin,
        exchange: 'bitfinex',
        buy: r.bids.map(function (o) {
          return {amountCoin: +o.amount, rate: +o.price}
        }),
        sell: r.asks.map(function (o) {
          return {amountCoin: +o.amount, rate: +o.price}
        })
      }
    }, console.error));
  }



 /* getAllCoins(fromCache = true):Observable<{ [coin: string]: { [base: string]: number } }> {
    if (this.allCoins) return Observable.of(this.allCoins);
    else {
      if (fromCache) {
        const str = localStorage.getItem(this.exchange + '-coins');
        if (str) {
          this.allCoins = JSON.parse(str);
          return Observable.of(this.allCoins);
        }
      }
      return this.getSymbols().map(() => this.allCoins)
    }
  }
*/

 private  getItems(ids: string[]): Observable<any> {
   const url = '/api/proxy-5min/https://api.bitfinex.com/v1/pubticker/';

    return from(ids).pipe(
      concatMap(id => <Observable<any>> this.http.get(url + id)
        .pipe(
        map(res=>{
        console.log(res);
        return res;
        },
        delay(5000)))
    ));
  }

  downloadTicker(): Observable<{ [market: string]: VOMarket }> {
   return this.downlaodMarketsAvailable().pipe(map(markets =>{
     const coins = {};
      markets.forEach(function (item) {
       item = item.toUpperCase();
       const m = new VOMarket();
       m.exchange = 'bitfinex';
       m.base=  item.slice(-3);
       if (m.base === 'USD') m.base = 'USDT';
       m.coin = item.slice(0,-3);
       coins[m.base + '_' + m.coin] = m;
     });
      return coins
   }));
  }

  private getTickerForMarket(market: string) {
    const url = '/api/proxy-5min/https://api.bitfinex.com/v1/pubticker/' + market;
    console.log(url);
    return this.http.get(url).pipe(map(res => {
      console.log(res);
      return res;
    }));
  }

  private downlaodMarketsAvailable():Observable<string[]>{
    let url = '/api/proxy-1hour/https://api.bitfinex.com/v1/symbols';
    console.log(url);
    return <any>this.http.get(url)
  }
  /*private getSymbols(): Observable<any> {
    let url = '/api/proxy/api.bitfinex.com/v1/symbols';
    console.log(url);
    return this.http.get(url).map((res:string[]) =>{
      console.log(res);
      const coins = {};
      res.forEach(function (item) {
        let base = item.slice(-3).toUpperCase();
        if (base === 'USD') base = 'USDT';
        const coin = item.slice(0,-3).toUpperCase();
        if(!coins[coin]) coins[coin] = {};
        coins[coin][base] = -1;
      });

      this.allCoins = coins;
      return coins;
    });
  }*/

  downloadMarketHistory(base: string, coin: string) {
    let url = 'api/proxy/https://api.bitfinex.com/v2/trades/t{{coin}}{{base}}/hist'
      .replace('{{base}}', (base === 'USDT'?'USD':base))
      .replace('{{coin}}', coin);

    console.log(url);
    return this.http.get(url).pipe(map((res: any[]) => {

      return res.map(function (o) {
        return {
          uuid: o[0],
          isOpen: false,
          base: base,
          coin: coin,
          market: base + '_' + coin,
          exchange: 'bitfinex',
          action: o[2] < 0 ? 'SELL' : 'BUY',
          timestamp: o[1],
          amountCoin: Math.abs(o[2]),
          rate: o[3]
        }
      })
    }));
  }

  mapCoinDay(res: any) {

    let ar: any[] = res.data;

    let Ask = [];
    let BaseVolume = [];

    let Bid = [];


    let High = [];
    let Last = [];
    let Low = [];

    let OpenBuyOrders = [];

    let OpenSellOrders = [];

    let Volume = [];

    let stamps = [];

    ar.forEach(function (item) {

      Ask.push(+item.Ask);
      BaseVolume.push(+item.BaseVolume);
      Bid.push(+item.Bid);
      High.push(+item.High);
      Last.push(+item.Last);
      Low.push(+item.Low);
      OpenBuyOrders.push(+item.OpenBuyOrders);
      OpenSellOrders.push(+item.OpenSellOrders);
      Volume.push(+item.Volume);
      stamps.push(item.stamp);
    });

    return {
      Ask,
      BaseVolume,
      Bid,
      High,
      Last,
      Low,
      OpenBuyOrders,
      OpenSellOrders,
      Volume,
      stamps
    }
  }
}
