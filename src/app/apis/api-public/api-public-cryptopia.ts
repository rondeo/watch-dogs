import {VOBooks, VOMarket, VOOrder, VOTrade} from '../../models/app-models';

import {HttpClient} from '@angular/common/http';
import {ApiPublicAbstract} from './api-public-abstract';
import {StorageService} from '../../services/app-storage.service';
import {Observable} from 'rxjs/internal/Observable';
import {map} from 'rxjs/operators';

export class ApiPublicCryptopia extends ApiPublicAbstract {

  constructor(http: HttpClient, storage: StorageService) {
    super(http, storage);
  }
  exchange = 'cryptopia';

  static mapMarkets(
    result: any,
    marketsAr: VOMarket[],
    indexed: { [pair: string]: VOMarket },
    bases: string[],
    selected: string[]
  ): number {

    let ar1: any = result;
    // console.log(ar);
    ar1.forEach(function (item: any) {
      let ar: string[] = item.Label.split('/');

      let market: VOMarket = new VOMarket();
      market.base = ar[1];
      if (bases.indexOf(market.base) === -1) bases.push(market.base);
      market.coin = ar[0];

      market.pair = ar[1] + '_' + ar[0];
      market.selected = selected.indexOf(market.pair) !== -1;

      market.id = item.Label;
      market.exchange = 'cryptopia';

      // market.Volume = +item.Volume;
      market.Last = item.LastPrice;
      market.high = item.High;
      market.low = item.Low;
      market.Ask = item.AskPrice;
      market.Bid = item.BidPrice;
      market.BaseVolume = item.BaseVolume;
      market.PrevDay = 0;
      market.OpenBuyOrders = item.BuyVolume;
      market.OpenSellOrders = item.SellVolume;

      indexed[market.pair] = market;
      marketsAr.push(market);

    });

    return result.length;
  }

  getMarketUrl(base: string, coin: string): string {
    return 'https://www.cryptopia.co.nz/Exchange/?market={{coin}}_{{base}}'
      .replace('{{base}}', base).replace('{{coin}}', coin);
  }

  downloadBooks(base: string, coin: string): Observable<VOBooks> {

    let url = 'https://www.cryptopia.co.nz/api/GetMarketOrders/{{coin}}_{{base}}/100'.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).pipe(map((res: any) => {
      // console.log(res);
      res = res.Data;

      let buy: VOTrade[] = res.Buy.map(function (item) {
        return {
          amountCoin: +item.Total,
          rate: +item.Price
        };
      });

      let sell: VOTrade[] = res.Sell.map(function (item) {
        return {
          amountCoin: +item.Total,
          rate: +item.Price
        };
      });

      return {
        market: base + '_' + coin,
        exchange: this.exchange,
        buy: buy,
        sell: sell
      };

    }));
  }

  downloadMarketHistory(base: string, coin: string): Observable<VOOrder[]> {

    let url = 'https://www.cryptopia.co.nz/api/GetMarketHistory/{{coin}}_{{base}}/1'.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).pipe(map((res: any) => {
      res = res.Data;
      console.log(' MarketHistory ' + res.length);
      return res.map(function (item) {
        let time = new Date(item.Timestamp * 1000);
        return {
          action: item.Type.toUpperCase(),
          isOpen: false,
          uuid: item.Timestamp,
          exchange: 'cryptopia',
          rate: +item.Price,
          amountBase: +item.Total,
          amountCoin: +item.Amount,
          date: time.toUTCString(),
          minutes: time.getMinutes(),
          timestamp: item.Timestamp * 1000,
          local: time.toLocaleTimeString()
        };
      });
    }));
  }

  /* allCoins: {[coin:string]:{[base:string]:number}};

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
   }*/

  downloadTicker(): Observable<{ [market: string]: VOMarket }> {

    let url = 'https://www.cryptopia.co.nz/api/GetMarkets';
    console.log(url);
    return this.http.get(url).pipe(map((res: any) => {
      let result = res.Data;

      const allCoins = {};
      let marketsAr: VOMarket[] = [];

      let baseCoins: string[] = [];

      // let selected: string[] = this.getMarketsSelected();
      const ar1: any[] = res.Data;

      let indexed: {} = {};
      let bases: string[] = [];
      if (!Array.isArray(ar1)) {
        console.warn(res);
        return [];
      }

      ar1.forEach(function (item: any) {
        let ar: string[] = item.Label.split('/');

        let market: VOMarket = new VOMarket();
        market.base = ar[1];
        if (bases.indexOf(market.base) === -1) bases.push(market.base);
        market.coin = ar[0];


        market.pair = ar[1] + '_' + ar[0];

        market.id = item.Label;
        market.exchange = 'cryptopia';

        //  market.Volume = +item.Volume;
        market.Last = item.LastPrice;
        market.high = item.High;
        market.low = item.Low;
        market.Ask = item.AskPrice;
        market.Bid = item.BidPrice;
        market.BaseVolume = item.BaseVolume;
        market.PrevDay = 0;
        market.OpenBuyOrders = item.BuyVolume;
        market.OpenSellOrders = item.SellVolume;

        indexed[market.base + '_' + market.coin] = market;
        marketsAr.push(market);
        if (!allCoins[market.coin]) allCoins[market.coin] = {};
        allCoins[market.coin][market.base] = market.Last;

      });

      this.allCoins = allCoins;
      return indexed;
    }));
  }

  mapCoinDay(res) {

    // console.log(res);
    let ar: any[] = res.data;

    let Ask = [];
    let BaseVolume = [];

    let Bid = [];


    let High = [];
    let Last = [];
    let Low = [];

    let percentChange = [];

    let OpenSellOrders = [];
    let OpenBuyOrders = [];

    let Volume = [];

    let stamps = [];

    ar.forEach(function (item) {

      Ask.push(+item.AskPrice);
      Bid.push(+item.BidPrice);
      High.push(+item.High);
      Last.push(+item.LastPrice);
      Low.push(+item.Low);
      Volume.push(+item.Volume);
      OpenBuyOrders.push(+item.BuyBaseVolume);
      OpenSellOrders.push(+item.SellBaseVolume);
      percentChange.push(+item.Change);
      BaseVolume.push(+item.BaseVolume);
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
    };
  }
}
