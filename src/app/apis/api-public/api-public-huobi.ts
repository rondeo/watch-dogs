import {ApiPublicAbstract} from './api-public-abstract';
import {HttpClient} from '@angular/common/http';
import {StorageService} from '../../services/app-storage.service';
import {VOBooks, VOMarket, VOOrder, VOTrade} from '../../models/app-models';
import {Observable} from 'rxjs/Observable';

export class ApiPublicHuobi extends ApiPublicAbstract {
  exchange = 'huobi';
  constructor(http: HttpClient, storage:StorageService) {
    super(http, storage);
  }

  getMarketUrl(base:string, coin: string): string{
    return 'https://www.huobi.com/{{coin}}_{{base}}/exchange/'
      .replace('{{base}}', base.toLowerCase()).replace('{{coin}}', coin.toLowerCase());
  }


  downloadMarketHistory(base:string, coin:string) {
    let url = '/api/proxy/api.huobipro.com/market/history/trade?size=200&symbol={{coin}}{{base}}'
      .replace('{{base}}', base.toLowerCase())
      .replace('{{coin}}', coin.toLowerCase());
    console.log(url);
    return this.http.get(url).map((res:any) => {
      return res.data.map(function (o) {
        o = o.data[0];
        return {
          uuid:o.id,
          isOpen:false,
          base:base,
          coin:coin,
          exchange:'huobi',
          action:o.direction.toUpperCase(),
          timestamp:o.ts,
          amountCoin:o.amount,
          rate:o.price
        }
      })
    });
  }

  downloadBooks(base: string, coin: string): Observable<VOBooks> {

    let url = '/api/proxy/api.huobipro.com/market/depth?&type=step0&symbol={{coin}}{{base}}'
      .replace('{{base}}',  base.toLowerCase())
      .replace('{{coin}}', coin.toLowerCase());
    console.log(url);
    return this.http.get(url).map((res: any) => {
      const result = res.tick;

      if(!result.bids){
        console.log(res);
        throw new Error(this.exchange + ' wromg data ');
      }
      let buy: VOTrade[] = result.bids.map(function (item) {
        return {
          amountCoin: +item[1],
          rate: +item[0]
        }
      });

      let sell = result.asks.map(function (item) {
        return {
          amountCoin: +item[1],
          rate: +item[0]
        }
      });

      return {
        market: base +'_'+coin,
        exchange: 'huobi',
        buy: buy,
        sell: sell
      }

    })
  }

  downloadTicker():Observable<{[market:string]:VOMarket}> {
    // https://www.okex.com/api/v1/tickers.do
    let url = '/api/proxy/api.huobipro.com//market/tickers';
    console.log(url);

    return this.http.get(url).map((result: any) => {
      let data: any[] = result.data;
      const indexed = {};
      const bases = [];
      const allCoins = {}
      //   console.log(ar);
      data.forEach(function (item) {
        let market: VOMarket = new VOMarket();
        const symbol:string = item.symbol.toUpperCase();
        market.base = symbol.slice(-3);
        if(market.base === 'SDT') {
          market.base = 'USDT';
          market.coin = symbol.slice(0, -4);
        } else {
          market.coin = symbol.slice(0, -3);
        }
        if (bases.indexOf(market.base) === -1) bases.push(market.base);
        market.pair = market.base + '_' + market.coin;

        market.exchange = 'huobi';
        market.Last = +item.close;
        market.High = +item.high;
        market.Low = +item.low;
       // market.Ask = +item.sell;
       // market.Bid = +item.buy;
        market.BaseVolume = +item.vol;
        indexed[market.pair] = market;
        if(!allCoins[market.coin])allCoins[market.coin] = {};
        allCoins[market.coin][market.base] =  market.Last;
      });
      this.allCoins = allCoins;
      return indexed;
    });
  }
}
