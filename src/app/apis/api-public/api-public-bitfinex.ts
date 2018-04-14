import {IApiPublic} from "../i-api-public";
import {HttpClient} from "@angular/common/http";
import {VOBooks, VOMarket, VOTrade} from "../../models/app-models";
import {Observable} from "rxjs/Observable";
import {SOMarketBittrex} from "../../models/sos";
import {Subject} from "rxjs/Subject";
import {from} from "rxjs/observable/from";
import {of} from "rxjs/observable/of";
import {concatMap, delay} from "rxjs/operators";
import {timer} from "rxjs/observable/timer";

export class ApiPublicBitfinex implements IApiPublic {

  constructor(private http: HttpClient) {

  }

  downloadBooks(base: string, coin: string): Observable<VOBooks> {

    const url = '/api/proxy/api.bitfinex.com/v1/book/' + coin +(base === 'USDT'?'USD':base);
    console.log(url)
    return this.http.get(url).map((res: any) => {
      let r = (<any>res);
      return {
        market: base + '_' + coin,
        exchange: 'bitfinex',
        buy: r.bids.map(function (o) {
          return {amountCoin: +o.amount, rate: +o.price}
        }),
        sell: r.asks.map(function (o) {
          return {amountCoin: +o.amount, rate: +o.price}
        })
      }
    }, console.error);
  }


  allCoins: { [coin: string]: { [base: string]: number } };

  async getAllCoins(): Promise<{ [coin: string]: { [base: string]: number } }> {
    if (this.allCoins) return Promise.resolve(this.allCoins);
    else return this.getSymbols().map(() => this.allCoins).toPromise();
  }


 private  getItems(ids: string[]): Observable<any> {
   const url = '/api/proxy/api.bitfinex.com/v1/pubticker/';
    return from(ids).pipe(
      concatMap(id => <Observable<any>> this.http.get(url + id).map(res=>{
        console.log(res);
        return res;

      }).pipe(delay(5000)))
    );
  }

  downloadTicker(): Observable<{ [market: string]: VOMarket }> {
    const sub: Subject<{ [market: string]: VOMarket }> = new Subject();
    this.getSymbols().subscribe(symbols => {
      console.warn(symbols);
      const sub = this.getItems(symbols).subscribe(res =>{
        console.log(res);
      })
      /*of(symbols).pipe(
        concatMap(

        )
      )*/



    })
    return sub.asObservable();
    /*let url = '/api/bittrex/summaries';

    console.log(url);

    return this.http.get(url).map( (result: any) => {
      let ar:SOMarketBittrex[] = result.result;
      let bases =[];;

      const allCoins = {};
      const marketsAr = [];
      const indexed = {};
      ar.forEach(function (item:SOMarketBittrex) {

        let ar:string[] = item.MarketName.split('-');
        let market:VOMarket = new VOMarket();
        market.base = ar[0];
        if (bases.indexOf(market.base) === -1) bases.push(market.base);
        market.coin = ar[1];
        market.id = item.MarketName;
        market.exchange = 'bittrex';
        market.Last = +item.Last;
        market.High = +item.High;
        market.Low = +item.Low;
        market.Ask = +item.Ask;
        market.Bid = +item.Bid;
        market.BaseVolume = +item.BaseVolume;
        market.PrevDay = item.PrevDay;
        market.OpenBuyOrders = item.OpenBuyOrders;
        market.OpenSellOrders = item.OpenSellOrders;
        indexed[market.base + '_' +  market.coin] = market;
        marketsAr.push(market);

        if(!allCoins[market.coin])allCoins[market.coin] = {};
          allCoins[market.coin][market.base] = +item.Last;
      })
      this.allCoins = allCoins;
      // console.log(marketsAr);
      return indexed;*/
    //});
  }

  private getTicker(market: string) {
    const url = '/api/proxy/api.bitfinex.com/v1/pubticker/' + market;
    return this.http.get(url).map(res => {
      console.log(res);
      return res;
    })
  }

  private getSymbols(): Observable<any> {
    let url = '/api/proxy/api.bitfinex.com/v1/symbols';
    console.log(url);
    return this.http.get(url).map((res:string[]) =>{
      const coins = {};
      res.forEach(function (item) {
        const base = item.slice(-3).toUpperCase();
        const coin = item.slice(0,-3).toUpperCase();
        if(!coins[coin]) coins[coin] = {};
        coins[coin][base] = -1;
      });

      this.allCoins = coins;
    });
  }

  downloadMarketHistory(base: string, coin: string) {
    let url = 'https://api.bitfinex.com/v2/trades/t{{coin}}{{base}}/hist'
      .replace('{{base}}', (base === 'USDT'?'USD':base))
      .replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res: any[]) => {

      return res.map(function (o) {
        return {
          uuid: o[0],
          isOpen: false,
          base: base,
          coin: coin,
          exchange: 'bitfinex',
          action: o[2] < 0 ? 'SELL' : 'BUY',
          timestamp: o[1],
          amountCoin: Math.abs(o[2]),
          rate: o[3]
        }
      })
    });

  }
}
