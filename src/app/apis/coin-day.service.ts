import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import * as moment from 'moment';
import {Observable} from "rxjs/Observable";

export interface MarketDay {
  Ask: number[];
  BaseVolume: number[];
  Bid: number[];
  High: number[];
  Last: number[];
  Low: number[];
  OpenBuyOrders?: number[];
  OpenSellOrders?: number[];
  percentChange?: number[];
  Volume: number[];
  stamps: number[];
}


@Injectable()
export class CoinDayService {

  format = '';

  constructor(private http: HttpClient) {

  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////
/*

  static mapHistoryBitfinex(res: any) {
    let ar:any[] = res.data;

    let stamps = [];
    let sells = [];
    let buys = [];
    let totals = [];

    ar.forEach(function (item) {
      if(Array.isArray(item.data)){
        let sell = 0;
        let buy =  0;
        let total = 0;
        item.data.forEach(function (trade:number[]) {
          let amount = trade[2] * trade[3];
          total +=amount;
          amount > 0? buy+=amount: sell+=amount;
        });

        sell = -sell;
        sells.push(sell);
        buys.push(buy);
        totals.push(total);

      }
      stamps.push(item.stamp);
    });
    return {stamps, sells, buys, totals};
  }

  getOrdersHistoryBitfinex(base: string, coin: string, from: string, to: string) {
    return this.http.get('/api/front-desk/bitfinex_USDT_BTC?base=' + base + '&coin=' + coin + '&from=' + from + '&to=' + to).map(CoinDayService.mapHistoryBitfinex);

  }

  static mapHistoryPoloniex(res: any) {
    console.log(res);
    let ar:any[] = res.data;

    let stamps = [];
    let sells = [];
    let buys = [];
    let totals = [];

    ar.forEach(function (item) {
      if(Array.isArray(item.data)){
        let sell = 0;
        let buy =  0;
        let total = 0;
        item.data.forEach(function (trade) {

          let amount = trade.amount * trade.rate;
          if(trade.type ==='sell') amount = -amount;
          total +=amount;
          amount > 0? buy+=amount: sell+=amount;
        });

        sell = -sell;
        sells.push(sell);
        buys.push(buy);
        totals.push(total);

      }
      stamps.push(item.stamp);
    });
    return {stamps, sells, buys, totals};
  }



  getOrdersHistoryPoloniex(base: string, coin: string, from: string, to: string) {
    return this.http.get('/api/front-desk/poloniex_USDT_BTC?base=' + base + '&coin=' + coin + '&from=' + from + '&to=' + to).map(CoinDayService.mapHistoryPoloniex);

  }
*/



  ////////////////////////////////////////////////////////////////////////////////////////////////


/*

  static mapDataMC(res: any) {
    let ar: any[] = res.data;
    let volume_usd_24h = [];
    let available_supply = [];

    let market_cap_usd = [];


    let max_supply = [];
    let percent_change_1h = [];
    let percent_change_24h = [];

    let price_btc = [];

    let price_usd = [];

    let total_supply = [];
    let labels = [];
    let stamps = [];

    ar.forEach(function (item) {

      volume_usd_24h.push(+item['24h_volume_usd']);
      available_supply.push(+item.available_supply);
      market_cap_usd.push(+item.market_cap_usd);
      max_supply.push(+item.max_supply);
      percent_change_1h.push(+item.percent_change_1h);
      percent_change_24h.push(+item.percent_change_24h);
      price_btc.push(+item.price_btc);
      price_usd.push(+item.price_usd);
      total_supply.push(+item.total_supply);
      stamps.push(item.stamp);
      labels.push(' ')
    });

    return {
      volume_usd_24h,
      available_supply,
      market_cap_usd,
      max_supply,
      percent_change_1h,
      percent_change_24h,
      price_btc,
      price_usd,
      total_supply,
      labels,
      stamps
    }

  }

  getCoinDayMarketCap(coin: string, from: string, to: string) {

    return this.http.get('/api/front-desk/market-cap-history?coin=' + coin + '&from=' + from + '&to=' + to).map(CoinDayService.mapDataMC);
  }
*/


/*
  static mapDataBittrex(res: any) {

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

  getCoinDayBittrex(base: string, coin: string, from: string, to: string):Observable<MarketDay> {
    return this.http.get('/api/front-desk/bittrex-history?base=' + base + '&coin=' + coin + '&from=' + from + '&to=' + to).map(CoinDayService.mapDataBittrex);
  }
*/


 /* static mapDataPoloniex(res){

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

      Ask.push(+item.lowestAsk);
      BaseVolume.push(+item.baseVolume);
      Bid.push(+item.highestBid);
      High.push(+item.high24hr);
      Last.push(+item.last);
      Low.push(+item.low24hr);
      percentChange.push(+item.percentChange);
      Volume.push(+item.quoteVolume);
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

  getCoinDayPoloniex(base: string, coin: string, from: string, to: string) {
    return this.http.get('/api/front-desk/poloniex-history?base=' + base + '&coin=' + coin + '&from=' + from + '&to=' + to).map(CoinDayService.mapDataPoloniex);

  }*/

/////////////////////////////////////////

/*
  static mapDataBitfinex(res){

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
      Bid.push(+item[1]);
      OpenBuyOrders.push(+item[2]);
      Ask.push(+item[3]);
      OpenSellOrders.push(+item[4]);
      percentChange.push(+item[6]);
      Last.push(+item[7]);
      Volume.push(+item[9]);
      High.push(+item[9]);
      Low.push(+item[10]);
      stamps.push(item[11]);
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


  getCoinDayBitfinex(base: string, coin: string, from: string, to: string) {
    return this.http.get('/api/front-desk/bitfinex-history?base=' + base + '&coin=' + coin + '&from=' + from + '&to=' + to).map(CoinDayService.mapDataBitfinex);

  }


  static mapDataBinance(res){

    console.log(res);
    let ar: any[] = res.data;

    let Ask = [];
    let BaseVolume = [];

    let Bid = [];
*/


   /* let High = [];
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

  getCoinDayBinance(base: string, coin: string, from: string, to: string) {
    return this.http.get('/api/front-desk/binance-history?base=' + base + '&coin=' + coin + '&from=' + from + '&to=' + to).map(CoinDayService.mapDataBinance);

  }*/

 /* static mapDataHitbtc(res){

    console.log(res);
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

  getCoinDayHitbtc(base: string, coin: string, from: string, to: string) {
    return this.http.get('/api/front-desk/hitbtc-history?base=' + base + '&coin=' + coin + '&from=' + from + '&to=' + to).map(CoinDayService.mapDataHitbtc);

  }*/

 /* static mapDataCryptopia(res){

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
    }
  }

  getCoinDayCryptopia(base: string, coin: string, from: string, to: string) {
    return this.http.get('/api/front-desk/cryptopia-history?base=' + base + '&coin=' + coin + '&from=' + from + '&to=' + to).map(CoinDayService.mapDataCryptopia);

  }
*/

}
