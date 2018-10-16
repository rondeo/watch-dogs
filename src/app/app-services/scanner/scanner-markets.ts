import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {StorageService} from '../../services/app-storage.service';
import * as moment from 'moment';
import {VOCandle, VOMCObj} from '../../models/api-models';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {exitCodeFromResult} from '@angular/compiler-cli';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {VOMarketCap} from '../../models/app-models';
import {ResistanceSupport} from '../../trader/libs/levels/resistance-support';
import {CandlesStats} from './candles-stats';

export class ScannerMarketsOld {
  runningSub = new BehaviorSubject(false);
  exchange: string;
  //  notifications: any[];
  markets: string[];
  interval: string = '5m';

  userExclude: string[] = ['BTC_BCN','BTC_STORM','BTC_GRS','BTC_SC','BTC_DENT','BTC_NPXS', 'BTC_NCASH', 'BTC_EOS','BTC_ETH','BTC_PAX', 'BTC_XMR', 'BTC_BCH', 'BTC_BCC'];
  MC: VOMCObj;
  candles: { [index: string]: VOCandle[] };
  _coinsAvailable: string[] = [];
  excludeMarkets: { market: string, postpone: number, reason: string }[] = [];
  private notificationsSub: BehaviorSubject<any[]>;

  async notifications(): Promise<any[]> {
    if (this.notificationsSub) return Promise.resolve(this.notificationsSub.getValue());
    this.notificationsSub = new BehaviorSubject<any[]>(
      (await this.storage.select('scanner-markets-' + this.exchange)) || []
    );
    return this.notificationsSub.getValue();
  }

  currentMarketSub: Subject<any> = new Subject<any>();

  constructor(private api: ApiPublicAbstract, private storage: StorageService, private marketCap: ApiMarketCapService) {
    this.exchange = api.exchange;
  }

  async clearMemory() {
    this.stopScan();
    await Promise.all(
      this.markets.map((market) => {
        this.storage.remove('candles-' + this.exchange + market + this.interval);
      }));

    await this.storage.remove('scanner-markets-' + this.exchange);
    await this.storage.remove('exclude-markets-' + this.exchange);
    localStorage.removeItem('last-market' + this.exchange);
  }

  removeCandles(market: string) {
    this.storage.remove('candles-' + this.exchange + market + this.interval);
  }

  async nextMarket(market: string): Promise<any> {
    console.log(moment().format('HH:mm') + market);
    localStorage.setItem('last-market' + this.exchange, market);
    const candles = await this.getCandles(market);
    this.ctr(candles, market);
    const nextMarket = await this.getMarketAfter(market);
    this.timeout = setTimeout(() => {
      this.nextMarket(nextMarket)
    }, 15000);

    return null;
  }

  async getCandles(market: string) {
    let candles: VOCandle[] = await this.storage.select('candles-' + this.exchange + market + this.interval);

    const now: number = Date.now();
    if (candles) {
      //if(!candles[0].time)
      candles.forEach(function (o) {
        o.time = moment(o.to).format('DD HH:mm');
      });
      let newcandels: VOCandle[] = await this.api.downloadCandles(market, this.interval, 10);
      newcandels.forEach(function (o) {
        o.time = moment(o.to).format('HH:mm');
      });

      const first = _.first(newcandels);
      candles = candles.filter(function (o) {
        return o.to < first.to
      });
      candles = _.takeRight(candles.concat(newcandels), 200);
    } else {
      candles = await this.api.downloadCandles(market, this.interval, 200);
      candles.forEach(function (o) {
        o.time = moment(o.to).format('HH:mm');
      })
    }

    await this.storage.upsert('candles-' + this.exchange + market + this.interval, candles);
    return candles;
  }

  async ctr(candles: VOCandle[], market: string) {
    const MC = this.MC[market.split('_')[1]];

    const data = await CandlesStats.analyze(candles, market, MC);

    this.currentMarketSub.next(data);
    //const BR = data.BrRes;
    if (data.AMPL > 10) {
      this.addExclude(market, 'AMPL ' + data.AMPL, 24);
    } else if (data.BrRes < -5) {
      this.addExclude(market, 'BR ' + data.BrRes, 3);
    } else if (data.BrRes > 0) {
      this.notify(data);
      // console.log(lastHigh, lastV);
      // console.log(maxPrice, medV, meanV);
    }

  }

  async coinsAvailable() {
    if (this._coinsAvailable) return Promise.resolve(this._coinsAvailable)
    return this.api.getAllCoins()
  }

  async notify(data: any) {
    const notifications = await this.notifications();
    notifications.unshift(data);
    if (notifications.length > 200) notifications.pop();
    this.dispatch(notifications);
  }


