import {Injectable} from '@angular/core';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {CandlesService} from '../candles/candles.service';

import {VOCandle} from '../../models/api-models';
import {CandlesAnalys1} from './candles-analys1';

import * as moment from 'moment';
import * as _ from 'lodash';

import {CandlesAnalys2} from './candles-analys2';
import {MATH} from '../../com/math';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {MFI} from '../../trader/libs/techind';
import {ApiCryptoCompareService} from '../../apis/api-crypto-compare.service';
import {Subject} from 'rxjs/internal/Subject';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

export interface VOMessage {
  time: string;
  market: string;
  message: string;
}

@Injectable()
export class ScanMarketsService {

  // scanners: { [index: string]: ScannerMarkets } = {};
  constructor(
    private apisPublic: ApisPublicService,
    private storage: StorageService,
    private marketCap: ApiMarketCapService,
    private candlesService: CandlesService,
    private apiCryptoCompare: ApiCryptoCompareService
  ) {

    /*this.storage.select('markets-trend-down').then(data => {
      if (data) data = data.map(function (item) {
        return Object.assign(item, {x: 'X'});
      })
      this.marketsTrendDown.next(data);
    })*/
  }

  ///////////////////// patterns scan //////////////////////

  async scanNextPattern(markets: string[], i, sub: Subject<any>, candlesInterval: string, diff: number, results: any[]) {
    if (!this.isScanning) return;
    i++;
    if (i >= markets.length) {
      this.isScanning = false;
      sub.complete();
      return
    }

    const market = markets[i];
    try {
      const candles = await this.apisPublic.getExchangeApi('binance').downloadCandles(market, candlesInterval, 100);

      let result = CandlesAnalys1.getCandelsVolumes(market, candles, diff);

      this.progressSub.next(market);
      if (result.length) {
        results = results.concat(result);
        //   console.log(results);
        sub.next(results);
      }
    } catch (e) {
      console.log(e);
    }

    this.scanInterval = setTimeout(() => this.scanNextPattern(markets, i, sub, candlesInterval, diff, results), 2000);

  }

  scanPatterns(markets: string[], candlesInterval: string, diff) {
    const sub = new Subject<any[]>();
    this.isScanning = true;
    this.scanNextPattern(markets, -1, sub, candlesInterval, diff, []);

    return sub;
  }

  ///////////////////////////

  // exchange = 'binance';
  scanInterval;
  progressSub: Subject<string> = new Subject<string>();
  // favoritesSub: BehaviorSubject<any> = new BehaviorSubject(null);
  marketsTrendDown: BehaviorSubject<{ market: string, percent: number, x: string }[]>
    = new BehaviorSubject<{ market: string, percent: number, x: string }[]>(null);

  currentMarket: string;


  ////////////////////// FAVORITES////////////////////////////////

  private favoriteSub$: BehaviorSubject<any[]>;

  /* isFall(numbers: number[]): string {
     numbers = _.takeRight(numbers, 4);
     const speeds = MATH.speeds(numbers);
     const isFall = MATH.isFall(speeds);
     const per = MATH.percent(_.last(numbers), _.first(numbers));
     return isFall ? 'FALL ' + per : null;
   }
 */
///////////////////////////////////////////////////////  GOING UP ////////////////////////////////////////////
  isScanning = false;


  first20coins = 'BTC,TUSD'; // 'ETH,LTC,EOS,XRP,BCH,BNB,ADA,NXT,TRX,DOGE,DASH,XMR,XEM,ETC,NEO,ZEC,OMG,XTZ,VET,XLM';
  deadMarkets = 'VEN,BCN,HSR,ICN,TRIG,CHAT,RPX';
  ////////////////////////////////////////////////////////////////////////////////////////////////////////


  //////////////////////////// MFI start
  scanMFITimer: any;
  mfiSub: BehaviorSubject<any[]> = new BehaviorSubject(null);

  async favorites$() {
    if (this.favoriteSub$) return Promise.resolve(this.favoriteSub$);
    this.favoriteSub$ = new BehaviorSubject((await this.storage.select('favorite-markets')) || []);
    return this.favoriteSub$;
  }


  async addFavorite(market: string, message: string) {
    if (!market) return;
    this.favorites$().then(sub => {
      let favour = sub.getValue();
      // @ts-ignore
      favour = _.reject(favour, {market: market});
      favour.push({
        stamp: Date.now(),
        market,
        message
      });
      this.saveFavorites(favour);
    });


  }

  async saveFavorites(ar: any[]) {
    ar = ar.filter(function (item) {
      return !!item.market;
    });
    this.favoriteSub$.next(ar);
    return this.storage.upsert('favorite-markets', ar);
  }

