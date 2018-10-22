import {Injectable} from '@angular/core';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {CandlesService} from '../candles/candles.service';
import {Subscription} from 'rxjs/Subscription';
import {VOCandle} from '../../models/api-models';
import {CandlesAnalys1} from './candles-analys1';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Subject} from 'rxjs/Subject';
import {CandlesAnalys2} from './candles-analys2';

@Injectable()
export class ScanMarketsService {
  // exchange = 'binance';
  scanInterval;
  statsSub: Subject<string> = new Subject<string>();


  // scanners: { [index: string]: ScannerMarkets } = {};
  constructor(
    private apisPublic: ApisPublicService,
    private storage: StorageService,
    private marketCap: ApiMarketCapService,
    private candlesService: CandlesService
  ) {
    candlesService.candlesInterval = '5m';
    candlesService.canlesLength = 200;
    candlesService.overlap = 10;

    candlesService.statsSub.subscribe(stats => {
      this.statsSub.next(stats);
    });

    this.storage.select('favorite-markets').then(prefs =>{
      this.favoritesSub.next(prefs);
    })
  }

  /* getScanner(exchange: string): ScannerMarkets {
     if (!this.scanners[exchange]) {
       this.scanners[exchange] = new ScannerMarkets(this.apisPublic.getExchangeApi(exchange), this.storage, this.marketCap);
     }
     return this.scanners[exchange];
   }
 */

  stop() {
    this.candlesService.stop();
    clearInterval(this.scanInterval);
    this.scanInterval = 0;
  }

  favoritesSub:BehaviorSubject<any> = new BehaviorSubject(null);
  addFavorite(market: string, message: string){
    const prefs: any[]= this.favoritesSub.getValue() || [];
    prefs.push({
      stamp: Date.now(),
      market,
      message
    });
    this.storage.upsert('favorite-markets', prefs);
    this.favoritesSub.next(prefs);
  }
  removeFavorite(market: string) {
    let prefs: any[]= _.reject(this.favoritesSub.getValue(), {market:market});
    this.storage.upsert('favorite-markets', prefs);
    this.favoritesSub.next(prefs);
  }
  async start() {
    if (this.scanInterval) {
      throw new Error(' scan is running ');
    }


    this.scanInterval = setInterval(async () => {
      let excludes1: any[] = (await this.getExcludes('binance')) || [];

      const now = Date.now();
      const excludes = excludes1.filter(function (o) {
        return o.postpone > now;
      });
      if (excludes1.length !== excludes.length) this.saveExcludes('binance', excludes);


    }, 60000);


    const sub = await this.candlesService.scanOnce('1m', 120);

    sub.subscribe(async (data) => {
      const exchange = data.exchange;
      const market = data.market;
      this.candles[exchange + market] = data.candles;
      const MC = await this.marketCap.getTicker();
      const mc = MC[data.market.split('_')[1]];
      const res = await CandlesAnalys1.analyze(data, mc, null, this.notify.bind(this));
      this.currentResultSub.next(res);
    },err=>{

    }, this.stop.bind(this));


    /* await this.candlesService.subscribeForAll();

     const subs = this.candlesService.getAllSubscriptions();


     subs.forEach((sub) => {
       sub.subscribe(data => {
         //  console.log(data);
         this.onCandles(data);
       })
     })*/
  }

  currentResult$() {
    return this.currentResultSub.asObservable();
  }

  currentResultSub: Subject<any> = new Subject();

  /* async onCandles(data: { exchange: string, market: string, candles: VOCandle[] }) {
     const exchange = data.exchange;
     const market = data.market;
     this.candles[exchange+market]
     const MC = await this.marketCap.getTicker();
     const mc = MC[data.market.split('_')[1]];

     const res = await CandlesAnalys2.analyze(data, mc, null, this.notify.bind(this));
     this.currentResultSub.next(res);
   }*/

  /* async algorithm1(data: { exchange: string, market: string, candles: VOCandle[] }) {
     const market = data.market;
     const exchange = data.exchange;
     const MC = await this.marketCap.getTicker();
     const candles = data.candles;
     const mc = MC[market.split('_')[1]];
     const res = await CandlesAnalys1.analyze(candles, market, mc, this.addExclude, this.notify);
     this.currentResultSub.next(res);

   }*/

  async removeExclude(exchange: string, market: string) {
    let excludes = (await this.getExcludes(exchange)) || [];
    excludes = _.reject(excludes, {market});
    await this.saveExcludes(exchange, excludes)
  }

  async addExclude(exchange: string, market: string, reason: string, hours: number) {
    console.log('ADD EXCLUDE ', market, reason, hours);
    const postpone = moment().add(hours, 'hours').valueOf();
    let excludes = (await this.getExcludes(exchange)) || [];

    const exists = excludes.find(function (o) {
      return o.market === market;
    });

    if (exists) exists.postpone = postpone;
    else excludes.push({
      stamp: Date.now(),
      market,
      postpone,
      reason
    });

    this.removeCandles(exchange, market);
    this.saveExcludes(exchange, excludes);
  }

  async notify(data: any) {

    let notifications = await this.notifications();
    if (!notifications) return
    notifications.unshift(data);
    notifications = notifications.slice(0, 30);
    this.dispatch(notifications);
  }

  dispatch(notifications: any[],) {
    this.notificationsSub.next(notifications);
    this.storage.upsert('scanner-markets-notifications', notifications);
  }

  private notificationsSub: BehaviorSubject<any[]>;

  async notifications$() {
    await this.notifications();
    return this.notificationsSub.asObservable();
  }

  async notifications(): Promise<any[]> {
    if (this.notificationsSub) return Promise.resolve(this.notificationsSub.getValue());
    this.notificationsSub = new BehaviorSubject<any[]>(
      (await this.storage.select('scanner-markets-notifications')) || []
    );
    return this.notificationsSub.getValue();
  }

  async clearMemory(exchange: string) {
    await this.storage.remove('scanner-markets-' + exchange);
    await this.storage.remove('exclude-markets-' + exchange);
    this.candlesService.removeAllCandles();
  }

  private removeCandles(exchange: string, market: string) {
    this.candlesService.removeCandles(exchange, market);
  }

  async getExcludes(exchange: string) {
    return this.storage.select('exclude-markets-' + exchange);
  }

  saveExcludes(exchange: string, excludes: any[]) {
    this.storage.upsert('exclude-markets-' + exchange, excludes);
  }

  async deleteNotification(exchange: string, market: string) {
    let notes: { market: string }[] = await this.notifications();
    notes = _.reject(notes, {market: market});
    this.dispatch(notes);
  }

  candles: any = {};
  async getCandles(exchange: string, market: string) {
    if (this.candles[exchange + market]) return Promise.resolve(this.candles[exchange + market]);
    return this.candlesService.getCandles(exchange, market);
  }

  deleteNotifications() {
    this.storage.remove('scanner-markets-notifications');
    this.notificationsSub.next([]);;
  }
}
