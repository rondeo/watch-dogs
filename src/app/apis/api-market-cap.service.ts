import {Injectable} from '@angular/core';
import {MarketCapService} from '../market-cap/services/market-cap.service';
import {HttpClient} from '@angular/common/http';
import {VOMarketCap, VOMarketCapExt} from '../models/app-models';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/concat';
import * as _ from 'lodash';
import 'rxjs/add/operator/share';
import {Subject} from 'rxjs/Subject';
import {StorageService} from '../services/app-storage.service';
import {Parsers} from './parsers';
import * as moment from 'moment';
import {clearInterval} from 'timers';
import {BehaviorSubjectMy} from '../com/behavior-subject-my';
import {Subscription} from 'rxjs/Subscription';
import {MCdata, VOCoinsDayData, VOCoinWeek, VOMC, VOMCAgregated, VOMCObj} from '../models/api-models';
import {VOMovingAvg} from '../com/moving-average';



@Injectable()
export class ApiMarketCapService {
  static instance: ApiMarketCapService;

  static MC: { [symbol: string]: VOMarketCap };
  private data: { [symbol: string]: VOMarketCap };
  private agrigatedSub: BehaviorSubjectMy<{ [symbol: string]: VOMCAgregated }> = new BehaviorSubjectMy(null);

  private coinsDay: VOCoinsDayData;

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {
    ApiMarketCapService.instance = this;
  }

  async getCoin(symbol: string): Promise<VOMarketCap> {
    if (this.data) return Promise.resolve(this.data[symbol]);
    return this.getData().then(res => res[symbol]);
  }


  getCoinsDay(): Promise<VOCoinsDayData> {
    const url = '/api/proxy-http/crypto.aesoft.ca:49890/coin-day-all';
    return this.http.get(url, {observe: 'response'}).map((res: any) => {

      //   console.log(res.headers.get('last-modified'));
      // console.warn(res.headers.keys());
      //  console.log(res);
      const payload = res.body;
      const out = {};
      const timestams = [];
      for (const index in payload) {
        if (index !== 'timestamp') {
          let dataAr: number[] = payload[index];
          out[index] = dataAr.map(function (item) {
            if (item) {
              return {
                volume: item[0],
                price_btc: item[1],
                rank: item[2]
              }
            }
            return null;
          })
        }
      }
      return out;
    }).toPromise();
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

  ticker$;
  downloadTicker(): Observable<{ [symbol: string]: VOMarketCap }> {  ;
    //let url = '/api/marketcap/ticker';
    const url = '/api/proxy-http/crypto.aesoft.ca:49890/market-cap';
    console.log('%c TICKER ' + url, 'color:blue');
    this.ticker$ =  this.http.get(url).map((res: any[]) => {
      return ApiMarketCapService.mapDataMC(res);
    }).share();
    return this.ticker$
  }


  agregated$(): Observable<{ [symbol: string]: VOMCAgregated }> {
    return this.agrigatedSub.asObservable();
  }

  private coinsAr: VOMC[];

  async getCoinsArWithSelected(): Promise<VOMC[]> {
    if (this.coinsAr) return Promise.resolve(this.coinsAr);
    return new Promise<VOMC[]>(async (resolve, reject) => {
      const selected = await this.storage.getSelectedMC();
      const sub = this.getAgregated(0).subscribe(data => {
        selected.forEach(function (item) {
          data[item].selected = true;
        });
        this.coinsAr = <VOMC[]>Object.values(data);
        resolve(this.coinsAr)
      }, reject);

    });
  }

  /* async getDataWithRankChange(): Promise<VOMCObj> {
     if (this.data && this.data['BTC'].rankChange24h) return Promise.resolve(this.data);
     const result = await this.downloadOneRecord(moment().subtract(1, 'd').format()).toPromise();
     console.log('day ago ' + result.createdAt);
     const oldMC = result.data;
     const newMC = await this.getData();
     Object.values(newMC).forEach(function (item) {
       if (!!oldMC[item.symbol]) {
         const rankOld: number = oldMC[item.symbol].rank;
         item.rank24h = rankOld;
         item.rankChange24h = +(100 * (rankOld - item.rank) / rankOld).toFixed(2);
       }
     });
     return newMC;
   }*/

  getData(): Promise<{[symbol: string]: VOMarketCap}> {
    if (this.data) return Promise.resolve(this.data);
    return this.downloadTicker().do(data => this.data = _.keyBy(data, 'symbol')).toPromise();
  }

  private agrigated;
  private agrigatedData;
  private agrigatedTimestamp: number = 0;
  private isLoading: boolean;


  getAgregated(fromEnd: number): Observable<{ [symbol: string]: VOMCAgregated }> {
    let url = '/api/marketcap/agrigated/' + fromEnd;
    console.log('%c LOADING agrigated ' + url, 'color:pink');
    return this.http.get(url)
      .map((res: { [id: string]: MCdata }) => {
        const out = {}
        for (let str in res) out[str] = Parsers.mapAgrigated(res[str], str);
        out['USDT'].price_usd = 1;
        return out;
      });
  }

  downloadOneRecord(before: string, after?: string,): Observable<{ createdAt: string; data: { [symbol: string]: VOMarketCap } }> {
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
          out[str].push(Parsers.mapMCValue(nextValue[str]));
        }
      })
      return out;
    });
  }


  getCoinWeek(coin: string): Observable<VOCoinWeek[]> {
    if (!coin) throw new Error(' no coin');
    const url = 'api/marketcap/coin-history/' + coin;
    return this.http.get(url).map((res: any) => {
      console.log(res);


      return res.data
        .map(function (item) {
          if (!item.d) return {
            timestamp: item.t
          }
          return {
            timestamp: item.t,
            price_btc: item.d[0],
            price_usd: item.d[1],
            volume: item.d[2],
            rank: item.d[3],
            total_supply: item.d[4]
          }
        });
    });
  }

  getCoinDay(coin: string, from: string, to: string) {
    const url = '/api/front-desk/market-cap-coin-day?coin=' + coin + '&from=' + from + '&to=' + to;
    return this.http.get(url).map(Parsers.mapDataCharts);
  }

  private refreshInterval;

  /*startAutoRefresh() {
    if (this.refreshInterval) return
    this.refreshInterval = setInterval(() => {
      this.refreshAgrigated(0);
    }, 6 * 60 * 1000)
  }*/

  stopAutoRefresh() {
    clearInterval(this.refreshInterval);
    this.refreshInterval = 0;
  }


}

export interface VOMovingAvgD {
  symbol: string;
  price03hD: number;
  price05hD: number;
  price1hD: number;
  price2hD: number;
  price3hD: number;
  price12hD: number;
  rank12hD: number;
}