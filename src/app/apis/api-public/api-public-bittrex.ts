import {IApiPublic} from "../i-api-public";
import {HttpClient} from "@angular/common/http";
import {VOBooks, VOMarket, VOTrade} from "../../models/app-models";
import {Observable} from "rxjs/Observable";
import {SOMarketBittrex} from "../../models/sos";

export class ApiPublicBittrex implements IApiPublic {

  constructor(private http:HttpClient){

  }

  downloadBooks(base:string, coin:string):Observable<VOBooks>{

    let url = 'api/bittrex/getorderbook/' +base +'-' +coin + '/' + 50;
    console.log(url)
  return this.http.get(url).map((res:any)=>{
      let r = (<any>res).result;
      return {
        market:base+'_'+coin,
        exchange:'bittrex',
        buy:r.buy.map(function (o) { return{  amountCoin:o.Quantity, rate:o.Rate } }),
        sell:r.sell.map(function (o) { return{  amountCoin:o.Quantity, rate:o.Rate } })
      }
    }, console.error);
  }


  allCoins: {[coin:string]:{[base:string]:number}};

  async getAllCoins(): Promise<{[coin:string]:{[base:string]:number}}> {
    if (this.allCoins) return Promise.resolve(this.allCoins);
    else return this.downloadTicker().map(() => this.allCoins).toPromise();
  }

  downloadTicker(): Observable<{[market:string]:VOMarket}> {
    let url = '/api/bittrex/summaries';
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
      return indexed;
    });
  }


  downloadMarketHistory(base:string, coin:string) {

    let market = base + '-' + coin;
    let url = 'api/bittrex/getmarkethistory/' + market;
    console.log(url);

    return this.http.get(url).map((res: any) => {
      return (<any>res).result.map(function (item:any) {

        let time = (new Date(item.TimeStamp + 'Z'));

        return {
          action: item.OrderType,
          uuid: item.Id,
          exchange: 'bittrex',
          rate: item.Price,
          amountBase: +item.Total,
          amountCoin:+item.Quantity,
          coin: coin,
          base: base,
          timestamp: time.getTime(),
          date: item.TimeStamp,
          minutes:time.getMinutes() +':'+ time.getSeconds(),
          local:time.toLocaleTimeString()
        }
      });

    });

  }
}
