import {Injectable} from '@angular/core';
import {MarketCapService} from "../market-cap/market-cap.service";
import {HttpClient} from "@angular/common/http";
import {VOMarketCap} from "../models/app-models";
import {Observable} from "rxjs/Observable";

@Injectable()
export class ApiMarketCapService {

  constructor(private http: HttpClient) {
  }

  downloadAllCoins() {
    let url = '/api/marketcap/ticker';
    console.log('%c ' + url, 'color:pink');
    return this.http.get(url).map((res: any) => {
      let MC = MarketCapService.mapServerValues(Object.values(res))
      return MC;
    });
  }

  downloadOneRecord(before: string, after:string):Observable<{createdAt:string; data:{[symbol:string]:VOMarketCap}}>{
    const q = before? 'before=' + before:'after=' + after;
    const url = '/api/front-desk/market-cap/one-record?' + q;
    console.log(url);
    return this.http.get(url).map((res: any) =>{
      res.data = ApiMarketCapService.mapDataMC(res.data);
      return res;

    });
  }

  downloadHistoryFromLatHours(length: number = 10):Observable< { [coin: string]: VOMarketCap[] }> {
    let url = '/api/marketcap/history/' + 10;
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

  getCoinDay(coin: string) {
    const url = '/api/front-desk/market-cap/coin-day?coin=' + coin;
    return this.http.get(url).map(res =>{
      return res;
    });
  }

  getCoinHistory(coin: string, from: string, to: string) {
    const url = '/api/front-desk/market-cap-history?coin=' + coin + '&from=' + from + '&to=' + to;
    return this.http.get(url).map(ApiMarketCapService.mapDataCharts);
  }

  getCoinHistoryLast(coin: string, limit: number) {
    // from=2018-03-18T10:00:00&to=2018-03-18T10:00:0
    let url = 'api/front-desk/market-cap-history?coin=' + coin + '&limit=' + limit;
    return this.http.get(url).map(ApiMarketCapService.mapDataCharts);
  }

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
    let ar: any[] = res.data.reverse();
    let volume_usd_24h = [];
    let available_supply = [];
    let market_cap_usd = [];
    let max_supply = [];
    let percent_change_1h = [];
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
      percent_change_1h.push(+item.percent_change_1h);
      percent_change_24h.push(+item.percent_change_24h);
      price_btc.push(+item.price_btc);
      price_usd.push(+item.price_usd);
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
      total_supply,
      labels,
      stamps
    }

  }

  static mapDataMC(data: any) {
    const out = {};
    data.forEach(function (item) {
      if(!out[item.symbol]) out[item.symbol] =  {
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
