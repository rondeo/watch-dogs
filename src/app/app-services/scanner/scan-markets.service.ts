import {Injectable} from '@angular/core';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {CandlesService} from '../candles/candles.service';

import {VOCandle, VOMCObj} from '../../models/api-models';
import {CandlesAnalys1} from './candles-analys1';

import * as moment from 'moment';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {MFI} from '../../trader/libs/techind';
import {ApiCryptoCompareService} from '../../apis/api-crypto-compare.service';
import {Subject} from 'rxjs/internal/Subject';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {MacdSignal} from '../app-bots-services/macd-signal';
import {ReplaySubject} from 'rxjs/internal/ReplaySubject';

export interface VOMessage {
  time: string;
  market: string;
  message: string;
}

@Injectable()
export class ScanMarketsService {
  scanning$: BehaviorSubject<any> = new BehaviorSubject(0);
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

  async scanNextPattern(markets: string[], i, sub: ReplaySubject<any>, candlesInterval: string, MC: VOMCObj, results: any[]) {
    if (!this.scanning$.getValue()) return;
    i++;
    if (i >= markets.length) {
     this.scanning$.next(0);
     sub.complete();
      return
    }

    const market = markets[i];
    this.progressSub.next(market);
    try {
      const candles = await this.apisPublic.getExchangeApi('binance').downloadCandles(market, candlesInterval, 100);

      const macd: MacdSignal = new MacdSignal(market, null);
      const closes = CandlesAnalys1.closes(candles);
      const last3 = macd.getHists3(closes);
      const mc = MC[market.split('_')[1]];


      if(last3[0] < 0 && last3[0] > last3[1] &&  last3[1] > last3[2] &&  mc.r6 > 0) {

        const reason = ' last  '+ last3[0].toPrecision(3)   + ' r6 ' + mc.r6;
        results.push({market, reason});
        sub.next(results);
      }
     /* const signal =  macd.tick(closes);




      if (signal === BuySellState.BUY_NOW && mc.r6 > 0) {
        const reason = signal + '   ' + macd.reason + ' r6 ' + mc.r6;
        results.push({market, reason});
        sub.next(results);
      }
*/
     // let result = CandlesAnalys1.getCandelsVolumes(market, candles, diff);


    } catch (e) {
      console.log(market);
      console.log(e);
    }

    this.scanning$.next( setTimeout(() =>
      this.scanNextPattern(markets, i, sub, candlesInterval, MC, results), 2000));

  }
  get scanResults$(){
    return this.scanResults.asObservable()
  }
  private scanResults: ReplaySubject<any[]> = new ReplaySubject(1);
  scanPatterns(markets: string[], candlesInterval: string, diff) {
    const sub: ReplaySubject<any[]> = new ReplaySubject(1);
    this.marketCap.getTicker().then(MC=>{
      this.scanning$.next(1);
      this.scanNextPattern(markets, -1, sub, candlesInterval, MC, []);
    });
    this.scanResults = sub;
    return sub;
  }

  ///////////////////////////

  // exchange = 'binance';
  // scanInterval;
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
  //isScanning = false;


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
      this.scanning$.next(false);
      return;
    }
    this.scanning$.next(true);
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

    this.scanning$.next( setTimeout(() => {
      this.nextScan(markets, i, api, sub, candlesInterval, cretaria, percent);
    }, 2000));

  }

  startScan(markets: string[], candlesInterval: string, cretaria: string, percent: number): Subject<any[]> {

    this.progressSub.next('SCAN UP STARED ' + candlesInterval);
    //  const api = this.apisPublic.getExchangeApi('binance');
    const sub = new BehaviorSubject<any[]>([]);
    this.nextScan(markets, -1, this.apisPublic.getExchangeApi('binance'), sub, candlesInterval, cretaria, percent);
    return sub;
  }


  stop() {
    clearInterval(this.scanning$.getValue());
    this.scanning$.next(0);
  }


  ////////////////////////////////// VOLUMES ////////////////////////////////////////////
  async volumeNext(markets: string[], i: number, candlesInterval: string, volumeChange: number, sub: Subject<any[]>, results: any[]) {
    i++;
    if (i >= markets.length) {
      sub.complete();
      this.scanning$.next(0);
      return;
    }

    const market = markets[i];
    let candles;

    try {
      candles = await this.apisPublic.getExchangeApi('binance').downloadCandles(market, candlesInterval, 120);
    } catch (e) {
      console.warn(e);
    }

    if (!candles) {
      this.scanning$.next(setTimeout(() =>
        this.volumeNext(markets, i, candlesInterval, volumeChange, sub, results), 10000));
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
    this.scanning$.next(setTimeout(() =>
      this.volumeNext(markets, i, candlesInterval, volumeChange, sub, results), 2000));
  }

  scanForVolume(markets: string[], candlesInterval: string, volumeChange: number) {
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


}
