import {Injectable} from '@angular/core';

import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {Http} from '@angular/http';
import * as _ from 'lodash';
import {VOMarketCap} from '../models/app-models';
import {StorageService} from '../services/app-storage.service';
import {HttpClient} from "@angular/common/http";
import {ApiMarketCapService} from "../apis/api-market-cap.service";


@Injectable()
export class MarketCapService {

  private coinsAr: VOMarketCap[];

  private history: { [id: string]: VOMarketCap }[];


  coinsAr$: Observable<VOMarketCap[]>;
  private coinsArSub: BehaviorSubject<VOMarketCap[]> = new BehaviorSubject(null);
  coins: { [symbol: string]: VOMarketCap };

  private coins$: Observable<{ [symbol: string]: VOMarketCap }>;

  // private coinsSub: Subject<{[symbol:string]:VOMarketCap}> = new Subject();
  private coinsSubB: BehaviorSubject<{ [symbol: string]: VOMarketCap }>;
  timestamp = 0;
  delay = 6.1 * 60;
  counter: number;
  coinsById: { [id: string]: VOMarketCap };

  countDown: number;
  countDownSub: Subject<number>
  countDown$: Observable<number>;

  historyCounterSub: Subject<number>;
  historyCounter$: Observable<number>;

  isRunning: boolean;

  constructor(public http: HttpClient,
              private storage: StorageService) {

    this.timestamp = Date.now();
    this.counter = 0;

    this.countDownSub = new Subject();
    this.countDown$ = this.countDownSub.asObservable();
    this.historyCounterSub = new Subject();
    this.historyCounter$ = this.historyCounterSub.asObservable();

    this.coinsAr$ = this.coinsArSub.asObservable();

    this.coinsSubB = new BehaviorSubject(this.coins);
    this.coins$ = this.coinsSubB.asObservable();
    this.history = [];
    //this.coinsSub = new Subject();


    this.countDown = this.delay;
    this.isRunning = true;
   // setInterval(() => this.doCountDown(), 1000);
    this.start();
  }


  getLast10(coins:string[]):Observable<any>{
    return this.http.get('api/marketcap/coinsLast10/' + coins.toString()).map((res:any[])=>{
      //console.log(res);
      return res.map(function (item) {
        return ApiMarketCapService.mapServerValues(item);
      })
    })
  }

  doCountDown() {
    this.countDown--;
    this.countDownSub.next(this.countDown);
    if (this.countDown < 2) {

      if (this.isRunning) this.refresh();


    }
  }

  isLoaded: boolean;


  getCoinsObs() {
    if(this.coins) return Observable.of(this.coins);
    return this.downloadTicker();
  }

  getCoinsPromise(): Promise<{ [symbol: string]: VOMarketCap }> {
    if (!this.isLoaded) this.refresh();
    this.isLoaded = true;

    return new Promise<{ [symbol: string]: VOMarketCap }>((resolve, reject) => {
      if (this.coins) resolve(this.coins);
      else {
        this.coinsSubB.subscribe(res => {
          if (res) resolve(this.coins)
        });
        this.refresh();
      }
    })

    // if(!this.coinsSubB)return this.coinsSub.asObservable();
    //return this.coinsSubB.asObservable();
  }

