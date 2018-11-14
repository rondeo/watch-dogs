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
import {MATH} from '../../com/math';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {MFI} from '../../trader/libs/techind';
import {ApiCryptoCompareService} from '../../apis/api-crypto-compare.service';

export interface VOMessage {
  time: string;
  market: string;
  message: string;
}

@Injectable()
export class ScanMarketsService {
  // exchange = 'binance';
  scanInterval;
  progressSub: Subject<string> = new Subject<string>();
  // favoritesSub: BehaviorSubject<any> = new BehaviorSubject(null);
  marketsTrendDown: BehaviorSubject<{ market: string, percent: number, x: string }[]>
    = new BehaviorSubject<{ market: string, percent: number, x: string }[]>(null);

  currentMarket: string;

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


  //////////////////////FAVORITES////////////////////////////////

  private favoriteSub$: BehaviorSubject<any[]>;

  async favorites$() {
    if (this.favoriteSub$) return Promise.resolve(this.favoriteSub$);
    this.favoriteSub$ = new BehaviorSubject((await this.storage.select('favorite-markets')) || []);
    return this.favoriteSub$
  }


  async addFavorite(market: string, message: string) {
    if(!market) return;
    this.favorites$().then(sub => {
      let favour = sub.getValue();
      // @ts-ignore
      favour = _.reject(favour, {market: market});
      favour.push({
        stamp: Date.now(),
        market,
        message
      });
      this.saveFavorites(favour)
    })
    // @ts-ignore


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
      this.saveFavorites(favour)
    })
  }


  /////////////////////////selected ////////////////////////////////

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
        selected.push(item)
      }
    })

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

  /* isFall(numbers: number[]): string {
     numbers = _.takeRight(numbers, 4);
     const speeds = MATH.speeds(numbers);
     const isFall = MATH.isFall(speeds);
     const per = MATH.percent(_.last(numbers), _.first(numbers));
     return isFall ? 'FALL ' + per : null;
   }
 */
