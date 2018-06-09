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


@Injectable()
export class ApiMarketCapService {

  static MC: { [symbol: string]: VOMarketCap };
  private data: { [symbol: string]: VOMCAgregated };
  private agrigatedSub: BehaviorSubjectMy<{ [symbol: string]: VOMCAgregated }> = new BehaviorSubjectMy(null);

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {
  }

  async getCoin(symbol: string): Promise<VOMCAgregated> {
    if(this.data) return Promise.resolve(this.data[symbol]);
    return new Promise<VOMCAgregated>((resolve, reject) =>{
      this.agregated$().subscribe(res =>{
        resolve(this.data[symbol]);
      }, reject);
    })

  }

  downloadTicker(refresh = false): Observable<{ [symbol: string]: VOMarketCap }> {
    if (!refresh && ApiMarketCapService.MC) return Observable.of(ApiMarketCapService.MC);
    let url = '/api/marketcap/ticker';
    console.log('%c TICKER ' + url, 'color:pink');
    return this.http.get(url).share().map((res: { [id: string]: MCdata }) => {
      let MC = Parsers.mapServerValues(res);
      ApiMarketCapService.MC = MC;
      return MC;
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
       const sub = this.agregated$().subscribe(data => {
         selected.forEach(function (item) {
           data[item].selected = true;
         });
         this.coinsAr = <VOMC[]>Object.values(data);
         resolve(this.coinsAr)
       }, reject);

     });
  }



  getData(): Promise<VOMCObj> {
    if(this.data) return Promise.resolve(this.data);
    return new Promise<VOMCObj>(async (resolve, reject) => {
      const sub = this.agregated$().subscribe(resolve, reject);
      setTimeout(()=>sub.unsubscribe(), 30000);
    });
  }

  private agrigated;
  private agrigatedData;
  private agrigatedTimestamp: number = 0;
  private isLoading: boolean;

  private refreshAgrigated(): Subscription {
    if(this.isLoading) return;
    this.isLoading = true;
    let url = '/api/marketcap/agrigated';
    console.log('%c LOADING ' + url, 'color:red');
   return this.getAgregated()
      .subscribe((res) => {
        this.agrigatedTimestamp = res['BTC'].timestamp;
        console.log('%c MC ' + moment(this.agrigatedTimestamp).toLocaleString(), 'color:red');
        this.data = res;
        this.agrigatedSub.next(res);
        this.isLoading = false;
      });
  }

  getAgregated(): Observable<{[symbol: string]:VOMCAgregated}>{
    let url = '/api/marketcap/agrigated';
    console.log('%c LOADING agrigated' + url, 'color:pink');
    return this.http.get(url)
      .map((res: { [id: string]: MCdata }) => {
        const out = {}
        for (let str in res) out[str] = Parsers.mapAgrigated(res[str], str);
        out['USDT'].price_usd = 1;
        return out;
      });
  }

  downloadOneRecord(after: string, before: string,): Observable<{ createdAt: string; data: { [symbol: string]: VOMarketCap } }> {
    const q = before ? 'before=' + before : 'after=' + after;
    const url = '/api/front-desk/market-cap/one-record?' + q;
    console.log(url);
    return this.http.get(url).map((res: any) => {
      res.data = Parsers.mapDataMC(res.data || []);
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
    if(!coin) throw new Error(' no coin');
    const url = 'api/marketcap/coin-history/' + coin;
    return this.http.get(url).map((res: any) => {
       console.log(res);


      return res.data.map(function (item) {
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

  startAutoRefresh() {
    if (this.refreshInterval) return
    this.refreshInterval = setInterval(() => {
      this.refreshAgrigated();
    }, 6 * 60 * 1000)
  }

  stopAutoRefresh() {
    clearInterval(this.refreshInterval);
    this.refreshInterval = 0;
  }

  /*  getCoinHistoryLastRecords(coin: string, limit: number) {
      // from=2018-03-18T10:00:00&to=2018-03-18T10:00:0
      let url = 'api/front-desk/market-cap-history?coin=' + coin + '&limit=' + limit;
      return this.http.get(url).map(ApiMarketCapService.mapDataCharts);
    }*/


}