  async removeFavorite(market: string) {
    this.favorites$().then(sub => {
      let favour = sub.getValue();
      // @ts-ignore
      favour = _.reject(favour, {market: market});
      this.saveFavorites(favour);
    });
  }


  ///////////////////////// selected ////////////////////////////////

  async addToSelected(ar: { market: string, message: string, time: string }[], creteria: string) {
    const selected: any[] = await this.getSelected();

    ar.forEach(function (item) {
      const exist = selected.find(function (item2) {
        return item2.market === item.market;
      });
      if (exist) {
        if (!exist.history) exist.history = {};
        exist.history[creteria] = item.time + '  ' + item.message;
      } else {
        item.message = creteria + item.message;
        selected.push(item);
      }
    });

    return this.saveSelected(selected);
  }

  async removeSelected(market: string) {
    let selected: any[] = await this.getSelected();
    // @ts-ignore
    selected = _.reject(selected, {market: market});
    this.saveSelected(selected);
  }

  saveSelected(ar: any[]) {
    return this.storage.upsert('selected-markets', ar);
  }

  async getSelected() {
    return (await this.storage.select('selected-markets')) || [];
  }

  private async nextScan(markets: string[], i, api: ApiPublicAbstract, sub: BehaviorSubject<any[]>,
                         candlesInterval: string, cretaria: string, percent: number) {
    i++;
    if (i >= markets.length) {
      sub.complete();
      this.isScanning = false;
      return;
    }
    const market = markets[i];

    let candles: VOCandle[];
    try {
      candles = await api.downloadCandles(market, candlesInterval, 100);
    } catch (e) {


    }

    if (!candles) return;
    const last = _.last(candles);
    const time = moment(last.to).format('HH:mm');
    const mas = CandlesAnalys1.mas(candles);

    let creteriaValue = 0;
    switch (cretaria) {
      case 'ma7_25':
        creteriaValue = MATH.percent(mas.ma7, mas.ma25);
        break;
      case 'ma7_99':
        creteriaValue = MATH.percent(mas.ma7, mas.ma99);
        break;
      case 'ma25_99':
        creteriaValue = MATH.percent(mas.ma25, mas.ma99);
        break;
    }

    let message  =  candlesInterval + ' ' + cretaria + '  ' + creteriaValue;
    this.progressSub.next(message);
    this.currentMarket = market;
    const res = percent > 0 ? creteriaValue > percent : creteriaValue < percent;
    if (res) {
      const results = sub.getValue();
      results.push({
        time,
        market,
        message
      });
      sub.next(results);
    }

    this.scanInterval = setTimeout(() => {
      this.nextScan(markets, i, api, sub, candlesInterval, cretaria, percent);
    }, 2000);

  }

  startScan(markets: string[], candlesInterval: string, cretaria: string, percent: number): Subject<any[]> {
    this.isScanning = true;
    this.progressSub.next('SCAN UP STARED ' + candlesInterval);
    //  const api = this.apisPublic.getExchangeApi('binance');
    const sub = new BehaviorSubject<any[]>([]);
    this.nextScan(markets, -1, this.apisPublic.getExchangeApi('binance'), sub, candlesInterval, cretaria, percent);
    return sub;
  }


  stop() {
    clearInterval(this.scanInterval);
    this.scanInterval = 0;
    this.isScanning = false;
  }


  ////////////////////////////////// VOLUMES ////////////////////////////////////////////
  async volumeNext(markets: string[], i: number, candlesInterval: string, volumeChange: number, sub: Subject<any[]>, results: any[]) {
    i++;
    if (i >= markets.length) {
      clearTimeout(this.scanInterval);
      sub.complete();
      this.isScanning = false;
      return;
    }

    const market = markets[i];
    let candles;
    this.isScanning = true;
    try {
      candles = await this.apisPublic.getExchangeApi('binance').downloadCandles(market, candlesInterval, 120);
    } catch (e) {
      console.warn(e);
    }

    if (!candles) {
      this.scanInterval = setTimeout(() => this.volumeNext(markets, i, candlesInterval, volumeChange, sub, results), 10000);
      return;
    }

    const closes = CandlesAnalys1.closes(candles);
    const last: VOCandle = _.last(candles);
    const time = moment(last.to).format('HH:mm');
    const volumes = _.map(candles, 'Volume');
    let before = volumes.slice(0, -10);
    before = before.filter(function (item) {
      return !!item;
    });

    const after = volumes.slice(-10);
    const avgBefore = MATH.median(before);
    const avgAfter = _.mean(after);

    const priceBefore = _.mean(closes.slice(50, -10));
    const priceAfter = _.mean(closes.slice(-10));
    const VD = MATH.percent(avgAfter, avgBefore);
    const PD = MATH.percent(priceAfter, priceBefore);

    const reason = ' V: ' + VD + ' PD ' + PD;
    this.currentMarket = market;
    console.log(market + reason);
    this.progressSub.next(reason);
    if (VD > volumeChange) {
      results.push({time, market, reason});
      sub.next(results);
    }
    this.scanInterval = setTimeout(() => this.volumeNext(markets, i, candlesInterval, volumeChange, sub, results), 2000);
  }