///////////////////////////////////////////////////////  GOING UP ////////////////////////////////////////////


  trendUPTimer;

  private async _scanGoingUP(
    markets: string[],
    i,
    api: ApiCryptoCompareService,
    sub: Subject<VOMessage>,
    candlesInterval: string
  ) {
    i++;
    if (i >= markets.length) {
      sub.complete();
      this.stopTrendUp();
      return;
    }
    const market = markets[i];

    const candles1 = await api.downloadCandles(market, candlesInterval, 100);
    const time = moment().format('HH:mm');
    const result1 = CandlesAnalys1.mas(candles1);


    let onesec = new Promise((resolve, reject) => {
      setTimeout(() => resolve('1 sec'), 1000);
    });

    let ma25_99 = MATH.percent(result1.ma25, result1.ma99);
    const ma7_25 = MATH.percent(result1.ma7, result1.ma25);
    const ma7_99 = MATH.percent(result1.ma7, result1.ma99);
    let message = ' ma25-99 ' + ma25_99 + ' ma7-25 ' + ma7_25;


    this.progressSub.next(message);
    this.currentMarket = market;
    if (ma25_99 > 1 && ma7_99 > 0)
      sub.next({
        time,
        market,
        message
      });
    this.trendUPTimer = setTimeout(() => {
      this._scanGoingUP(markets, i, api, sub, candlesInterval);
    }, 1000)

  }

  async scanGoingUP(markets: string[], candlesInterval: string): Promise<Subject<{ market: string, message: string }>> {
    this.isScanning = true;
    this.progressSub.next('SCAN UP STARED '+  candlesInterval);
   //  const api = this.apisPublic.getExchangeApi('binance');

    let results: VOMessage[] = [];
    const sub = new Subject<VOMessage>();
    sub.subscribe(market => {
      results.push(market);
    }, console.error, () => {
      results = _.orderBy(results, 'market');
      this.progressSub.next('SCAN UP DONE ' + candlesInterval);
      this.isScanning = false;
    });

    this.trendUPTimer = setTimeout(()=>{
      this._scanGoingUP(markets, -1, this.apiCryptoCompare, sub, candlesInterval);
    }, 5000)

    return sub;
  }

  stopTrendUp() {
    clearTimeout(this.trendUPTimer);
    this.trendUPTimer = 0;
    this.isScanning = false;
  }

  stop() {
    clearInterval(this.scanInterval);
    this.scanInterval = 0;
  }


  ////////////////////////////////// VOLUMES ////////////////////////////////////////////
  async getVolumes() {
    return (await this.storage.select('scan-volumes')) || [];
  }

  deleteVolumes() {
    this.saveVolumes([]);

  }

  async deleteVolume(market: string) {
    let results: any[] = await this.getVolumes();
    // @ts-ignore
    results = _.reject(results, {market: market});
    this.saveVolumes(results)
    return results;
  }

  subVol: Subject<any[]> = new Subject();
  scanVolumeTimer;

  isScanning = false;


  volumeSub: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  volumeResults$() {
    const results = this.volumeSub.getValue();
    if (!results) {
      this.storage.select('scan-volumes').then(results => {
        this.volumeSub.next(results);

      })
    }
    return this.volumeSub.asObservable();
  }

  async volumeNext(markets: string[], i: number) {
    i++;
    if (i >= markets.length) {
      this.stopVolumeScan();
      return;
    }

    const market = markets[i];

    const candles = await this.apisPublic.getExchangeApi('binance').downloadCandles(market, '5m', 120);


    const closes = CandlesAnalys1.closes(candles);
    const last: VOCandle = _.last(candles);
    const time = moment(last.to).format('HH:mm');
    const volumes = _.map(candles, 'Volume');

    const before = volumes.slice(0, -10);
    const after = volumes.slice(-10);
    const avgBefore = _.mean(before);
    const avgAfter = _.mean(after);


    const priceBefore = _.mean(closes.slice(50, -10));
    const priceAfter = _.mean(closes.slice(-10));

    const volumeCnahge = MATH.percent(avgAfter, avgBefore);
    const priceChange = MATH.percent(priceAfter, priceBefore);

    const message = ' V: ' + volumeCnahge + ' P ' + priceChange

    this.currentMarket = market;

    console.log(market + message);
    this.progressSub.next(message);

    // const closes = CandlesAnalys1.closes(candles);
    // const ma25 = _.mean(_.takeRight(closes, 25));

    //  const decoded = CandlesAnalys1.decode(max);

    /* const tailD =Math.round( 100 * decoded.tail/ decoded.range);
     const wickD = Math.round(100 * decoded.wick/decoded.range);
     let message = ' tailD ' + tailD + ' wickD ' + wickD;*!/*/
    //  console.log(market , tailD);

// && Math.abs(amplUP) < 2 && Math.abs(amplDOWN) < 2
    if (volumeCnahge > 500) {
      const results = this.volumeSub.getValue() || [];

      results.push({time, market, message});
      this.saveVolumes(results);
    }

    this.scanVolumeTimer = setTimeout(() => this.volumeNext(markets, i), 2000);

  }

  async saveVolumes(results: any[]) {
    this.volumeSub.next(results);
    return await this.storage.upsert('scan-volumes', results);
  }

  async scanForVolume(markets: string[]) {

    this.isScanning = true;
    this.scanVolumeTimer = 1;
    this.saveVolumes([]);

    this.volumeNext(markets, -1);

    /*
        this.progressSub.next('SCANNING Volume');

        const out = [];

        const sub = this.candlesService.scanOnce(markets);

        sub.subscribe(async (data) => {

          const exchange = data.exchange;
          const market = data.market;

          const candles: VOCandle[] = _.takeRight(data.candles, 50);
          const last3 = _.takeRight(candles, 3);
          const last = _.last(candles);

          const sorted3 = _.orderBy(last3, 'Volume');
          const maxVol3 = _.last(sorted3);
          const indexMax3 = candles.indexOf(maxVol3);
          let prevPrice = (candles[indexMax3 - 1].low + candles[indexMax3 - 1].high) / 2;
          let nextPrice = maxVol3.close;
          let close = maxVol3.close;
          let low = maxVol3.low;
          if (indexMax3 !== candles.length - 1) {
            nextPrice = (candles[indexMax3 + 1].low + candles[indexMax3 + 1].high) / 2
          }

          const meds = CandlesAnalys1.meds(last3);
          let volumes = CandlesAnalys1.volumes(candles);
          /!* volumes = volumes.filter(function (item) {
             return item;
           })*!/
          const volumeMean = _.mean(volumes);

          const preiceChanges = MATH.percent(nextPrice, prevPrice);
          const volume2 = maxVol3.Volume;
          const volume2Change = Math.round(MATH.percent(volume2, volumeMean));

          const volumes3 = _.sum(CandlesAnalys1.volumes(last3));

          const D = Math.round(MATH.percent(volumes3, volumeMean));

          const timestamp = maxVol3.to;
          const time = moment(maxVol3.to).format('HH:mm');
          let result = time + ' v3: ' + D + '  preiceChanges ' + preiceChanges;

          this.currentMarket = market;
          this.progressSub.next(result);

          const results: any[] = await this.getVolumes();
          const exists: any = _.find(results, {market: market});
          if (exists) {
            const minutes = moment(last.to).diff(exists.timestamp, 'minutes');
            const candlesAfter = candles.filter(function (item) {
              item.to > exists.timestamp;
            });

            const wasClose = exists.close;
            const progressAfter = MATH.percent(last.close, wasClose);
            result = time + ' after: ' + minutes + '  ' + progressAfter;
            if (minutes > 30 && progressAfter < 0) {
              exists.result = time + ' REMOVE after  ' + minutes + ' ' + progressAfter;
            }
            exists.history[time] = result;
            await this.storage.upsert('scan-volumes', results);
            return;
          }


          //  console.log(market, result);
          // const sum = _.sum(last5);
          //  const LastMax = MATH.percent(max, mean);
          // console.log(market,D, maxIndex);
          if (D > 600) {
            console.log(market, D, volume2Change, preiceChanges);
            const history = {time: result};
            results.unshift({timestamp, market, result, close, low, history});

            await this.storage.upsert('scan-volumes', results);
            this.subVol.next(results);
          }

        }, err => {
        }, () => {
          this.isScanning = false;
          this.currentMarket = null;
          this.progressSub.next(' END scan Volume');
          this.scanVolumeTimer = setTimeout(() => this.scanForVolume(markets), 5 * 60 * 1000);
        });*/

    // return this.subVol;
  }

  stopVolumeScan() {
    clearTimeout(this.scanVolumeTimer);
    this.isScanning = false;
    this.scanVolumeTimer = 0
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

  first20coins = 'BTC,TUSD';//'ETH,LTC,EOS,XRP,BCH,BNB,ADA,NXT,TRX,DOGE,DASH,XMR,XEM,ETC,NEO,ZEC,OMG,XTZ,VET,XLM';
  deadMarkets = 'VEN,BCN,HSR,ICN,TRIG,CHAT,RPX';
  ////////////////////////////////////////////////////////////////////////////////////////////////////////


  //////////////////////////// MFI start
  scanMFITimer: any;
  mfiSub: BehaviorSubject<any[]> = new BehaviorSubject(null);

  async getMFIs() {
    let results = this.mfiSub.getValue();
    if (Array.isArray(results)) return Promise.resolve(results);
    else {
      results = (await this.storage.select('mfi-results')) || [];
      this.mfiSub.next(results);
    }
    return results
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
      return
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
          excist.intervals.push(candelsInterval)
        } else {
          const intervals = [candelsInterval]
          results.push({time, market, message, intervals})
        }

        ;
        this.saveMFIs(results);
      }

      this.scanMFITimer = setTimeout(() => this.nextMarketMFI(markets, i, candelsInterval), 2000);

    })
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
