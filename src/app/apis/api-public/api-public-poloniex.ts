import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {reject} from "q";
import {Subject} from "rxjs/Subject";
import {VOBooks, VOMarket, VOOrder} from "../../models/app-models";
import {ApiPublicAbstract} from "./api-public-abstract";
import {StorageService} from "../../services/app-storage.service";

export class ApiPublicPoloniex extends ApiPublicAbstract{
  exchange = 'poloniex';
  private marketsAr:VOMarket[];

  constructor(http: HttpClient, storage:StorageService) {
    super(http, storage);
  }

  getMarketUrl(base:string, coin: string): string{
    return  'https://poloniex.com/exchange#{{base}}_{{coin}}'
      .replace('{{base}}', base).replace('{{coin}}', coin);
  }

  downloadBooks(base:string, coin:string):Observable<VOBooks>{
    const url = 'https://poloniex.com/public?command=returnOrderBook&currencyPair={{base}}_{{coin}}&depth=100'
      .replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res:any) =>{
      const market = base+'_'+coin;
      const exchange = 'poloniex';
      const buy = res.bids.map(function (item) {
        return{
          amountCoin:+item[1],
          rate:+item[0]
        }
      });

      const sell = res.asks.map(function (item) {
        return{
          amountCoin:+item[1],
          rate:+item[0]
        }
      });

      return {
        buy,
        sell,
        market,
        exchange
      }
    })
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

  downloadTicker():Observable<{[market:string]:VOMarket}>{
    let url  = 'https://poloniex.com/public?command=returnTicker';
    console.log(url);

    return this.http.get(url).map(result=>{

      const allCoins = {}

      let marketsAr:VOMarket[] = [];
      const indexed ={};
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
          // Volume:+data.quoteVolume,
          Last : +data.last,
          High : +data.high24hr,
          Low :+data.low24hr,
          Ask : +data.lowestAsk,
          Bid : +data.highestBid,
          BaseVolume : +data.baseVolume,
          disabled :data.isFrozen !=='0',
          PrevDay :(+data.high24hr + +data.low24hr) / 2
        };
        indexed[ar[0] + '_' + ar[1]] = market;
        marketsAr.push(market);

        if(!allCoins[market.coin])allCoins[market.coin] = {};
        allCoins[market.coin][market.base] =  market.Last;
      }

      this.allCoins = allCoins;
      this.marketsAr = marketsAr;

      return indexed;
    });
  }


  downloadMarketHistory(base:string, coin:string):Observable<VOOrder[]> {
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
}
