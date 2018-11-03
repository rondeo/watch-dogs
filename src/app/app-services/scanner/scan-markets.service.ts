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

@Injectable()
export class ScanMarketsService {
  // exchange = 'binance';
  scanInterval;
  progressSub: Subject<string> = new Subject<string>();
  favoritesSub: BehaviorSubject<any> = new BehaviorSubject(null);
  marketsTrendDown: BehaviorSubject<{ market: string, percent: number, x: string }[]>
    = new BehaviorSubject<{ market: string, percent: number, x: string }[]>(null);

  currentMarket: string;
  // scanners: { [index: string]: ScannerMarkets } = {};
  constructor(
    private apisPublic: ApisPublicService,
    private storage: StorageService,
    private marketCap: ApiMarketCapService,
    private candlesService: CandlesService
  ) {
    this.storage.select('favorite-markets').then(prefs => {
      this.favoritesSub.next(prefs);
    })

    /*this.storage.select('markets-trend-down').then(data => {
      if (data) data = data.map(function (item) {
        return Object.assign(item, {x: 'X'});
      })
      this.marketsTrendDown.next(data);
    })*/
  }



  addFavorite(market: string, message: string) {
    let favour: any[] = this.favoritesSub.getValue() || [];
    // @ts-ignore
    favour = _.reject(favour, {market: market});

    favour.push({
      stamp: Date.now(),
      market,
      message
    });
    this.storage.upsert('favorite-markets', favour);
    this.favoritesSub.next(favour);
  }

  removeFavorite(market: string) {
    let prefs: any[] = _.reject(this.favoritesSub.getValue(), {market: market});
    this.storage.upsert('favorite-markets', prefs);
    this.favoritesSub.next(prefs);
    return prefs;
  }


  isFall(numbers: number[]): string {
    numbers = _.takeRight(numbers, 4);
    const speeds = MATH.speeds(numbers);
    const isFall = MATH.isFall(speeds);
    const per = MATH.percent(_.last(numbers), _.first(numbers));
    return isFall ? 'FALL ' + per : null;
  }



  private _scanGoingUP(markets: string[], i, api: ApiPublicAbstract, sub: Subject<{ market: string, result: string }>, compare: number) {
    i++;
    if (i >= markets.length) {
      sub.complete();
      return;
    }
    const market = markets[i];
    api.downloadCandles(market, '1h', 100).then(async(candles) => {

      const closes = CandlesAnalys1.closes(candles);
      const meds = CandlesAnalys1.meds(candles);

      const ma99 = _.mean(closes);
      const ma7 =  _.mean(_.takeRight(closes, 7));
      const ma25 = _.mean(_.takeRight(closes, 25));


      const lastHours: number[] = _.takeRight(closes, 12);

      const priceLast24 = _.mean(lastHours);

      // const priceFirst24 = _.mean(_.take(closes, 24));

      const progress1 = MATH.percent(ma25, ma99);

      const progress2 = MATH.percent(ma7, ma25);

     //  const last3 = _.mean(_.takeRight(closes, 3));

      const last = _.last(lastHours);

      const meanlastHours = _.mean(lastHours);

      const max = _.max(lastHours);
      const min = _.min(lastHours);

      const percent = MATH.percent(last, meanlastHours);

       const maxD = MATH.percent( last, max);
      const minD = MATH.percent( last, min);
      const MC = await this.marketCap.getTicker();
      const coin = MC[market.split('_')[1]];
      let mc = '';
      if(coin){
        mc= ' r: '+ coin.rank + ' h: ' + coin.percent_change_1h +' d: ' + coin.percent_change_1h +' w: '+ coin.percent_change_7d;
      }

      const result = mc + ' p: '+ percent + ' max: ' + maxD + ' min: ' + minD + ' pr: ' + progress1 +' pr: ' + progress2;
      this.currentMarket = market;
      this.progressSub.next(result);
      console.log(market + result);
      if (progress1 > 0  && progress2 > 0) {
        sub.next({market, result});
      }

      setTimeout(() => {
        this._scanGoingUP(markets, i, api, sub, compare);
      }, 2000)

    })
  }


  async scanGoingUP(percent: number): Promise<Subject<{ market: string, result: string }>> {
    this.progressSub.next('SCAN UP STARED');
    const api = this.apisPublic.getExchangeApi('binance');
    const markets = await this.getAvailableMarkets('binance');
    let downs: { market: string, result: string }[] = [];
    const sub = new Subject<{ market: string, result: string }>();
    sub.subscribe(market => {
      downs.push(market);
    }, console.error, () => {
      downs = _.orderBy(downs, 'market');
      this.progressSub.next('SCAN UP DONE');
      this.storage.upsert('markets-trend-UP', downs);
    })

    this._scanGoingUP(markets, -1, api, sub, percent);
    return sub;
  }

