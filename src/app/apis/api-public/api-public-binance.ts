import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {VOBooks, VOMarket, VOOrder} from "../../models/app-models";
import {ApiPublicAbstract} from "./api-public-abstract";
import {StorageService} from "../../services/app-storage.service";
import  * as moment from 'moment';
import {UTILS} from '../../com/utils';
import {VOCandle} from '../../models/api-models';
import {SocketBase} from '../sockets/soket-base';
import {BinanceTradesSocket} from '../sockets/binance-trade-socket';



export class ApiPublicBinance extends ApiPublicAbstract {

  exchange = 'binance';

  constructor(http: HttpClient, storage:StorageService) {
    super(http, storage);
  }

  hasSocket(){
    this.socket = new BinanceTradesSocket();
    return true;
  }
  getMarketUrl(base:string, coin: string): string{
    return 'https://www.binance.com/trade.html?symbol={{coin}}_{{base}}'
      .replace('{{base}}', base).replace('{{coin}}', coin);
  }

  async getCandlesticks(base: string, coin: string, from:number, to:number): Promise<VOCandle[]>{
   const markets = await this.getMarkets();
   if(!markets[base+'_'+coin]) return Promise.resolve([]);
    const params = {
      symbol:coin+base,
      interval:'5m',
      startTime: from,
      endTime: to
    };

    const url = '/api/proxy-1hour/https://api.binance.com/api/v1/klines?'+UTILS.toURLparams(params);
    return this.http.get(url).map((res: any[]) => {
      return res.map(function (item) {
        return {
          from:+item[0],
          to:+item[6],
          Open:+item[1],
          High: +item[2],
          Low: +item[3],
          Close: +item[4],
          Trades: +item[8],
          Volume: +item[5]
        }
      })


    }).toPromise()

  }

  static parseSymbol(symbol: string):{base: string, coin: string} {
    let coin: string;
    let base: string;
    const id: string = symbol;
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
    return {base, coin};
  }

  downloadTicker(): Observable<{ [market: string]: VOMarket }> {
    // const url = '/api/proxy/api.binance.com/api/v3/ticker/price';
    const url = '/api/proxy/api.binance.com/api/v1/ticker/24hr';
    console.log(url);
    return this.http.get(url).map((res: any[]) => {

      const indexed = {};
      const allCoins = {}
      res.forEach(function (item) {

        const market = ApiPublicBinance.parseSymbol(item.symbol);
        const coin = market.coin;
        const base = market.base;
        const id = item.symbol;

        const BaseVolume = 1e10,
          Volume = +item.volume,
          Bid = +item.bidPrice,
          Ask = +item.askPrice,
          High = +item.highPrice,
          Low = +item.lowPrice,
          Last = +item.lastPrice;
        const exchange = 'binance';


        if (!allCoins[coin]) allCoins[coin] = {};
        allCoins[coin][base] = Last;

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
    }, console.error).do(res =>{
      const orders = res.sell;
      UTILS.setDecimals(this.exchange, base, coin, orders);
    });
  }

  downloadMarketHistory(base: string, coin: string): Observable<VOOrder[]> {
    let url = '/api/proxy/api.binance.com/api/v1/trades?symbol={{coin}}{{base}}&limit=200'
      .replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res: any[]) => {

      //console.log(res);
      return res.reverse().map(function (o) {
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

  mapCoinDay(res) {
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

}
