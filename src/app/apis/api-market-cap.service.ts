import {Injectable} from '@angular/core';
import {MarketCapService} from '../market-cap/market-cap.service';
import {HttpClient} from '@angular/common/http';
import {VOMarketCap, VOMarketCapExt} from '../models/app-models';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/concat';
import * as _ from 'lodash';
import 'rxjs/add/operator/share';
import {Subject} from 'rxjs/Subject';
import {StorageService} from '../services/app-storage.service';
import {Parsers} from './parsers';
import {MCdata, VOCoinData, VOMC, VOMCAgregated} from './models';


@Injectable()
export class ApiMarketCapService {

  static MC: { [symbol: string]: VOMarketCap };
  private data: { [symbol: string]: VOMCAgregated };

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {
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
      let MC = Parsers.mapServerValues(res);
      ApiMarketCapService.MC = MC;
      return MC;
    });
  }

  private agrigatedSub: Subject<{ [symbol: string]: VOMCAgregated }> = new Subject();

  agregated$(): Observable<{ [symbol: string]: VOMCAgregated }> {
    return this.agrigatedSub.asObservable();
  }

  private coinsAr: VOMC[];

  getCoinsArWithSelected(): Observable<VOMC[]> {
    if (this.coinsAr) return Observable.of(this.coinsAr);
    else return (<any>this.getData()).switchMap(data => {
      const sub = new Subject<VOMC[]>();
      this.storage.getSelectedMC().then(selected => {
        selected.forEach(function (item) {
          data[item].selected = true;
        });
        console.log(data);
        this.coinsAr = Object.values(data);
        sub.next(this.coinsAr);

      })
      return sub.asObservable()
    })

  }

  getData(): Observable<{ [symbol: string]: VOMCAgregated }> {
    return this.data ? Observable.of(this.data) : this.downloadAgrigated().map(res => this.data = res);
  }

  downloadAgrigated(): Observable<{ [symbol: string]: VOMCAgregated }> {
    let url = '/api/marketcap/agrigated';
    console.log('%c ' + url, 'color:pink');
    return this.http.get(url)
      .share()
      .map((res: { [id: string]: MCdata }) => {
        //  console.log(res);
        const out = {}
        for (let str in res) out[str] = Parsers.mapAgrigated(res[str], str);
        this.agrigatedSub.next(out);
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
    const url = 'api/marketcap/coin-history/' + coin;
    return this.http.get(url).map((res: any) => {
      // console.log(res)


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

  /*  getCoinHistoryLastRecords(coin: string, limit: number) {
      // from=2018-03-18T10:00:00&to=2018-03-18T10:00:0
      let url = 'api/front-desk/market-cap-history?coin=' + coin + '&limit=' + limit;
      return this.http.get(url).map(ApiMarketCapService.mapDataCharts);
    }*/


}
