import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {IApiPublic} from "../i-api-public";
import {VOBooks, VOMarket, VOOrder} from "../../models/app-models";


export class ApiPublicBinance implements IApiPublic {
  exchange = 'binance';

  constructor(private http: HttpClient) {

  }

  allCoins: {[coin:string]:{[base:string]:number}};

  async getAllCoins(): Promise<{[coin:string]:{[base:string]:number}}> {
    if (this.allCoins) return Promise.resolve(this.allCoins);
    else return this.downloadTicker().map(() => this.allCoins).toPromise();
  }

  downloadTicker(): Observable<{ [market: string]: VOMarket }> {
    const url = '/api/proxy/api.binance.com/api/v3/ticker/price';
    return this.http.get(url).map((res: any[]) => {
      // console.log(res);
      const indexed = {};
      const allCoins = {}
      res.forEach(function (item) {

        let coin: string;
        let base: string;
        const id: string = item.symbol;
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

        var BaseVolume = 1e10, Volume, Bid, Ask, High, Low, Last = +item.price;
        const exchange = 'binance';


        if(!allCoins[coin])allCoins[coin] = {};
        allCoins[coin][base] =  +item.price;

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
    })
  }

  downloadBooks(base: string, coin: string): Observable<VOBooks> {
    let url = '/api/proxy/api.binance.com/api/v1/depth?symbol={{coin}}{{base}}&limit=100'
      .replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res: any) => {
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
    }, console.error);
  }

  downloadMarketHistory(base: string, coin: string): Observable<VOOrder[]> {
    let url = '/api/proxy/api.binance.com/api/v1/trades?symbol={{coin}}{{base}}&limit=300'
      .replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res: any[]) => {

      //console.log(res);
      return res.map(function (o) {
        return {
          uuid: o.id,
          isOpen: false,
          base: base,
          coin: coin,
          exchange: 'binance',
          action: o.isBuyerMaker ? 'SELL' : 'BUY',
          timestamp: o.time,
          amountCoin: +o.qty,
          rate: +o.price
        }
      })
    });
  }

}