  /*async analyse1MinuteCandles(market: string) {
    let candles1min: VOCandle[] = await this.api.downloadCandles(market, '1m', 30);
    const candles30min: VOCandle[] = await this.getCandles(market);
    console.log(candles1min, candles30min);

  }*/


  timeout;


  async removeExclude(market: string) {
    let excludes = (await this.getExcludes()) || [];
    excludes = _.reject(excludes, {market});
   await this.saveExcludes(excludes)
  }

  async addExclude(market: string, reason: string, hours: number) {
    console.log('ADD EXCLUDE ', market, reason, hours);
    const postpone = moment().add(hours, 'hours').valueOf();

    let excludes = (await this.getExcludes()) || [];


    const exists = excludes.find(function (o) {
      return o.market === market;
    });

    if (exists) exists.postpone = postpone;
    else excludes.push({
      market,
      postpone,
      reason
    });

    this.removeCandles(market);
    this.saveExcludes(excludes);
  }

  /*isExclude(market: string): boolean {
    const now = Date.now();
    const exclude = this.excludeMarkets.filter(function (o) {
      return o.postpone > now;
    });

    if (this.excludeMarkets.length !== exclude.length) {
      console.log(' REMOVED EXCUDE ', _.differenceBy(this.excludeMarkets, exclude, 'market'));
      this.saveExclude();
    }
    this.excludeMarkets = exclude;
    return !!exclude.find(function (o) {
      return o.market === market;
    });
  }
*/
  async getMarketAfter(market: string) {
    let excludes1: any[] = ((await this.getExcludes()) || []);
    const now = Date.now();
    const excludes = excludes1.filter(function (o) {
      return o.postpone > now;
    });

    if (excludes1.length !== excludes.length) this.saveExcludes(excludes);

    const exls = excludes.map(function (o) {
      return o.market;
    })

    let available = _.difference(this.markets, exls);
    available = _.difference(available, this.userExclude);


    let ind = available.indexOf(market);
    if (ind === -1 || ind === available.length - 1) ind = 0;
    else ind++;
    console.log('available ' + available.length);
    return available[ind];
  }

  /*async downloadNext(i) {
    i++;
    if (i >= this.markets.length) i = 0;
    localStorage.setItem('scan-markets-i-' + this.exchange, i.toString());
    const market = this.markets[i];
    const ar = market.split('_');
    const MC = this.MC[ar[1]];
    if (this.isExclude(market)) {
      console.log('EXCLUDED ' + market);
      setTimeout(() => {
        this.timeout = this.downloadNext(i)
      }, 300);
      return
    }

    console.log(moment().format('HH:mm') + market + ' ' + i + ' of ' + (this.markets.length - this.excludeMarkets.length));
    //  console.log(this.excludeMarkets);
    const delay = await this.nextMarket(market);

    this.timeout = setTimeout(() => {
      this.downloadNext(i)
    }, delay * 1000);
  }*/


/*
  async start(includeBase: string[]): Promise<string[]> {
    if (this.runningSub.getValue()) return Promise.resolve(this.markets);
    this.excludeMarkets = (await this.storage.select('exclude-markets-' + this.exchange)) || [];

    const data = await this.api.getMarkets();
    const subscribedMarkets = Object.keys(data);
    this.markets = subscribedMarkets.filter(function (o) {
      return includeBase.indexOf(o.split('_')[0]) !== -1;
    });

    this.MC = await this.marketCap.getTicker();
    await this.notifications();

    let market = localStorage.getItem('last-market' + this.exchange);
    if (!market) market = this.markets[0];
    this.nextMarket(market);
    // this.downloadNext(i);
    this.runningSub.next(true);
    return this.markets;
  }
*/

  current$() {
    return this.currentMarketSub.asObservable();
  }


  async notifications$() {
    await this.notifications();
    return this.notificationsSub.asObservable();
  }

  running$() {
    return this.runningSub.asObservable();
  }

  stopScan() {
    this.runningSub.next(false);
    clearTimeout(this.timeout);
    this.timeout = null;
  }

  async deleteMarket(market: string) {
    let notes: { market: string }[] = await this.notifications();
    notes = _.reject(notes, {market: market});
    this.dispatch(notes);
  }

  dispatch(notifications: any[]) {
    this.notificationsSub.next(notifications);
    this.storage.upsert('scanner-markets-' + this.exchange, notifications);
  }

  saveExcludes(excludes: any[]) {
    this.storage.upsert('exclude-markets-' + this.exchange, excludes);
  }

  async getExcludes() {
    return this.storage.select('exclude-markets-' + this.exchange);
  }

  onCandles(data: { exchange: string; market: string; candles: VOCandle[] }) {


  }
}
