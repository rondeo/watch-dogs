import {HttpClient} from "@angular/common/http";

export class ApiPublicOkex{
  exchange = 'okex';
  constructor(private http:HttpClient){

  }


  downloadMarketHistoryForPeriod(base:string, coin:string, periodMin:number, resolutionMin:number){

    return null

  }

  downloadTrades(base:string, coin:string) {
    let url = '/api/proxy/www.okex.com/api/v1/trades.do?symbol={{coin}}_{{base}}&limit=300'.replace('{{base}}', base.toLowerCase()).replace('{{coin}}', coin.toLowerCase());
    console.log(url);
    return this.http.get(url).map((res:any[]) => {

      console.log(res);
      return res.map(function (o) {
        return {
          uuid:o.tid,
          isOpen:false,
          base:base,
          coin:coin,
          exchange:'okex',
          action:o.type.toUpperCase(),
          timestamp:o.date_ms,
          amountCoin:o.amount,
          rate:o.price
        }
      })
    });
  }
}