import {HttpClient} from "@angular/common/http";
import {VOBooks, VOMarket, VOTrade} from "../../models/app-models";

import {SOMarketBittrex} from "../../models/sos";
import {ApiPublicAbstract} from "./api-public-abstract";
import {StorageService} from "../../services/app-storage.service";
import {Observable} from 'rxjs/internal/Observable';
import {map} from 'rxjs/operators';
import {VOCandle} from '../../models/api-models';
import * as moment from 'moment';
import * as _ from 'lodash';
export class ApiPublicBittrex extends ApiPublicAbstract{

  exchange = 'bittrex';

  private prefix = '/api/proxy/';
  constructor(http: HttpClient, storage:StorageService) {
    super(http, storage);
  }


  downloadCandles(market: string, interval: string, limit: number, endTime = 0): Promise<VOCandle[]> {
    let tickInterval =  'hour';
    const marketName = market.split('_').join('-');

    //let _ = Math.round(moment().subtract(1, 'day').valueOf()/1000) + '';
    switch(interval){
      case '1m':
        tickInterval = 'oneMin';
        break;
      case '5m':
        tickInterval = 'fiveMin';
        break;
      case '15m':
        tickInterval = 'fiveMin';
        break;
      case '30m':
        tickInterval = 'thirtyMin';
        break;
      case '1h':
        tickInterval = 'hour';
        break;
      case '6h':
        tickInterval = 'day';
        break;
    };

    const url = this.prefix + 'https://international.bittrex.com/Api/v2.0/pub/market/GetTicks';

    return this.http.get(url, {params:{ marketName, tickInterval}})
      .pipe(map((res: any) =>{
        console.log(res);
        let result: any[] = _.takeRight(res.result, limit);

        const out: VOCandle[] = result.map(function (item) {
          return {
            from: 0,
            open: item.O,
            close: item.C,
            high: item.H,
            low: item.L,
            Volume: item.V,
            to: this.moment(item.T).valueOf()
          }
        }, {moment:moment});
       //  console.log(out);
        return out
      }))
      .toPromise();
//  'oneMin', 'fiveMin', 'thirtyMin, 'hour', 'day'.

  }


  getMarketUrl(base:string, coin: string): string{
    return  'https://bittrex.com/Market/Index?MarketName={{base}}-{{coin}}'
      .replace('{{base}}', base).replace('{{coin}}', coin);
  }

  downloadBooks(base: string, coin: string): Observable<VOBooks> {

    let url =  this.prefix +'https://bittrex.com/api/v1.1/public/getorderbook?type=both&market=' + base + '-' + coin + '&depth=' + 50;
    console.log(url)
    return this.http.get(url).pipe(map((res: any) => {
      let r = (<any>res).result;
      return {
        market: base + '_' + coin,
        exchange: 'bittrex',
        buy: r.buy.map(function (o) {
          return {amountCoin: o.Quantity, rate: o.Rate}
        }),
        sell: r.sell.map(function (o) {
          return {amountCoin: o.Quantity, rate: o.Rate}
        })
      }
    }, console.error));
  }


 /* allCoins: { [coin: string]: { [base: string]: number } };

  async getAllCoins(fromCache = true): Promise<{ [coin: string]: { [base: string]: number } }> {
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
    let url =  this.prefix +'https://bittrex.com/api/v1.1/public/getmarketsummaries';
    console.log(url);

    return this.http.get(url).pipe(map((result: any) => {
      let ar: SOMarketBittrex[] = result.result;
      let bases = [];
      ;

      const allCoins = {};
      const marketsAr = [];
      const indexed = {};
      ar.forEach(function (item: SOMarketBittrex) {

        let ar: string[] = item.MarketName.split('-');
        let market: VOMarket = new VOMarket();
        market.base = ar[0];
        if (bases.indexOf(market.base) === -1) bases.push(market.base);
        market.coin = ar[1];
        market.id = item.MarketName;
        market.exchange = 'bittrex';
        market.Last = +item.Last;
        market.high = +item.High;
        market.low = +item.Low;
        market.Ask = +item.Ask;
        market.Bid = +item.Bid;
        market.BaseVolume = +item.BaseVolume;
        market.PrevDay = item.PrevDay;
        market.OpenBuyOrders = item.OpenBuyOrders;
        market.OpenSellOrders = item.OpenSellOrders;
        indexed[market.base + '_' + market.coin] = market;
        marketsAr.push(market);

        if (!allCoins[market.coin]) allCoins[market.coin] = {};
        allCoins[market.coin][market.base] = +item.Last;
      })
      this.allCoins = allCoins;
      // console.log(marketsAr);
      return indexed;
    }));
  }


  downloadMarketHistory(base: string, coin: string) {

    let market = base + '-' + coin;
    let url =  this.prefix + 'https://bittrex.com/api/v1.1/public/getmarkethistory?market=' + market;
    console.log(url);

    return this.http.get(url).pipe(map((res: any) => {
      return (<any>res).result.map(function (item: any) {

        let time = (new Date(item.TimeStamp + 'Z'));

        return {
          action: item.OrderType,
          uuid: item.Id,
          exchange: 'bittrex',
          rate: item.Price,
          amountBase: +item.Total,
          amountCoin: +item.Quantity,
          coin: coin,
          base: base,
          timestamp: time.getTime(),
          date: item.TimeStamp,
          minutes: time.getMinutes() + ':' + time.getSeconds(),
          local: time.toLocaleTimeString()
        }
      });

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
