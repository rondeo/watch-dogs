import {VOMarketCap} from '../../models/app-models';



export class RunScript {
  static runScriptSell (newValue: any, script: string) {
    let results: string[] = [];

    let SELL = function (text) {
      results.push(text);
    };

    let old_percent_change_1h: number, old_percent_change_24h: number, old_percent_change_7d: number, old_price_usd: number,
      percent_change_1h: number, percent_change_24h: number, percent_change_7d: number, price_usd: number;


   /* old_percent_change_1h = oldValue.percent_change_1h;
    old_percent_change_24h = oldValue.percent_change_24h;
    old_percent_change_7d = oldValue.percent_change_7d;
    old_price_usd = oldValue.price_usd;*/

    percent_change_1h = newValue.percent_change_1h;
    percent_change_24h = newValue.percent_change_24h;
    percent_change_7d = newValue.percent_change_7d;
    price_usd = newValue.price_usd;


   //  eval(script);
    return results;
  }
}
