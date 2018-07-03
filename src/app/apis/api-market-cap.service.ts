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
import {MCdata, VOCoinData, VOMC, VOMCAgregated, VOMCObj} from '../models/api-models';
import {VOMovingAvg} from '../com/moving-average';

export interface VOCoinsDay {
  [symbol: string]: { price_btc: number; volume: number; rank: number }[]
}

@Injectable()
export class ApiMarketCapService {
  static instance: ApiMarketCapService;

  static MC: { [symbol: string]: VOMarketCap };
  private data: { [symbol: string]: VOMCAgregated };
  private agrigatedSub: BehaviorSubjectMy<{ [symbol: string]: VOMCAgregated }> = new BehaviorSubjectMy(null);

  private coinsDay: VOCoinsDay;

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {
    ApiMarketCapService.instance = this;
  }

  async getCoin(symbol: string): Promise<VOMCAgregated> {
    if (this.data) return Promise.resolve(this.data[symbol]);
    return new Promise<VOMCAgregated>((resolve, reject) => {
      this.agregated$().subscribe(res => {
        resolve(this.data[symbol]);
      }, reject);
    });
  }

  getCoinsDay(isRefresh = false): Promise<VOCoinsDay> {
    if (this.coinsDay && !isRefresh) return Promise.resolve(this.coinsDay);
    const url = '/api/proxy-http/crypto.aesoft.ca:49890/coin-day-all';
    return this.http.get(url).map((res: any) => {
      const payload = res;
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
      ;
      this.coinsDay = out;
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

  ticker;

  downloadTicker(refresh = false): Observable<{ [symbol: string]: VOMarketCap }> {
    if (!refresh && this.ticker) return Observable.of(this.ticker);
    //let url = '/api/marketcap/ticker';
    const url = '/api/proxy-http/crypto.aesoft.ca:49890/market-cap';
    console.log('%c TICKER ' + url, 'color:blue');
    return this.http.get(url).map((res: any[]) => {
      this.ticker = ApiMarketCapService.mapDataMC(res);
      return this.ticker;
    });
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

  getData(): Promise<VOMCObj> {
    if (this.data) return Promise.resolve(this.data);
    return new Promise<VOMCObj>(async (resolve, reject) => {
      const sub = this.getAgregated(0).subscribe(resolve, reject);
      setTimeout(() => sub.unsubscribe(), 30000);
    });
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


  getCoinWeek(coin: string): Observable<VOCoinData[]> {
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

  static async movingAfarageFromCoinDay(coinDay: VOCoinsDay) {
    return new Promise<{
      symbol: string;
      price03hD: number;
      price1hD: number;
      price2hD: number;
      price4hD: number;
      price24hD: number;
      rank24hD: number;
    } []>(function (resolve, reject) {

      const takeRight = _.takeRight;
      const sumBy = _.sumBy;
      const take = _.take;
      const out = [];
      const L = coinDay['BTC'].length - 1;
      const M = Math.round(L / 2);


      for (let coin in coinDay) {
        const values = coinDay[coin];
        const cur = values[L];
        const prev = values[L - 1];

        const l_3 = values.slice(L - 3, L);

        const price03h = +(sumBy(l_3, 'price_btc') / l_3.length);

        // const l_05 = values.slice(L - 5, L);
        // const price05h = +(sumBy(l_05, 'price_btc') / l_05.length).toFixed(12);

        const l_10 = values.slice(L - 10, L);
        const price1h = +(sumBy(l_10, 'price_btc') / l_10.length);

        const l_20 = values.slice(L - 20, L);
        const price2h = +(sumBy(l_20, 'price_btc') / l_20.length);

        const l_40 = values.slice(L - 40, L);
        const price4h = +(sumBy(l_40, 'price_btc') / l_40.length);

        const l_80 = values.slice(L - 80, L);
        const price8h = +(sumBy(l_80, 'price_btc') / l_80.length);


        const price03hD = 100 * (price03h - price1h) / price1h;
        const price1hD = 100 * (price1h - price2h) / price2h;
        const price2hD = 100 * (price2h - price4h) / price4h;
        const price4hD = 100 * (price4h - price8h) / price8h;


        /*  const vol1h = +(sumBy(l_10, 'volume') / 10).toFixed(0);
          const vol1h_ = +(sumBy(l_10_, 'volume') / 10).toFixed(0);

          const vol2h = +(sumBy(l_20, 'volume') / 20).toFixed(0);
          const vol2h_ = +(sumBy(l_20_, 'volume') / 20).toFixed(0);

          const vol3h = +(sumBy(l_30, 'volume') / 30).toFixed(0);
          const vol3h_ = +(sumBy(l_30_, 'volume') / 30).toFixed(0);


    */
        const first10 = values.slice(0, 10);
        const last10 = values.slice(L - 10, L);

        const price1 = (sumBy(first10, 'price_btc') / first10.length);
        const price2 = (sumBy(last10, 'price_btc') / last10.length);


        const price24hD = 100 * (price2 - price1) / price1;

        const rank1 = +(sumBy(first10, 'rank') / first10.length);
        const rank2 = +(sumBy(last10, 'rank') / last10.length);
        const rank24hD = +(100 * (rank1 - rank2) / rank1)

        const rank = cur.rank;
        const price_btc = cur.price_btc;
        out.push({
          symbol: coin,
          price03hD,
          price1hD,
          price2hD,
          price4hD,
          price24hD,
          rank24hD
        })
      }
      resolve(out);
    })
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