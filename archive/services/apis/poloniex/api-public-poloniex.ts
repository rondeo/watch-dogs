import {IApiPublic} from "../api-base";
import {VOMarket, VOOrder} from "../../../../src/app/models/app-models";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs/Observable";

import {SOMarketPoloniex} from "../../../../src/app/models/sos";
import {reject} from "q";
import {Subject} from "rxjs/Subject";

export class ApiPublicPoloniex implements IApiPublic {
  exchange = 'poloniex';

  constructor(private http: HttpClient) {

  }


  downloadMarketHistoryForPeriod(base: string, coin: string, periodMin: number, resolutionMin: number) {
    return null;
  }



  getCurrency(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if(this.marketsAr){
        let ar: string[] = [];
        this.marketsAr.forEach(function (item) {
          if (ar.indexOf(item.coin) === -1) ar.push(item.coin);
        });
        resolve(ar);
      }
      this.downloadMarkets().subscribe(markets => {
        let ar: string[] = [];
        markets.forEach(function (item) {
          if (ar.indexOf(item.coin) === -1) ar.push(item.coin);
        });
        resolve(ar);
      })
    })
  }

  private marketsAr: VOMarket[];

 /* downloadMarkets(): Promise<VOMarket[]> {
    if (this.marketsAr) {
      return new Promise((resolve, reject) => {
        resolve(this.marketsAr);
      })
    } else return this.downloadMarkets().toPromise();
  }
*/
  marketTimestamp: number = 0;

  downloadMarket(base: string, coin: string): Observable<VOMarket> {
    let subj:Subject<VOMarket> = new Subject();
    let market:VOMarket;
    if (Date.now() - this.marketTimestamp > 3 * 60 * 1000){
      this.downloadMarkets().subscribe(res=>{
        this.marketTimestamp = Date.now();

        market = this.marketsAr.find(function (item) {
          return item.coin ===coin && item.base === base;
        });
        subj.next(market)
      })

    }else {
      setTimeout( ()=> {
        market = this.marketsAr.find(function (item) {
          return item.coin ===coin && item.base === base;
        })
        subj.next(market)
      }, 100)
    }


    return subj.asObservable();

  }


 // private marketTicker:{[market:string]:VOMarket};

  downloadMarkets():Observable<VOMarket[]>{
    let url  = 'https://poloniex.com/public?command=returnTicker';
    console.log(url);

    return this.http.get(url).map(result=>{

      let marketsAr:VOMarket[] = [];
      let i = 0;
      for (let str in result) {
        i++;
        let data = result[str];

        let ar: string[] = str.split('_');
        let market = {
          base:ar[0],
          coin:ar[1],
          pair : str,
          id : str,
          exchange :'poloniex',
          Volume:+data.quoteVolume,
          Last : +data.last,
          high : +data.high24hr,
          low :+data.low24hr,
          Ask : +data.lowestAsk,
          Bid : +data.highestBid,
          BaseVolume : +data.baseVolume,
          disabled :data.isFrozen !=='0',
          PrevDay :(+data.high24hr + +data.low24hr) / 2
      };
        marketsAr.push(market);
      }
      return marketsAr;
    }).do(markets=>this.marketsAr = markets);
  }



  downloadTrades(base:string, coin:string):Observable<VOOrder[]> {

    let url = 'https://poloniex.com/public?command=returnTradeHistory&currencyPair={{base}}_{{coin}}';
    url =  url.replace('{{base}}', base).replace('{{coin}}', coin);
     console.log(url)
    return this.http.get(url).map((res:any)=>{
      // console.log(res);

      return res.map(function(item) {
        let time = (new Date(item.date.split(' ').join('T')+'Z'));
        return {
          action:item.type.toUpperCase(),
          isOpen:false,
          uuid: item.tradeID,
          exchange: 'poloniex',
          rate:+item.rate,
          amountCoin:+item.amount,
          amountBase:+item.total,
          base: base,
          coin: coin,
          date:item.date,
          timestamp:time.getTime()
        };
      });

    })
  }
}