  async getGoingUP() {
    return this.storage.select('markets-trend-UP');
  }

 async deleteCoingUpMarket(market: string){
    let markets: any[] = await this.getGoingUP();
    // @ts-ignore
   markets = _.reject(markets, {market:market});
   await this.storage.upsert('markets-trend-UP', markets);
   return markets
  }

  async deleteGoingUP() {
    return this.storage.remove('markets-trend-UP');
  }
/*

  private _scanGoingDown(markets: string[], i, api: ApiPublicAbstract, sub: Subject<{ market: string, percent: number }>) {
    i++;
    if (i >= markets.length) {
      sub.complete();
      return;
    }
    const market = markets[i];
    api.downloadCandles(market, '6h', 120).then(candles => {

      const closes = CandlesAnalys1.closes(candles);
      const last3 = _.mean(_.takeRight(closes, 3));
      const mean = _.mean(closes);
      const percent = MATH.percent(last3, mean);
      console.log(market, percent);
      if (percent < -2) sub.next({market, percent});

      setTimeout(() => {
        this._scanGoingDown(markets, i, api, sub);
      }, 2000)

    })
  }
*/


  /*async scanGoingDown() {

    const api = this.apisPublic.getExchangeApi('binance');
    const markets = await this.candlesService.getAvailableMarkets('binance');
    let downs: { market: string, percent: number }[] = [];
    const sub = new Subject<{ market: string, percent: number }>();

    sub.subscribe(market => {

      downs.push(market);
    }, console.error, () => {
      downs = downs.sort();
      this.storage.upsert('markets-trend-down', downs);

      this.marketsTrendDown.next(downs.map(function (item) {
        return Object.assign(item, {x: 'X'});
      }))
    })

    this._scanGoingDown(markets, -1, api, sub);

  }
*/
  async start() {
   /* if (this.scanInterval) {
      throw new Error(' scan is running ');
    }


    this.scanInterval = setInterval(async () => {
      let excludes1: any[] = (await this.getExcludes('binance')) || [];

      const now = Date.now();
      const excludes = excludes1.filter(function (o) {
        return o.postpone > now;
      });
      if (excludes1.length !== excludes.length) this.saveExcludes('binance', excludes);

      try {
        this.scanForFall();
      } catch (e) {
        console.error(e);
      }

    }, 7 * 60000);
    this.scanForFall();
*/

    // this.excludeDaysLoosers();
    // this.scanForPumpedUp();
    // this.scanForGoingUp();

    /* await this.candlesService.subscribeForAll();

     const subs = this.candlesService.getAllSubscriptions();


     subs.forEach((sub) => {
       sub.subscribe(data => {
         //  console.log(data);
         this.onCandles(data);
       })
     })*/
  }


  stop() {
    clearInterval(this.scanInterval);
    this.scanInterval = 0;
    this.candlesService.stop();
  }

  /*removeExcludes() {
    const exchange = 'binance';
    this.saveExcludes(exchange, []);
  }

  async removeExclude(exchange: string, market: string) {
    let excludes = (await this.getExcludes(exchange)) || [];
    excludes = _.reject(excludes, {market});
    await this.saveExcludes(exchange, excludes)
  }*/

 /* async addExclude(exchange: string, market: string, reason: string, hours: number) {
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

    this.saveExcludes(exchange, excludes);
  }
*/
  async clearMemory(exchange: string) {
    await this.storage.remove('scanner-markets-' + exchange);
    await this.storage.remove('exclude-markets-' + exchange);
    this.candlesService.removeAllCandles();
  }

 //  excludesSub: BehaviorSubject<any> = new BehaviorSubject(null);

  /*async getExcludes(exchange: string) {
    let v = this.excludesSub.getValue();
    if (!v) {
      this.excludesSub.next(await this.storage.select('exclude-markets-' + exchange));
    }
    return this.excludesSub.getValue();
  }

  saveExcludes(exchange: string, excludes: any[]) {
    this.excludesSub.next(excludes);
    this.storage.upsert('exclude-markets-' + exchange, excludes);
  }*/

 /* excludeDownTrend() {
    this.progressSub.next('START excludeDownTrend')
    const sub = this.candlesService.scanOnce('1d');
    sub.subscribe(async (data) => {
      const exchange = data.exchange;
      const market = data.market;
      const candles: VOCandle[] = data.candles;
      candles.pop();
      const closes: number[] = CandlesAnalys1.closes(candles);
      const mean = MATH.median(closes);
      //const first = _.first(candles);
      const last = _.last(closes);
      const percent = MATH.percent(last, mean);
      console.log(market, percent);
      if (Math.abs(percent) > 5) {
        this.addExclude(exchange, market, '11 days change ' + percent, 24);
      }
      //  this.candles[exchange + market] = data.candles;
      // const MC = await this.marketCap.getTicker();
      // const mc = MC[data.market.split('_')[1]];

      //  const res = await CandlesAnalys1.analyze(data, mc, null, this.notify.bind(this));
      // this.currentResultSub.next(res);
    }, err => {

    }, () => {
      this.progressSub.next('STOP excludeDownTrend')
    });

  }*/

