import {HttpClient} from "@angular/common/http";

export class HttpConnector{

  constructor(private http:HttpClient){

  }

  downloadTrades(base:string, coin:string) {
    let url = 'https://api.bitfinex.com/v2/trades/t{{coin}}{{base}}/hist'.replace('{{base}}', base).replace('{{coin}}', coin);
    return this.http.get(url).map((res:any[]) => {

      return res.map(function (o) {
        return {
          id:o[0],
          action:o[2] < 0?'SELL':'BUY',
          timestamp:o[1],
          amount:Math.abs(o[2]),
          rate:o[3]
        }
      })
    });
  }
}