  private interval;


  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.countDown = this.delay;
    this.refresh();
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.interval);
  }

  getCoinBySymbol(symbol: string): VOMarketCap {
    return this.coins[symbol];
  }

  /*  getCoinsData():Observable<{[symbol:string]:VOMarketCap}>{

    }*/
  getAllCoinsData(): { [symbol: string]: VOMarketCap } {
    return this.coins
  }

  getAllCoinsById(): { [id: string]: VOMarketCap } {
    //console.log('getAllCoinsById');
    return this.coinsById;
  }

  getAllCoinsArr(): VOMarketCap[] {
    return this.coinsAr
  }

  getSelected(): VOMarketCap[] {

    return this.storage.filterSelected(this.coinsAr);
  }


  dispatchCouns() {
    this.coinsSubB.next(this.coins);
  }

  getHistory(): { [id: string]: VOMarketCap }[] {
    return this.history;
  }


  setData(MC:{[symbol:string]:VOMarketCap}): void {
    // console.warn('setData ');

    console.log('%c MarketCap new data  ', 'color:pink');

    this.coins = MC
    this.coins['USDT'].price_usd = 1;
    this.coinsAr = Object.values(MC);
    let btc = MC['BTC'];

    this.coinsAr.forEach(function (item) {
      item.tobtc_change_1h = +(item.percent_change_1h - this.btc.percent_change_1h).toFixed(2);
      item.tobtc_change_24h = +(item.percent_change_24h - this.btc.percent_change_24h).toFixed(2);
      item.tobtc_change_7d = +(item.percent_change_7d - this.btc.percent_change_7d).toFixed(2);
      item.btcUS = this.btc.price_usd;
    },{btc:btc});

    this.coinsSubB.next(this.coins);
    // console.log(ar);

   // this.coinsById = _.keyBy(ar, 'id');

    //setTimeout(() => this.coinsSubB.next(this.coins), 100);
    setTimeout(() => this.coinsArSub.next(this.coinsAr), 50);

    // if(this.history.length > 300) this.history.shift();
    // this.history.push(this.coins);
    //this.historyCounterSub.next(this.history.length);
    // this.timestamp = Date.now();

    // console.log(' marketcap total: ' + this.marketsAr.length);
    this.counter++;
  }

  getCoinsExchanges(): Observable<VOExchangeCoin[]> {
    let url = '/api/marketcap/all-exchanges';
    return this.http.get(url).map(function (res: any) {
      // let out:VOExchangeCoin[] = [];
      let r = res.data;

      let exchanges: any = {};

      let items: VOExchangeCoin[] = [];

      let topic: string = '';
      r.forEach(function (item) {
        if (item.length == 7) {
          let exch = item[2].split('__');
          let pairAr = item[3].split('__');

          items.push({
            coinId: item[0],
            exchange: exch[0],
            urlMC: exch[1],
            pair: pairAr[0].replace('/', '_'),
            pairUrl: pairAr[1]
          })

        }
      });

      return items;
    })

  }

  isLoading: boolean;


  /*
 *  item.id,
           item.name,
           item.symbol,
           item.rank,
           +item.price_usd,
           +item.price_btc,
           +item.percent_change_1h,
           +item.percent_change_24h,
           +item.percent_change_7d,
           +item['24h_volume_usd'],
           +item.market_cap_usd,
           +item.available_supply,
           +item.total_supply,
           +item.max_supply,
           +item.last_updated*/


  static mapMCValue(item){
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



  downloadTicker(){
    let url = '/api/marketcap/ticker';
    console.log(url);
     return this.http.get(url).map((res: any) => {
       let MC =ApiMarketCapService.mapServerValues(res)
       this.coins = MC;
       return MC;
     });
  }
  refresh() {
    if (this.isLoading) return;
    this.isLoading = true;
    //console.log('%c MarketCap load data ', 'color:pink');;
    let url = '/api/marketcap/ticker';
    console.log('%c ' + url, 'color:pink');
    return this.http.get(url).map((res: any) => {

     let MC =  ApiMarketCapService.mapServerValues( res)
      this.setData(MC);
      this.countDown = this.delay;
      this.isLoading = false;
      return res
    }).toPromise();//subscribe(data=> this.setData(data));
  }

  /*getCoinBySymbol(symbol:string):VOMarketCap{
    return this.coins[symbol];
  }*/


  /* mapExchangeData(obj) {

     //let data: VOMarketCap = new VOMarketCap();

     for (let str in obj) obj[str] = isNaN(obj[str]) ? obj[str] : +obj[str];

     // if(this.coins[data.id]) data.network = this.coins[data.id].base

     obj.volume_usd_24h = +obj['24h_volume_usd'];
     delete obj['24h_volume_usd'];
    // return obj;
   }*/


}


export interface VOCoin {
  symbol: string;
  name: string;
  base: string;
}

/*
export interface VOGainers{
  name:string;
  symbol:string;
  status:string
  cap:string;
  price:string;
  percent:string;
}
*/


export interface VOExchangeCoin {
  coinId: string;
  exchange: string;
  pair: string;
  pairUrl: string;
  urlMC: string;
}