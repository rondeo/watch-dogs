import {HttpClient} from "@angular/common/http";
import {IApiPublic} from "../api-base";

export class ApiPublicBinance implements IApiPublic{
  exchange = 'binance';
  constructor(private http:HttpClient){

  }


  downloadMarketHistoryForPeriod(base:string, coin:string, periodMin:number, resolutionMin:number){

    return null

  }

  downloadTrades(base:string, coin:string) {
    let url = '/api/proxy/api.binance.com/api/v1/trades?symbol={{coin}}{{base}}&limit=300'.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res:any[]) => {

      //console.log(res);
      return res.map(function (o) {
        return {
          uuid:o.id,
          isOpen:false,
          base:base,
          coin:coin,
          exchange:'binance',
          action:o.isBuyerMaker?'SELL':'BUY',
          timestamp:o.time,
          amountCoin:+o.qty,
          rate:+o.price
        }
      })
    });
  }

}