import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import * as moment from 'moment';
import {MATH} from '../../acom/math';
import {VOCandle} from '../../amodels/api-models';
import {Observable} from 'rxjs/internal/Observable';
import {map, switchMap} from 'rxjs/operators';
import {of} from 'rxjs/internal/observable/of';
import {StorageService} from '../services/app-storage.service';

export interface VOSocialHistObj{
  time:  string []
  comments: number []
  posts: number []
  followers: number []
  points: number []
  overview_page_views: number []
  analysis_page_views: number []
  markets_page_views: number []
  charts_page_views: number []
  trades_page_views: number []
  forum_page_views: number []
  influence_page_views: number []
  total_page_views: number []
  fb_likes: number []
  fb_talking_about:number []
  twitter_followers: number []
  twitter_following: number []
  twitter_lists: number []
  twitter_favourites: number []
  twitter_statuses: number []
  reddit_subscribers: number []
  reddit_active_users: number []
  reddit_posts_per_hour: number []
  reddit_posts_per_day: number []
  reddit_comments_per_hour: number []
  reddit_comments_per_day: number []
  code_repo_stars: number []
  code_repo_forks: number []
  code_repo_subscribers: number []
  code_repo_open_pull_issues: number []
  code_repo_closed_pull_issues: number []
  code_repo_open_issues: number []
  code_repo_closed_issues: number []
}

export interface VOSocialHist{
  time: number | string
  comments: number
  posts: number
  followers: number
  points: number
  overview_page_views: number;
  analysis_page_views: number;
  markets_page_views: number
  charts_page_views: number
  trades_page_views: number
  forum_page_views: number
  influence_page_views: number
  total_page_views: number
  fb_likes: number
  fb_talking_about:number
  twitter_followers: number
  twitter_following: number
  twitter_lists: number
  twitter_favourites: number
  twitter_statuses: number
  reddit_subscribers: number
  reddit_active_users: number
  reddit_posts_per_hour: number
  reddit_posts_per_day: number
  reddit_comments_per_hour: number
  reddit_comments_per_day: number
  code_repo_stars: number
  code_repo_forks: number
  code_repo_subscribers: number
  code_repo_open_pull_issues: number
  code_repo_closed_pull_issues: number
  code_repo_open_issues: number
  code_repo_closed_issues: number
}


export interface VOTweeterAccount {
  Points: number
  account_creation: string;
  favourites: string;
  followers: number;
  following: string;
  link: 'https://twitter.com/enjincs'
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
  private API_KEY = '636376b2aaabce3f70270bc9b48cc029ace578fd32578b9a9ba7f30c8cff32fd';
  private coinList: { [symbol: string]: VOCryptoCompare };

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {

  }

  getSocialHist(symbol: string, limit = 30): Observable<VOSocialHist[]> {
    return this.getCoinLists().pipe(switchMap(coins => {
      if (coins[symbol]) {
        const id = coins[symbol].Id;
        const url = '/api/proxy-1hour/https://min-api.cryptocompare.com/data/social/coin/histo/day?coinId={{ID}}'
          .replace('{{ID}}', id)+ '&limit=' + limit + '&api_key='+ this.API_KEY  ;
        // console.log(url);
        return this.http.get(url).pipe(map((res: any) => {
          return res.Data;
        }));
      } else {
        console.warn(' no cryptocaomare symbol ' + symbol);
        return of(null);
      }
    }))
  }

