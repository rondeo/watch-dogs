import {VOBooks, VOMarket, VOOrder, VOTrade} from "../../models/app-models";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {IApiPublic} from "../i-api-public";

export class ApiPublicHitbtc implements IApiPublic {
  exchange = 'hitbtc';
  private marketsAr: VOMarket[];

  constructor(private http: HttpClient) {

  }

  downloadBooks(base: string, coin: string): Observable<VOBooks> {

    let url = '/api/hitbtc/public/orderbook/{{coin}}{{base}}'
      .replace('{{base}}', base === 'USDT' ? 'USD' : base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res: any) => {
      //  console.log(res);

      let buy: VOTrade[] = res.bid.map(function (item) {
        return {
          amountCoin: +item.size,
          rate: +item.price
        }
      });

      let sell = res.ask.map(function (item) {
        return {
          amountCoin: +item.size,
          rate: +item.price
        }
      });

      return {
        market: base +'_'+coin,
        exchange: 'hitbtc',
        buy: buy,
        sell: sell
      }

    })
  }

  downloadTicker():Observable<{[market:string]:VOMarket}> {
    let url = '/api/hitbtc/public/ticker';
    console.log(url);


    return this.http.get(url).map(result => {

      let ar: any = result;
      const indexed = {};
      const marketsAr = [];
      const bases = [];
    //   console.log(ar);
      ar.forEach(function (item) {
        let market: VOMarket = new VOMarket();
        market.base = item.symbol.slice(-3);
        if (market.base === 'USD') market.base = 'USDT';
        if (bases.indexOf(market.base) === -1) bases.push(market.base);
        market.coin = item.symbol.slice(0, -3);
        market.pair = market.base + '_' + market.coin;
        market.id = item.symbol;
        market.exchange = 'hitbtc';
        market.Last = +item.last;
        market.High = +item.high;
        market.Low = +item.low;
        market.Ask = +item.ask;
        market.Bid = +item.bid;
        market.BaseVolume = +item.volume * +item.last;
        indexed[market.pair] = market;
        if(item.open)marketsAr.push(market);
      });
     // console.log(marketsAr);
      return indexed;
    });
  }


  downloadMarketHistory(base: string, coin: string): Observable<VOOrder[]> {
    if (base === 'USDT') base = 'USD';
    let url = '/api/hitbtc/public/trades/{{coin}}{{base}}?sort=DESC'.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res: any) => {
      ///console.warn(res);

      return res.map(function (item) {
        let time = new Date(item.timestamp)
        return {
          action: item.side.toUpperCase(),
          isOpen: false,
          uuid: item.id,
          exchange: 'hitbtc',
          rate: +item.price,
          amountBase: +item.quantity * +item.price,
          amountCoin: +item.quantity,
          date: item.timestamp,
          minutes: time.getMinutes(),
          local: time.toLocaleTimeString(),
          timestamp: time.getTime()
        };
      });
    });
  }
}