  scanForVolume(markets: string[], candlesInterval: string, volumeChange: number) {
    this.isScanning = true;
    const sub = new Subject<any[]>();
    this.volumeNext(markets, -1, candlesInterval, volumeChange, sub, []);
    return sub
  }


  /*async getValidMarkets(exchange: string) {

    let markets = await this.getAvailableMarkets(exchange);
    /!*const data = await this.apisPublic.getExchangeApi(exchange).getMarkets();
    let markets = Object.keys(data);
    markets = markets.filter(function (o) {
      return o.indexOf('BTC') === 0;
    });

    const userExclude = (this.deadMarkets + ',' + this.first20coins).split(',').map(function (o) {
      return 'BTC_' + o;
    });


    markets = _.difference(markets, userExclude);
*!/

    const runtimeExclude = await this.storage.select('exclude-markets-' + exchange);
    const trendDown = await this.storage.select('markets-trend-down');
//'markets-trend-down'
    markets = _.difference(markets, _.map(trendDown,'market'));

    return  _.difference(markets, _.map(runtimeExclude, 'market'));

    /!* const preference =  ((await this.storage.select('markets-favorite')) || []).map(function (o) {
       return o.market;
     });

     markets = preference.concat(markets);
     markets = _.uniq(markets);*!/
    // return markets

  }*/

  async getAvailableMarkets(exchange: string) {
    const data = await this.apisPublic.getExchangeApi(exchange).getMarkets();
    let markets = Object.keys(data);
    markets = markets.filter(function (o) {
      return o.indexOf('BTC') === 0;
    });
    const exclude = (this.deadMarkets + ',' + this.first20coins).split(',').map(function (o) {
      return 'BTC_' + o;
    });
    return _.difference(markets, exclude);
  }

  async getMFIs() {
    let results = this.mfiSub.getValue();
    if (Array.isArray(results)) return Promise.resolve(results);
    else {
      results = (await this.storage.select('mfi-results')) || [];
      this.mfiSub.next(results);
    }
    return results;
  }

  async saveMFIs(results: any[]) {
    this.mfiSub.next(results);
    return this.storage.upsert('mfi-results', results);
  }

  stopMFIScan() {
    this.isScanning = false;
    clearTimeout(this.scanMFITimer);
    this.scanMFITimer = 0;
  }

  nextMarketMFI(markets: string[], i: number, candelsInterval: string) {

    i++;
    if (i >= markets.length) {
      this.stopMFIScan();
      return;
    }
    this.isScanning = true;
    const market = markets[i];
    this.currentMarket = market;
    this.apisPublic.getExchangeApi('binance').downloadCandles(market, candelsInterval, 120).then(candles => {
      const input = {close: [], open: [], high: [], low: [], volume: [], period: 14};
      candles.forEach(function (item) {
        this.close.push(item.close);
        this.high.push(item.high);
        this.low.push(item.low);
        this.open.push(item.open);
        this.volume.push(item.Volume);
      }, input);

      const mfi = new MFI(input);
      const mfiResults = mfi.getResult();

      const last10 = _.takeRight(mfiResults, 10);
      const myValue = _.min(last10);
      const time = moment(_.last(candles).to).format('HH:mm');
      let message = time + ' ' + market + ' ' + myValue;
      this.progressSub.next(message);
      if (myValue < 20) {
        const ind = 10 - last10.indexOf(myValue);

        message += ' ' + ind + ' ago';
        let results = this.mfiSub.getValue() || [];
        // @ts-ignore
        const excist = _.find(results, {market: market});
        if (excist) {
          excist.intervals.push(candelsInterval);
        } else {
          const intervals = [candelsInterval];
          results.push({time, market, message, intervals});
        }


        this.saveMFIs(results);
      }

      this.scanMFITimer = setTimeout(() => this.nextMarketMFI(markets, i, candelsInterval), 2000);

    });
  }

  scanForMFI(markets: string[], candelsInterval) {
    this.nextMarketMFI(markets, -1, candelsInterval);
  }

  deleteMFIs() {
    this.saveMFIs([]);

  }

  deleteMFI(market: any) {
    let results: any[] = this.mfiSub.getValue();
    results = _.reject(results, {market: market});
    return this.saveMFIs(results);


  }
}