  getSocialStats(coin: string) {
    const params = {
      coin
    };
    const url = 'api/proxy-1hour/http://front-desk.ca/coin-media/get-coin-media.php';
    // console.warn(url);
    return this.http.get(url, {params}).pipe(map((res: any) => {
    //  console.log(res);
      if (!res.from || !res.from.Twitter || !res.to.Twitter) {
        console.log(res);
        return null;
      }
      const from = res.from;
      const to = res.to;
      const timeFrom = moment(from.time).format('MM-DD HH');
      const timeTo = moment(to.time).format('MM-DD HH');
      let TwPoints = '';
      let RdPoints = '';
      let FbPoints = '';
      let TwFollow = '';
      let RdFollow = '';
      try{
        if (to.Twitter.Points) {
          TwPoints = '' + MATH.percent(to.Twitter.Points, from.Twitter.Points);
          TwFollow = '' + MATH.percent(to.Twitter.followers, from.Twitter.followers);
        }
        if (to.Reddit.Points) {
          RdPoints = '' + MATH.percent(to.Reddit.Points, from.Reddit.Points);
          RdFollow = '' + MATH.percent(to.Reddit.subscribers, from.Reddit.subscribers);
        }
        if (to.Facebook.Points) {
          FbPoints = '' + MATH.percent(to.Facebook.Points, from.Facebook.Points);
        }

      } catch (e) {
        console.log(res);
      }


      return {
        coin,
        timeFrom,
        timeTo,
        TwPoints,
        TwFollow,
        RdPoints,
        RdFollow,
        FbPoints
      };
    })).toPromise();
  }


  /*getSocialStats0(symbol: string) {

    return this.getCoinLists().switchMap(coins => {
      if (coins[symbol]) {
        const url = 'api/proxy-5min/https://www.cryptocompare.com/api/data/socialstats/?id=' + coins[symbol].Id;
        console.log(url);
        return this.http.get(url).pipe(map((res: any) => {
          console.log(res.Data);
          return res.Data || {};
        }));
      } else {
        console.warn(symbol, coins);
        return of({});
      }
    })
  }*/

  getCoinLists() {
    const url = 'api/proxy-1hour/https://min-api.cryptocompare.com/data/all/coinlist';
    if (this.coinList) return of(this.coinList);
    else return this.http.get(url).pipe(map((res: any) => {
      this.coinList = res.Data;
      return this.coinList
    }))

  }

  getMarkets(base: string, coin: string) {
    const url = 'api/proxy-5min/https://www.cryptocompare.com/api/data/coinsnapshot/?fsym={{coin}}&tsym={{base}}'
      .replace('{{coin}}', coin).replace('{{base}}', base);
    return this.http.get(url).pipe(map((res: any) => {
      return res.Data
    }));
  }


  async downloadCandles(market: string, candlesInterval: string, limit: number = 120) {

    const units = candlesInterval.substr(-1);
    const val = candlesInterval.substr(0, candlesInterval.length - 1);
    if (isNaN(+val)) throw new Error(val + ' wrong val ');
    let candles: VOCandle[];
    if (units === 'm') {
      return this.getHistoMinute(market, val +'', String(limit))
    } else {
      return this.getHistoHour(market, val+'', String(limit))
    }
  }

  private getHistoHour(market: string, aggregate: string, limit: string): Promise<VOCandle[]> {
    const ar = market.split('_');
    const tsym = ar[0], fsym = ar[1];
    const params = {
      fsym,
      tsym,
      limit,
      aggregate,
      e: 'CCCAGG'
    };

    const url = 'https://min-api.cryptocompare.com/data/histohour';

    return this.http.get(url, {params}).pipe(map((res: any) => {
      console.log(res.Data.length)
      return res.Data.map(function (item) {
        return {
          to: item.time * 1000,
          close: +item.close,
          open: +item.open,
          high: +item.high,
          low: +item.low,
          Volume: item.volumefrom
        }
      })
    })).toPromise();
  }

  private getHistoMinute(market: string, aggregate: string, limit = '120'): Promise<VOCandle[]> {
    const ar = market.split('_');
    const tsym = ar[0], fsym = ar[1];
    const params = {
      fsym,
      tsym,
      limit,
      aggregate,
      e: 'CCCAGG'
    };

    const url = 'https://min-api.cryptocompare.com/data/histominute';
    return this.http.get(url, {params}).pipe(map((res: any) => {
    //   console.log('results ' + res.Data.length);
      return res.Data.map(function (item) {
        return {
          to: item.time * 1000,
          close: +item.close,
          open: +item.open,
          high: +item.high,
          low: +item.low,
          Volume: item.volumefrom

        }
      })
    })).toPromise();

  }

}
