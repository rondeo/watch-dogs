import {ApiPublicAbstract} from './api-public-abstract';
import {HttpClient} from '@angular/common/http';
import {StorageService} from '../../services/app-storage.service';
import {VOBooks, VOMarket, VOOrder, VOTrade} from '../../models/app-models';
import {Observable} from 'rxjs/Observable';

export class ApiPublicOkex extends ApiPublicAbstract {
  exchange = 'okex';
  constructor(http: HttpClient, storage:StorageService) {
    super(http, storage);
  }

  getMarketUrl(base:string, coin: string): string{
    return 'https://www.okex.com/market?product={{coin}}_{{base}}'
      .replace('{{coin}}',coin.toLowerCase()).replace('{{base}}', base.toLowerCase());
  }

  downloadMarketHistory(base:string, coin:string) {
    let url = '/api/proxy/www.okex.com/api/v1/trades.do?symbol={{coin}}_{{base}}&limit=300'
      .replace('{{base}}', base.toLowerCase())
      .replace('{{coin}}', coin.toLowerCase());
    console.log(url);
    return this.http.get(url).map((res:any[]) => {

      return res.map(function (o) {
        return {
          uuid:o.tid,
          isOpen:false,
          base:base,
          coin:coin,
          exchange:'okex',
          action:o.type.toUpperCase(),
          timestamp:o.date_ms,
          amountCoin:o.amount,
          rate:o.price
        }
      }).reverse()
    });
  }

  downloadBooks(base: string, coin: string): Observable<VOBooks> {

    let url = '/api/proxy/www.okex.com/api/v1/depth.do?symbol={{coin}}_{{base}}'
      .replace('{{base}}',  base.toLowerCase())
      .replace('{{coin}}', coin.toLowerCase());
    console.log(url);
    return this.http.get(url).map((res: any) => {

      if(!res.bids){
        console.log(res);
        throw new Error(this.exchange + ' wromg data ');
      }

      let buy: VOTrade[] = res.bids.map(function (item) {
        return {
          amountCoin: +item[1],
          rate: +item[0]
        }
      }).sort(function (a, b) {
        return b.rate - a.rate
      });



      let sell = res.asks.map(function (item) {
        return {
          amountCoin: +item[1],
          rate: +item[0]
        }
      }).sort(function (a, b) {
        return a.rate - b.rate
      });

      return {
        market: base +'_'+coin,
        exchange: 'okex',
        buy: buy,
        sell: sell
      }

    })
  }

  /*allCoins: {[coin:string]:{[base:string]:number}};

  async getAllCoins(fromCache = true): Promise<{[coin:string]:{[base:string]:number}}> {
    if (this.allCoins) return Promise.resolve(this.allCoins);
    else {
      if(fromCache){
        const str =  localStorage.getItem(this.exchange+ '-coins');
        if(str){
          this.allCoins = JSON.parse(str);
          return Promise.resolve(this.allCoins);
        }
      }

      return this.downloadTicker().map(() => this.allCoins).toPromise();
    }
  }
*/

  downloadTicker():Observable<{[market:string]:VOMarket}> {
    // https://www.okex.com/api/v1/tickers.do
    let url = '/api/proxy/www.okex.com/api/v1/tickers.do';
    console.log(url);

    return this.http.get(url).map((result: any) => {

      let data: any[] = result.tickers;

      const indexed = {};

      const bases = [];
      const allCoins = {}
      //   console.log(ar);
      data.forEach(function (item) {
        let market: VOMarket = new VOMarket();
        const ar: string[] = item.symbol.toUpperCase().split('_');
        market.base = ar[1];
        market.coin = ar[0];
        if (bases.indexOf(market.base) === -1) bases.push(market.base);
        market.pair = market.base + '_' + market.coin;

        market.exchange = 'okex';
        market.Last = +item.last;
        market.High = +item.high;
        market.Low = +item.low;
        market.Ask = +item.sell;
        market.Bid = +item.buy;
        market.BaseVolume = +item.vol * +item.last;
        indexed[market.pair] = market;
        if(!allCoins[market.coin])allCoins[market.coin] = {};
        allCoins[market.coin][market.base] =  market.Last;
      });
      this.allCoins = allCoins;
      return indexed;
    });
  }

  downloadTicker2():Observable<{[market:string]:VOMarket}> {
    //
    let url = '/api/proxy/www.okex.com/v2/spot/markets/products';
    console.log(url);

    return this.http.get(url).map((result: any) => {

      let data: any[] = result.data;
      const indexed = {};

      const bases = [];
      const allCoins = {}
      //   console.log(ar);
      data.forEach(function (item) {
        let market: VOMarket = new VOMarket();
        const ar: string[] = item.symbol.toUpperCase().split('_');

        market.base = ar[1];
        market.coin = ar[0];
        if (bases.indexOf(market.base) === -1) bases.push(market.base);
        market.pair = market.base + '_' + market.coin;
        market.id = item.productId;
        market.exchange = 'okex';
        market.Last = +item.last;
        market.High = +item.high;
        market.Low = +item.low;
        market.Ask = +item.sell;
        market.Bid = +item.buy;
        market.BaseVolume = +item.volume * +item.last;
        indexed[market.pair] = market;
        if(!allCoins[market.coin])allCoins[market.coin] = {};
        allCoins[market.coin][market.base] =  market.Last;
      });
      this.allCoins = allCoins;
      return indexed;
    });
  }
}

/*
*
*
* "buy": "0.00000044",
      "change": "+0.00000000",
      "changePercentage": "+0.00%",
      "close": "0.00000045",
      "createdDate": 1531444879870,
      "currencyId": 601,
      "dayHigh": "0.00000045",
      "dayLow": "0.00000044",
      "high": "0.00000045",
      "inflows": "1.1545083",
      "last": "0.00000045",
      "low": "0.00000044",
      "marketFrom": 701,
      "name": {

      },
      "open": "0.00000045",
      "outflows": "1.14309318",
      "productId": 601,
      "sell": "0.00000045",
      "symbol": "bcn_btc",
      "volume": "5176279.81389208"*/

