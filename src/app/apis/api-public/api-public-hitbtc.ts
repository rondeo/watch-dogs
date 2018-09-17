import {VOBooks, VOMarket, VOOrder, VOTrade} from "../../models/app-models";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {ApiPublicAbstract} from "./api-public-abstract";
import {StorageService} from "../../services/app-storage.service";

export class ApiPublicHitbtc extends ApiPublicAbstract{
  exchange = 'hitbtc';
  private marketsAr: VOMarket[];

  constructor(http: HttpClient, storage:StorageService) {
    super(http, storage);
  }

  getMarketUrl(base:string, coin: string): string{
    return  'https://hitbtc.com/{{coin}}-to-{{base}}'
      .replace('{{base}}', base).replace('{{coin}}', coin);
  }

  downloadBooks(base: string, coin: string): Observable<VOBooks> {

    let url = '/api/proxy-5min/https://api.hitbtc.com/api/2/public/orderbook/{{coin}}{{base}}'
      .replace('{{base}}', base === 'USDT' ? 'USD' : base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res: any) => {

      if(!res.bid){
        console.log(res);
        throw new Error(this.exchange + ' wromg data ');
      }
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
    let url = '/api/proxy-5min/https://api.hitbtc.com/api/2/public/ticker';
    console.log(url);


    return this.http.get(url).map(result => {

      let ar: any = result;
      const indexed = {};
      const marketsAr = [];
      const bases = [];
      const allCoins = {}
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
        market.high = +item.high;
        market.low = +item.low;
        market.Ask = +item.ask;
        market.Bid = +item.bid;
        market.BaseVolume = +item.volume * +item.last;
        indexed[market.pair] = market;
        if(item.open)marketsAr.push(market);

        if(!allCoins[market.coin])allCoins[market.coin] = {};
        allCoins[market.coin][market.base] =  market.Last;
      });
     // console.log(marketsAr);
      this.allCoins = allCoins;
      return indexed;
    });
  }


  downloadMarketHistory(base: string, coin: string): Observable<VOOrder[]> {
    if (base === 'USDT') base = 'USD';
    let url = '/api/proxy/https://api.hitbtc.com/api/2/public/trades/{{coin}}{{base}}?sort=DESC'
      .replace('{{base}}', base).replace('{{coin}}', coin);
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

  mapCoinDay(res){

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

    let Volume = [];

    let stamps = [];

    ar.forEach(function (item) {

      Ask.push(+item.ask);
      Bid.push(+item.bid);
      High.push(+item.high);
      Last.push(+item.last);
      Low.push(+item.low2);

      percentChange.push(100*(+item.last - +item.open)+item.open);

      Volume.push(+item.volume);

      BaseVolume.push(+item.volumeQuote);
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