import {Injectable} from '@angular/core';
import {MarketCapService} from "../market-cap/market-cap.service";
import {HttpClient} from "@angular/common/http";
import {VOMarketCap} from "../models/app-models";
import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/concat";
import * as _ from 'lodash';




@Injectable()
export class ApiMarketCapService {

  static MC: { [symbol: string]: VOMarketCap };

  constructor(private http: HttpClient) {
  }

  async getCoin(symbol: string): Promise<VOMarketCap> {
    if (ApiMarketCapService.MC) return Promise.resolve(ApiMarketCapService.MC[symbol]);
    return this.downloadTicker().toPromise().then(res => ApiMarketCapService.MC[symbol])
  }

  downloadTicker() {
    let url = '/api/marketcap/ticker';
    console.log('%c ' + url, 'color:pink');
    return this.http.get(url).map((res: any) => {
      let MC = MarketCapService.mapServerValues(Object.values(res));
      ApiMarketCapService.MC = MC;
      return MC;
    });
  }

  downloadOneRecord(after: string, before: string,): Observable<{ createdAt: string; data: { [symbol: string]: VOMarketCap } }> {
    const q = before ? 'before=' + before : 'after=' + after;
    const url = '/api/front-desk/market-cap/one-record?' + q;
    console.log(url);
    return this.http.get(url).map((res: any) => {
      res.data = ApiMarketCapService.mapDataMC(res.data || []);
      return res;

    });
  }
  download2Recors(before1:string,before2:string ){

    const url1 = '/api/front-desk/market-cap/one-record?before=' + before1;
    const url2 = '/api/front-desk/market-cap/one-record?before=' + before2;

      return this.http.get(url1).switchMap((res1: any) =>{
        return  this.http.get(url2).map((res2: any)=>{
         const indexed = _.keyBy(res1.data, 'symbol');
         const out ={stamps:[res1.createdAt, res2.createdAt]};
         res2.data.forEach(function (item:VOMarketCap) {
           if(indexed[item.symbol]){
             indexed[item.symbol].volume_usd_24h =  indexed[item.symbol]['24h_volume_usd'];
             item.volume_usd_24h = item['24h_volume_usd'];
             out[item.symbol] = [indexed[item.symbol], item];
           }


         })
          return out;
        })
      }

    )/*.map(res =>{
      console.log(res);
    }).subscribe(res =>{
     // console.log(res)
    })*/



  }

  downloadHistoryForLast3Hours(length: number = 11): Observable<{ [coin: string]: VOMarketCap[] }> {
    let url = '/api/marketcap/history/' + length
    console.log(url);
    return this.http.get(url).map((res: any) => {
      // console.log(res);
      const out: { [coin: string]: VOMarketCap[] } = {};
      res.forEach(function (nextValue) {
        for (let str in nextValue) {
          if (!out[str]) out[str] = [];
          out[str].push(ApiMarketCapService.mapMCValue(nextValue[str]));
        }
      })
      return out;
    });
  }



  getCoinDay(coin: string, from: string, to: string) {
    const url = '/api/front-desk/market-cap-coin-day?coin=' + coin + '&from=' + from + '&to=' + to;
    return this.http.get(url).map(ApiMarketCapService.mapDataCharts);
  }

  /*  getCoinHistoryLastRecords(coin: string, limit: number) {
      // from=2018-03-18T10:00:00&to=2018-03-18T10:00:0
      let url = 'api/front-desk/market-cap-history?coin=' + coin + '&limit=' + limit;
      return this.http.get(url).map(ApiMarketCapService.mapDataCharts);
    }*/

  static mapMCValue(item) {
    return {
      id: item[0],
      name: item[1],
      symbol: item[2],
      rank: item[3],
      price_usd: item[4],
      price_btc: item[5],
      percent_change_1h: item[6],
      percent_change_24h: item[7],
      percent_change_7d: item[8],
      volume_usd_24h: item[9],
      market_cap_usd: item[10],
      available_supply: item[11],
      total_supply: item[12],
      max_supply: item[13],
      last_updated: item[14]
    }
  }

  static mapDataCharts(res: any) {
    let ar: any[] = res.data
    let volume_usd_24h = [];
    let available_supply = [];
    let market_cap_usd = [];
    let max_supply = [];


    let percent_change_1h = [];
    let btc_change_1h =[];

    let tobtc_change_1h = [];

    let tobtc_change_24h = [];



    let percent_change_24h = [];
    let price_btc = [];
    let price_usd = [];
    let total_supply = [];
    let labels = [];
    let stamps = [];


    ar.forEach(function (item) {

      volume_usd_24h.push(+item['24h_volume_usd']);
      available_supply.push(+item.available_supply);
      market_cap_usd.push(+item.market_cap_usd);
      max_supply.push(+item.max_supply);

      percent_change_24h.push(+item.percent_change_24h);
      price_btc.push(+item.price_btc);
      price_usd.push(+item.price_usd);


      percent_change_1h.push(+item.percent_change_1h);
      btc_change_1h.push(+item.btc_change_1h);
      tobtc_change_1h.push(+item.percent_change_1h - +item.btc_change_1h);


      tobtc_change_24h.push(+item.percent_change_24h - +item.btc_change_24h);

      total_supply.push(+item.total_supply);
      stamps.push(item.stamp);
      labels.push(' ')
    });

    return {
      volume_usd_24h,
      available_supply,
      market_cap_usd,
      max_supply,
      percent_change_1h,
      percent_change_24h,
      price_btc,
      price_usd,
      tobtc_change_1h,
      tobtc_change_24h,
      btc_change_1h,

      total_supply,
      labels,
      stamps
    }

  }

  static mapDataMC(data: any) {
    const out = {};
    data.forEach(function (item) {
      if (!out[item.symbol]) out[item.symbol] = {
        id: item.id,
        name: item.name,
        symbol: item.symbol,
        rank: +item.rank,
        price_usd: +item.price_usd,
        price_btc: +item.price_btc,
        volume_usd_24h: +item['24h_volume_usd'],
        market_cap_usd: +item.market_cap_usd,
        available_supply: +item.available_supply,
        total_supply: +item.total_supply,
        max_supply: +item.max_supply,
        percent_change_1h: +item.percent_change_1h,
        percent_change_24h: +item.percent_change_24h,
        percent_change_7d: +item.percent_change_7d,
        last_updated: item.last_updated,
        stamp: item.stamp
      }
    })
    return out;
  }


}
