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
import {MCdata, VOCoinsDayData, VOMarketCapSelected, VOMCData, VOMCObj} from '../models/api-models';
import {VOMovingAvg} from '../com/moving-average';


@Injectable()
export class ApiMarketCapService {
  static instance: ApiMarketCapService;

  static MC: { [symbol: string]: VOMarketCap };
  // private data: { [symbol: string]: VOMarketCap };
 //  private agrigatedSub: BehaviorSubjectMy<{ [symbol: string]: VOMCAgregated }> = new BehaviorSubjectMy();
  private tikerSub: BehaviorSubjectMy<{ [symbol: string]: VOMarketCap }> = new BehaviorSubjectMy();

  private coinsDay: VOCoinsDayData;

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {
    ApiMarketCapService.instance = this;
  }

  async getCoin(symbol: string): Promise<VOMarketCap> {
    const data = await this.getTicker();
    return data[symbol]
  }

  getTicker30Min(limit = 4): Observable<VOMCObj[]> {
    const url = 'http://localhost:50001/cmc-mongo/30-min/last/' + limit;
    console.log(url);
    return this.http.get(url).map((res: any) => res.data);
  }

  getTickerHours(limit = 4): Observable<VOMCObj[]> {
    const url = 'http://localhost:50001/cmc-mongo/hours/last/' + limit;
    console.log(url);
    return this.http.get(url).map((res: any) => res.data);
  }

 /* downloadCoinsDayHours30(): Observable<{ [symbol: string]: VOMCData[] }> {
    const url = '/api/proxy-http/crypto.aesoft.ca:49890/mc-hour-30';
    console.log(url);
    return this.http.get(url).map((res: any) => {
      const headers = res.headers;
      const data = res.data;
      const out: { [symbol: string]: VOMCData[] } = {};
      for (let str in data) {
        out[str] = data[str].map(function (item) {
          return item?{
            rank: item[0],
            price_btc: item[1],
            price_usd: item[2],
            volume_24h: item[3],
            market_cap_usd: item[4],
            available_supply: item[5],
            total_supply: item[5],
            max_supply: item[7]
          }:null;
        })
      }
      return out;
    })
  }*/

 /* getCoinsDay(): Promise<VOCoinsDayData> {
    const url = '/api/proxy-http/crypto.aesoft.ca:49890/coin-day-all/0';
    console.log(url);
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
  }*/


  static mapDataMC(data: any[]) {
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
    });
    return out;
  }

  refreshTicker() {
    this.downloadTicker().subscribe(res => {
      let current = 0
      const cur = this.tikerSub.getValue();
      if (cur) current = cur['BTC'].last_updated;
      const timestamp = res['BTC'].last_updated;
      if (timestamp !== current) {
        console.log(' new marketcap ' + moment(timestamp * 1000).format('HH:mm'));
        this.tikerSub.next(res)
      }
    });
  }

  tikerInterval;

  ticker$(): Observable<{ [symbol: string]: VOMarketCap }> {
    if (!this.tikerInterval) {
      this.tikerInterval = setInterval(() => this.refreshTicker(), 3 * 60 * 1000);
      this.refreshTicker();
    }
    return this.tikerSub.asObservable();
  }

  tickerGet$;

  downloadTicker(): Observable<{ [symbol: string]: VOMarketCap }> {
    let url = '/api/marketcap/ticker';
    // const url = '/api/proxy-http/crypto.aesoft.ca:49890/market-cap';
    console.log('%c TICKER ' + url, 'color:blue');
    if (this.tickerGet$) return this.tickerGet$;
    this.tickerGet$ = this.http.get(url).map((res: any[]) => {
      console.log('%c TICKER MAP ' + url, 'color:blue');
      return ApiMarketCapService.mapDataMC(res);
    }).share();
    return this.tickerGet$
  }


 /* agregated$(): Observable<{ [symbol: string]: VOMCAgregated }> {
    return this.agrigatedSub.asObservable();
  }*/

  private coinsAr: VOMarketCapSelected[];

  async getCoinsArWithSelected(): Promise<VOMarketCapSelected[]> {
    if (this.coinsAr) return Promise.resolve(this.coinsAr);
    return new Promise<VOMarketCapSelected[]>(async (resolve, reject) => {
      const selected = await this.storage.getSelectedMC();
      const sub = this.ticker$().subscribe(data => {
        selected.forEach(function (item) {
          if(!!data[item]) data[item].selected = true;
        });
        this.coinsAr = <VOMarketCapSelected[]>Object.values(data);
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


  getTicker(): Promise<VOMCObj> {
    const data = this.tikerSub.getValue();
    if (data) return Promise.resolve(data);
    return this.downloadTicker().toPromise();
  }

  // private agrigated;
 // private agrigatedData;
 // private agrigatedTimestamp: number = 0;
 //  private isLoading: boolean;

/*

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
*/
/*

  downloadOneRecord(before: string, after?: string,): Observable<{ createdAt: string; data: { [symbol: string]: VOMarketCap } }> {
    const q = before ? 'before=' + before : 'after=' + after;
    const url = '/api/front-desk/market-cap/one-record?' + q;
    console.log(url);
    return this.http.get(url).map((res: any) => {
      res.data = ApiMarketCapService.mapDataMC(res.data || []);
      return res;

    });
  }
*/

/*  download2Recors(before1: string, before2: string) {

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
    /!*.map(res =>{
          console.log(res);
        }).subscribe(res =>{
         // console.log(res)
        })*!/


  }*/

  /* downloadHistoryForLast3Hours(length: number = 11): Observable<{ [coin: string]: VOMarketCap[] }> {
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
 */

  // uplight.ca API //////////////////////////////////////////////////////////////////
  getCoinLongHistory(coin: string) {
    const now = moment().toISOString();
    const ago50H = moment().subtract(500, 'hours').toISOString();
    return this.getCoinHistory5Hours(coin, ago50H, now);
  }

  getCoinHistory5Hours(coin: string, from: string, to: string): Observable<VOMCObj[]> {
    if (!coin) throw new Error(' no coin');
    const url = 'http://uplight.ca:50001/cmc-mongo/5-hours/coin-history/:symbol/:from/:to'
      .replace(':symbol', coin).replace(':from', from).replace(':to', to);
    console.log(url);
    return this.http.get(url).map((res: any) => res.data);
  }

  get30MinLast(): Observable<VOMCObj[]> {

    const url = 'http://uplight.ca:50001/cmc-mongo/30-mins/last/1';
    console.log(url);
    return this.http.get(url).map((res: any) => res.data);
  }

  getCoinHistory(coin: string, from: string, to: string): Observable<VOMCObj[]> {
    if (!coin) throw new Error(' no coin');
    const url = 'http://uplight.ca:50001/cmc-mongo/30-mins/coin-history/:symbol/:from/:to'
      .replace(':symbol', coin).replace(':from', from).replace(':to', to);
    console.log(url);
    return this.http.get(url).map((res: any) => res.data);
  }
//////////////////////////////////////////////////////////////////////////////////////////////////
  /*  getCoinDay(coin: string, from: string, to: string) {
      const url = '/api/front-desk/market-cap-coin-day?coin=' + coin + '&from=' + from + '&to=' + to;
      return this.http.get(url).map(Parsers.mapDataCharts);
    }*/

//  private refreshInterval;

  /*startAutoRefresh() {
    if (this.refreshInterval) return
    this.refreshInterval = setInterval(() => {
      this.refreshAgrigated(0);
    }, 6 * 60 * 1000)
  }*/

 /* stopAutoRefresh() {
    clearInterval(this.refreshInterval);
    this.refreshInterval = 0;
  }*/


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