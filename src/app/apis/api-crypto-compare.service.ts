import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import * as moment from 'moment';

export interface VOCryptoCompare {
  Id: string;
  Url: string;
  ImageUrl: string;
  'Name': string,
  Symbol: string,
  CoinName: string;
  FullName: string;
  Algorithm: string;
  ProofType: string;
  FullyPremined: string
  TotalCoinSupply: number,
  PreMinedValue: string;
  TotalCoinsFreeFloat: string;
  SortOrder: number;
  Sponsored: boolean;
}


export interface VOHistHour {
  avg: number;
  date: string;
  last: number;
  timestamp: number;
  volumefrom: number;
  volumeto: number;
}

@Injectable()
export class ApiCryptoCompareService {

  private coinList: { [symbol: string]: VOCryptoCompare };

  constructor(
    private http: HttpClient
  ) {

  }

  getSocialStats(symbol: string) {
    return this.getCoinLists().switchMap(coins => {
      console.log(coins[symbol]);
      const url = 'api/proxy-cache-5min/www.cryptocompare.com/api/data/socialstats/?id=' + coins[symbol].Id;
      console.log(url);
      return this.http.get(url).map(res => {
        console.log(res);
        return res
      })
    })
  }

  getCoinLists() {
    const url = 'api/proxy-cache-5min/www.cryptocompare.com/api/data/coinlist';
    if (this.coinList) return Observable.of(this.coinList);
    else return (<any> this.http.get(url)).map(res => {
      this.coinList = res.Data;
      return this.coinList
    })

  }

  getMarkets(base: string, coin: string) {
    const url = 'api/proxy-cache-5min/https://www.cryptocompare.com/api/data/coinsnapshot/?fsym={{coin}}&tsym={{base}}'
      .replace('{{coin}}', coin).replace('{{base}}', base);
    return this.http.get(url).map((res: any) => {
      return res.Data
    })
  }

  getHistoHour(base: string, coin: string, limit = 25): Observable<VOHistHour[]> {
    const url = 'api/proxy-cache-5min/https://min-api.cryptocompare.com/data/histohour?fsym={{coin}}&tsym={{base}}&limit={{limit}}&e=CCCAGG'
      .replace('{{coin}}', coin).replace('{{base}}', base).replace('{{limit}}', String(limit));
    return this.http.get(url).map((res: any) => {
      return res.Data.map(function (item) {
        return {
          date: moment(item.time * 1000).format(),
          timestamp: item.time * 1000,
          last: item.close,
          avg: (item.open + item.close) / 2,
          volumefrom: item.volumefrom,
          volumeto: item.volumeto

        }
      })
    })

  }

  getHistoMinute(base: string, coin: string, limit = 240): Observable<VOHistHour[]> {
    const url = 'api/proxy-cache-5min/https://min-api.cryptocompare.com/data/histominute?fsym={{coin}}&tsym={{base}}&limit={{limit}}&e=CCCAGG&&aggregate=6'
      .replace('{{coin}}', coin).replace('{{base}}', base).replace('{{limit}}', String(limit));
    return this.http.get(url).map((res: any) => {
      return res.Data.map(function (item) {
        return {
          date: moment(item.time * 1000).format(),
          timestamp: item.time * 1000,
          last: item.close,
          avg: (item.open + item.close) / 2,
          volumefrom: item.volumefrom,
          volumeto: item.volumeto

        }
      })
    })

  }

}
