import {Injectable} from '@angular/core';
import {MarketCapService} from "../market-cap/market-cap.service";
import {HttpClient} from "@angular/common/http";
import {VOMarketCap, VOMarketCapExt} from "../models/app-models";
import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/concat";
import * as _ from 'lodash';
import "rxjs/add/operator/share";
import {Subject} from "rxjs/Subject";


interface MCdata {
  id: string;
  usd: number;
  btc: number;
  rank: number;
  rP: number;
  vol: number;
  vol_1h: number;
  vol_3h: number;
  vol_6h: number;
  h05: number;
  h1: number;
  t: number;
  n: string;
  data: number[];
  price_btcs: number[];
  prev?
}


export interface VOMCAgregated {
  symbol: string;
  id: string;
  price_btc: number;
  price_usd: number;
  tobtc_last: number;

  tobtc_change_05h: number;
  tobtc_change_1h: number;
  tobtc_change_2h: number;
  tobtc_change_3h: number;

  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;

  rankPrev: number;
  rank: number;
  timestamp: number;
  volume: number;
  vol_1h: number;
  vol_3h: number;
  vol_6h: number;
  prev: number;
  last5: number;
  last10: number
  last20: number;
  ago2h: number;
  last30: number;
  ago3h: number;
  date: string;
  total_supply?: number;
}

export const VOMCAGREGATED: VOMCAgregated = {
  symbol: '',
  id: '',
  price_btc: 0,
  price_usd: 0,
  tobtc_last: 0,

  tobtc_change_05h: 0,
  tobtc_change_1h: 0,
  tobtc_change_2h: 0,
  tobtc_change_3h: 0,

  percent_change_1h: 0,
  percent_change_24h: 0,
  percent_change_7d: 0,

  rankPrev: 0,
  rank: 0,
  timestamp: 0,
  volume: 0,
  vol_1h: 0,
  vol_3h: 0,
  vol_6h: 0,
  prev: 0,
  last5: 0,
  last10: 0,
  last20: 0,
  ago2h: 0,
  last30: 0,
  ago3h: 0,
  date: ''
}

@Injectable()
export class ApiMarketCapService {

  static mapServerValues(data: { [id: string]: MCdata }): { [symbol: string]: VOMarketCap } {
    let MC: { [symbol: string]: VOMarketCap } = {};

    const percent_change_1h = data['BTC'].h1;
    const percent_change_24h = data['BTC'].data[0];
    const percent_change_7d = data['BTC'].data[1];

    for (let str in data) {
      const item: MCdata = data[str];
      if (item.data) {
        MC[str] = {
          id: item.id,
          symbol: str,
          name: item.n,
          rank: item.rank,
          price_usd: item.usd,
          price_btc: item.btc,
          percent_change_1h: item.h1,
          percent_change_24h: +item.data[0],
          percent_change_7d: +item.data[1],
          tobtc_change_1h: +(item.h1 - percent_change_1h).toFixed(2),
          tobtc_change_24h: +(+item.data[0] - percent_change_24h).toFixed(2),
          tobtc_change_7d: +(+item.data[1] - percent_change_7d).toFixed(2),
          volume_usd_24h: item.vol,
          //volumePrev:item.volP,
          market_cap_usd: item.data[2],
          available_supply: item.data[3],
          total_supply: item.data[4],
          max_supply: item.data[5],
          last_updated: item.t
        }
      }
    }
    return MC;
  }


  static mapAgrigated(item: MCdata, symbol: string): VOMCAgregated {
    const price_btcs = item.price_btcs || item.prev
    const price_btc = item.btc,
      prev = price_btcs[0],
      last5 = price_btcs[1],
      last10 = price_btcs[2],
      last20 = price_btcs[3],
      ago2h = price_btcs[4],
      last30 = price_btcs[5],
      ago3h = price_btcs[6]


    return {
      date: '',
      symbol: symbol,
      id: item.id,
      price_usd: item.usd,
      price_btc,
      tobtc_last: +(100 * (price_btc - prev) / prev).toFixed(2),
      tobtc_change_05h: +(100 * (last5 - last10) / last10).toFixed(2),
      tobtc_change_1h: +(100 * (last10 - last20) / last20).toFixed(2),
      tobtc_change_2h: +(100 * (last10 - last30) / last30).toFixed(2),
      tobtc_change_3h: +(100 * (last10 - ago3h) / ago3h).toFixed(2),

      total_supply:item.data[4],

      percent_change_1h: item.h1,
      percent_change_24h: item.data[0],
      percent_change_7d: item.data[1],
      rank: item.rank,
      rankPrev: item.rP,
      timestamp: item.t * 1000,
      volume: item.vol,
      vol_1h: item.vol_1h,
      vol_3h: item.vol_3h,
      vol_6h: item.vol_6h,
      prev,
      last5,
      last10,
      last20,
      ago2h,
      last30,
      ago3h
    }
  }

  static MC: { [symbol: string]: VOMarketCap };

  constructor(private http: HttpClient) {
  }

  async getCoin(symbol: string): Promise<VOMarketCap> {
    if (ApiMarketCapService.MC) return Promise.resolve(ApiMarketCapService.MC[symbol]);
    return this.downloadTicker().toPromise().then(res => ApiMarketCapService.MC[symbol])
  }

  downloadTicker(refresh = false): Observable<{ [symbol: string]: VOMarketCap }> {
    if (!refresh && ApiMarketCapService.MC) return Observable.of(ApiMarketCapService.MC);
    let url = '/api/marketcap/ticker';
    console.log('%c ' + url, 'color:pink');
    return this.http.get(url).share().map((res: { [id: string]: MCdata }) => {
      let MC = ApiMarketCapService.mapServerValues(res);
      ApiMarketCapService.MC = MC;
      return MC;
    });
  }

  private agrigatedSub: Subject<{ [symbol: string]: VOMCAgregated }> = new Subject();

  agregated$(): Observable<{ [symbol: string]: VOMCAgregated }> {
    return this.agrigatedSub.asObservable();
  }

  downloadAgrigated(): Observable<{ [symbol: string]: VOMCAgregated }> {
    let url = '/api/marketcap/agrigated';
    console.log('%c ' + url, 'color:pink');
    return this.http.get(url)
      .share()
      .map((res: { [id: string]: MCdata }) => {
        //  console.log(res);
        const out = {}
        for (let str in res) out[str] = ApiMarketCapService.mapAgrigated(res[str], str);
        this.agrigatedSub.next(out);
        return out;
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

  download2Recors(before1: string, before2: string) {

    const url1 = '/api/front-desk/market-cap/one-record?before=' + before1;
    const url2 = '/api/front-desk/market-cap/one-record?before=' + before2;

    return this.http.get(url1).switchMap((res1: any) => {
        return this.http.get(url2).map((res2: any) => {
          const indexed = _.keyBy(res1.data, 'symbol');
          const out = {stamps: [res1.createdAt, res2.createdAt]};
          res2.data.forEach(function (item: VOMarketCap) {
            if (indexed[item.symbol]) {
              indexed[item.symbol].volume_usd_24h = indexed[item.symbol]['24h_volume_usd'];
              item.volume_usd_24h = item['24h_volume_usd'];
              out[item.symbol] = [indexed[item.symbol], item];
            }


          })
          return out;
        })
      }
    )
    /*.map(res =>{
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
    let btc_change_1h = [];

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
