import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import * as _ from 'lodash';
import {VOMarketCap} from '../../amodels/app-models';
import {StorageService} from '../../adal/services/app-storage.service';
import {HttpClient} from '@angular/common/http';
import {ApiMarketCapService} from '../../adal/apis/api-market-cap.service';
import {Parsers} from '../../adal/apis/parsers';
import {BehaviorSubject, Observable, Subject} from 'rxjs';


@Injectable()
export class MarketCapService {
  private coins: { [symbol: string]: VOMarketCap };
  private coinsSubB: BehaviorSubject<{ [symbol: string]: VOMarketCap }>;
  timestamp = 0;
  delay = 6.1 * 60;
  counter: number;
  coinsById: { [id: string]: VOMarketCap };
  historyCounterSub: Subject<number>;
  historyCounter$: Observable<number>;
  private isRunning: boolean;

  constructor(public http: HttpClient,
              private storage: StorageService,
              private api: ApiMarketCapService
              ) {

    this.timestamp = Date.now();
    this.counter = 0;
    // this.coinsSubB = new BehaviorSubject(this.coins);
  }
  // getCoinsObs():Observable<{ [symbol: string]: VOMCAgregated }> {
 /*   if (this.coins) return Observable.of(this.coins);
    return this.api.downloadAgrigated().map(res => this.coins = res);
  }*/
  private interval;
 /* getCoinBySymbol(symbol: string): VOMarketCap {
    return this.coins[symbol];
  }*/

 /* private currentExchange: string;
  setCurentExchange(exchange : string){
    this.currentExchange = exchange;
    localStorage.setItem('current-exchange', exchange);
  }
  getCurrentExchange():string{
    if(!this.currentExchange) this.currentExchange = localStorage.getItem('current-exchange');
    return this.currentExchange
  }*/

  /*  getCoinsData():Observable<{[symbol:string]:VOMarketCap}>{

    }*/
 /* getAllCoinsData(): { [symbol: string]: VOMarketCap } {
    return this.coins
  }*/

 /* getAllCoinsById(): { [id: string]: VOMarketCap } {

    return this.coinsById;
  }*/

/*
  getAllCoinsArr(): VOMarketCap[] {
    return this.coinsAr
  }
*/

 /* getSelected(): VOMarketCap[] {

    return this.storage.filterSelected(Object.values(this.coins));
  }*/


 /* dispatchCouns() {
    this.coinsSubB.next(this.coins);
  }*/

 /* setData(MC: { [symbol: string]: VOMarketCap }): void {
    // console.warn('setData ');

    console.log('%c MarketCap new data  ', 'color:pink');

    this.coins = MC
    this.coins['USDT'].price_usd = 1;
   //  this.coinsAr = Object.values(MC);
    let btc = MC['BTC'];

  /!*  this.coinsAr.forEach(function (item) {
      item.tobtc_change_1h = +(item.percent_change_1h - this.btc.percent_change_1h).toFixed(2);
      item.tobtc_change_24h = +(item.percent_change_24h - this.btc.percent_change_24h).toFixed(2);
      item.tobtc_change_7d = +(item.percent_change_7d - this.btc.percent_change_7d).toFixed(2);
      item.btcUS = this.btc.price_usd;
    }, {btc: btc});*!/

    this.coinsSubB.next(this.coins);
    // console.log(ar);

    // this.coinsById = _.keyBy(ar, 'id');

    //setTimeout(() => this.coinsSubB.next(this.coins), 100);

    // setTimeout(() => this.coinsArSub.next(this.coinsAr), 50);

    // if(this.coindatas.length > 300) this.coindatas.shift();
    // this.coindatas.push(this.coins);
    //this.historyCounterSub.next(this.coindatas.length);
    // this.timestamp = Date.now();

    // console.log(' marketcap total: ' + this.marketsAr.length);
    this.counter++;
  }*/

  /*getCoinsExchanges(): Observable<VOExchangeCoin[]> {
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

  }*/

 // isLoading: boolean;


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


 /* static mapMCValue(item) {
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
  }*/

/*
  downloadTicker() {
    let url = '/api/marketcap/ticker';
    console.log(url);
    return this.http.get(url).map((res: any) => {
      let MC = Parsers.mapServerValues(res);
      this.coins = MC;
      return MC;
    });
  }*/

 /* refresh() {
    if (this.isLoading) return;
    this.isLoading = true;
    //console.log('%c MarketCap load data ', 'color:pink');;
    let url = '/api/marketcap/ticker';
    console.log('%c ' + url, 'color:pink');
    return this.http.get(url).map((res: any) => {

      let MC = Parsers.mapServerValues(res)
      this.setData(MC);
      this.countDown = this.delay;
      this.isLoading = false;
      return res
    }).toPromise();//subscribe(data=> this.setData(data));
  }*/

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
