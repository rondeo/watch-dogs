import {Observable} from "rxjs/Observable";
import {applyMixins, VOOrder} from "../../my-models";
import {HttpConnector} from "./http-connector";
import {SoketConnector} from "./soket-connector";

import {HttpClient} from "@angular/common/http";
import {Channels, IChannel} from "../socket-models";
import {IApiPublic} from "../api-base";


export class ApiPublicBitfinex  implements IApiPublic{
  exchange = 'bitfinex';
  constructor(private http:HttpClient){

  }


  downloadMarketHistoryForPeriod(base:string, coin:string, periodMin:number, resolutionMin:number){

    return null

  }

  downloadTrades(base:string, coin:string) {
    if(base ==='USDT') base = 'USD';
    let url = 'https://api.bitfinex.com/v2/trades/t{{coin}}{{base}}/hist'.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res:any[]) => {

      return res.map(function (o) {
        return {
          uuid:o[0],
          isOpen:false,
          base:base,
          coin:coin,
          exchange:'bitfinex',
          action:o[2] < 0?'SELL':'BUY',
          timestamp:o[1],
          amountCoin:Math.abs(o[2]),
          rate:o[3]
        }
      })
    });
  }

}

//applyMixins (ApiPublicBitfinex, [HttpConnector, SoketConnector]);