import {Injectable} from '@angular/core';
import {ApisPublicService} from '../../apis/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {CandlesService} from '../candles/candles.service';
import {Subscription} from 'rxjs/Subscription';
import {VOCandle} from '../../models/api-models';
import {CandlesStats} from './candles-stats';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Subject} from 'rxjs/Subject';

@Injectable()
export class ScanMarketsService {
  exchange = 'binance';
  scanInterval;

  // scanners: { [index: string]: ScannerMarkets } = {};
  constructor(
    private apisPublic: ApisPublicService,
    private storage: StorageService,
    private marketCap: ApiMarketCapService,
    private candlesService: CandlesService
  ) {
  }

  /* getScanner(exchange: string): ScannerMarkets {
     if (!this.scanners[exchange]) {
       this.scanners[exchange] = new ScannerMarkets(this.apisPublic.getExchangeApi(exchange), this.storage, this.marketCap);
     }
     return this.scanners[exchange];
   }
 */

  stop(){
    clearInterval(this.scanInterval);
    this.scanInterval = 0;
  }
  async start() {
    this.scanInterval = setInterval(async () => {
      let excludes1: any[] = (await this.getExcludes(this.exchange)) || [];

      const now = Date.now();
      const excludes = excludes1.filter(function (o) {
        return o.postpone > now;
      });
      if (excludes1.length !== excludes.length) this.saveExcludes(this.exchange, excludes);


    }, 60000);
    await this.candlesService.subscribeForAll();
    const subs = this.candlesService.getAllSubscriptions();
    subs.forEach((sub) => {
      sub.subscribe(data => {
        //  console.log(data);
        this.onCandles(data);
      })
    })
  }

  currentResult$() {
    return this.currentResultSub.asObservable();
  }

  currentResultSub: Subject<any> = new Subject()

  async onCandles(data: { exchange: string, market: string, candles: VOCandle[] }) {
    const market = data.market;
    const exchange = data.exchange;
    const MC = await this.marketCap.getTicker();
    const candles = data.candles;
    const mc = MC[market.split('_')[1]];
    const res = await CandlesStats.analyze(candles, market, mc);
    this.currentResultSub.next(res);
    if (res.AMPL > 10) {
      this.addExclude(exchange, market, 'AMPL ' + res.AMPL, 24);
    } else if (res.AMPL > 5) {
      this.addExclude(exchange, market, 'AMPL ' + res.AMPL, 4);
    } else if (res.BrRes < -10) {
      this.addExclude(exchange, market, 'BR ' + res.BrRes, 5);
    } else if (res.BrRes < -5) {
      this.addExclude(exchange, market, 'BR ' + res.BrRes, 2);
    } else if (res.BrRes < -2) {
      this.addExclude(exchange, market, 'BR ' + res.BrRes, 1);
    } else if (res.BrRes > 0) {
      this.notify(exchange, res);
      // console.log(lastHigh, lastV);
      // console.log(maxPrice, medV, meanV);
    }
  }

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
      market,
      postpone,
      reason
    });

    this.removeCandles(exchange, market);
    this.saveExcludes(exchange, excludes);
  }

  async notify(exchange: string, data: any) {
    let notifications = await this.notifications(exchange);
    if (!notifications) return
    notifications.unshift(data);
    notifications = notifications.slice(0, 10);
    this.dispatch(exchange, notifications);
  }

  dispatch(exchange: string, notifications: any[],) {
    this.notificationsSub.next(notifications);
    this.storage.upsert('scanner-markets-' + exchange, notifications);
  }

  private notificationsSub: BehaviorSubject<any[]>;

  async notifications$() {
    await this.notifications(this.exchange);
    return this.notificationsSub.asObservable();
  }

  async notifications(exchange: string): Promise<any[]> {
    if (this.notificationsSub) return Promise.resolve(this.notificationsSub.getValue());
    this.notificationsSub = new BehaviorSubject<any[]>(
      (await this.storage.select('scanner-markets-' + exchange)) || []
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
    let notes: { market: string }[] = await this.notifications(exchange);
    notes = _.reject(notes, {market: market});
    this.dispatch(exchange, notes);
  }

  getCandles(exchange: string, market: string) {
    return this.candlesService.getCandles(exchange, market);
  }
}
