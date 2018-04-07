import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {IApiPublic} from "../i-api-public";
import {VOBooks, VOMarket, VOOrder} from "../../models/app-models";


export class ApiPublicBinance implements IApiPublic {
  exchange = 'binance';

  constructor(private http: HttpClient) {

  }

  downloadMarket(base: string, coin: string): Observable<VOMarket> {

    return null;
  }

  downloadMarkets(): Observable<VOMarket[]> {
    return null;
  }

  getCurrency(): Promise<string[]> {
    return null;
  }

  downloadTicker(): Observable<{ [market: string]: VOMarket }> {
    const url = '/api/proxy/api.binance.com/api/v3/ticker/price';
    return this.http.get(url).map((res: any[]) => {
      // console.log(res);
      const indexed = {};
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
      return indexed;
    })


  }

  downloadBooks(base: string, coin: string): Observable<VOBooks> {

    return null
  }

  downloadMarketHistory(base: string, coin: string): Observable<VOOrder[]> {
    let url = '/api/proxy/api.binance.com/api/v1/trades?symbol={{coin}}{{base}}&limit=300'.replace('{{base}}', base).replace('{{coin}}', coin);
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