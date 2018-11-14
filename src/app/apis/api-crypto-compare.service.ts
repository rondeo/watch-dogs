import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import * as moment from 'moment';
import {MATH} from '../com/math';


export interface VOTweeterAccount{
  Points:number
  account_creation: string;
  favourites: string;
  followers: number;
  following: string;
  link: "https://twitter.com/enjincs"
  lists: number
  name: string;
  statuses: number;
}

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


  getSocialStats(coin: string) {
    const params = {
      coin
    };
    const url = 'api/proxy-1hour/http://uplight.ca/cmc/get-coin-media.php';
    // console.warn(url);
    return this.http.get(url, {params}).map((res: any)=>{
       console.log(res);
      if(!res.from || !res.from.Twitter) return null;
      const from = res.from;
      const to = res.to;
      const timeFrom = moment(from.time).format('MM-DD HH');
      const timeTo = moment(to.time).format('MM-DD HH');
      let TwPoints = '';
      let RdPoints = '';
      let FbPoints = '';
      if (to.Twitter.Points) {
        TwPoints = '' + MATH.percent(to.Twitter.Points, from.Twitter.Points);
      }
      if (to.Reddit.Points) {
        RdPoints = '' + MATH.percent(to.Reddit.Points, from.Reddit.Points);
      }
      if (to.Facebook.Points) {
        FbPoints = '' + MATH.percent(to.Facebook.Points, from.Facebook.Points);
      }

      return {
        coin,
        timeFrom,
        timeTo,
        TwPoints,
        RdPoints,
        FbPoints
      };
    }).toPromise()
  }


  getSocialStats0(symbol: string) {

    return this.getCoinLists().switchMap(coins => {
      if(!coins[symbol]){
        console.warn(symbol, coins);
        return Observable.of({});
      }
      const url = 'api/proxy-5min/https://www.cryptocompare.com/api/data/socialstats/?id=' + coins[symbol].Id;
      console.log(url);
      return this.http.get(url).map((res: any) => {
        console.log(res.Data);
        return res.Data || {};
      })
    })
  }

  getTweeterAccount(symbol:string):Observable<VOTweeterAccount> {
    return this.getSocialStats0(symbol).map(res =>{
      return res.Twitter;
    })
  }

  getCoinLists() {
    const url = 'api/proxy-5min/https://www.cryptocompare.com/api/data/coinlist';
    if (this.coinList) return Observable.of(this.coinList);
    else return (<any> this.http.get(url)).map(res => {
      this.coinList = res.Data;
      return this.coinList
    })

  }

  getMarkets(base: string, coin: string) {
    const url = 'api/proxy-5min/https://www.cryptocompare.com/api/data/coinsnapshot/?fsym={{coin}}&tsym={{base}}'
      .replace('{{coin}}', coin).replace('{{base}}', base);
    return this.http.get(url).map((res: any) => {
      return res.Data
    })
  }

  getHistoHour(base: string, coin: string, limit = 25): Observable<VOHistHour[]> {
    const url = 'api/proxy-5min/https://min-api.cryptocompare.com/data/histohour?fsym={{coin}}&tsym={{base}}&limit={{limit}}&e=CCCAGG'
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
    const url = 'api/proxy-5min/https://min-api.cryptocompare.com/data/histominute?fsym={{coin}}&tsym={{base}}&limit={{limit}}&e=CCCAGG&&aggregate=6'
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
