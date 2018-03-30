import {IApiPublic} from "../api-base";
import {HttpClient} from "@angular/common/http";

import {Observable} from "rxjs/Observable";
import {VOMarket} from "../../../../models/app-models";




export class ApiPublicBittrex implements IApiPublic{

  exchange = 'bittrex';

  constructor(private http:HttpClient){

  }

  downloadMarket(base:string, coin:string):Observable<VOMarket>{
    return null
  }


  downloadMarkets():Observable<VOMarket[]>{
    return null
  }

  getCurrency():Promise<string[]>  {

    return null;
  }



  downloadMarketHistoryForPeriod(base:string, coin:string, periodMin:number, resolutionMin:number){

    return null

  }

  downloadTrades(base:string, coin:string) {

    let market = base + '-' + coin;
    let url = 'api/bittrex/getmarkethistory/' + market;
    console.log(url);

    return this.http.get(url).map((res: any) => {
      console.log(res);
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