  /*emtyTrendDown() {
    this.storage.upsert('markets-trend-down', []);
    this.marketsTrendDown.next([]);
  }*/


  ////////////////////////////////// VOLUMES ////////////////////////////////////////////
  async getVolumes(){
     return (await this.storage.select('scan-volumes')) || [];
  }
  deleteVolumes() {
    this.storage.remove('scan-volumes');
  }

  async deleteVolume(market: string) {
    let results: any[] = await this.getVolumes();
    results = _.reject(results)
    await this.storage.upsert('scan-volumes', results);
    return results;
  }
  subVol: Subject<any[]> = new Subject();
  scanVolumeTimer;

  async scanForVolume(markets: string[]) {

    this.scanVolumeTimer = 1;
    const results: any[] = await this.getVolumes();

    this.progressSub.next('SCANNING Volume');

    const out = [];

    const sub = this.candlesService.scanOnce(markets);

    sub.subscribe(async (data) => {
      const exchange = data.exchange;
      const market = data.market;

      const candles: VOCandle[] = _.takeRight(data.candles, 50);
      const last3 = _.takeRight(candles, 3);

      const sorted3 = _.orderBy(last3, 'Volume');
      const maxVol3 = _.last(sorted3);
      const indexMax3 = candles.indexOf(maxVol3);
      let prevPrice = (candles[indexMax3 - 1].low + candles[indexMax3 - 1].high) / 2;
      let nextPrice = maxVol3.close;
      if (indexMax3 !== candles.length - 1) {
        nextPrice = (candles[indexMax3 + 1].low + candles[indexMax3 + 1].high) / 2
      }

      const meds = CandlesAnalys1.meds(last3);

      let volumes = CandlesAnalys1.volumes(candles);
      /* volumes = volumes.filter(function (item) {
         return item;
       })*/
      const volumeMean = _.mean(volumes);

      const preiceChanges = MATH.percent(nextPrice, prevPrice);
      const volume2 = maxVol3.Volume;
      const volume2Change = Math.round(MATH.percent(volume2, volumeMean));

      const volumes3 = _.sum(CandlesAnalys1.volumes(last3));

      const D = Math.round(MATH.percent(volumes3, volumeMean));

      const result = ' v3: ' + D + ' max: ' + volume2Change + ' price: ' + preiceChanges + '  ' + moment(maxVol3.to).format('HH:mm');
      const date = moment().format('HH:mm');

      this.currentMarket = market;
      this.progressSub.next(result);
      console.log(market, result);
      // const sum = _.sum(last5);
      //  const LastMax = MATH.percent(max, mean);
      // console.log(market,D, maxIndex);
      if (D > 600) {
        console.log(market, D, volume2Change, preiceChanges);

       const exists:any = _.find(results, {market:market});
       if(exists){
         if(!exists.history) exists.history={};
         exists.history[date] = result;
       }else results.unshift({date, market, result});

        await this.storage.upsert('scan-volumes', results);
        this.subVol.next(results);
      }

    }, err => {
    }, () => {
      this.currentMarket = null;
      this.progressSub.next(' END scan Volume');
     this.scanVolumeTimer =  setTimeout(()=>this.scanForVolume(markets), 5* 60 *1000);
    });

    return this.subVol;
  }

  stopVolumeScan(){
    clearTimeout(this.scanVolumeTimer);
    this.candlesService.stop();
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

  async getAvailableMarkets(exchange: string){
    const data = await this.apisPublic.getExchangeApi(exchange).getMarkets();
    let markets = Object.keys(data);
    markets = markets.filter(function (o) {
      return o.indexOf('BTC') === 0;
    });
    const exclude = (this.deadMarkets + ',' + this.first20coins).split(',').map(function (o) {
      return 'BTC_' + o;
    });
    return  _.difference(markets, exclude);
  }

  first20coins = 'BTC,ETH,TUSD,PAX,HOT';//'ETH,LTC,EOS,XRP,BCH,BNB,ADA,NXT,TRX,DOGE,DASH,XMR,XEM,ETC,NEO,ZEC,OMG,XTZ,VET,XLM';
  deadMarkets = 'VEN,BCN,HSR,ICN,TRIG,CHAT,RPX';
  ////////////////////////////////////////////////////////////////////////////////////////////////////////
}
