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

@Injectable()
export class ScanMarketsService {
  // exchange = 'binance';
  scanInterval;
  statsSub: Subject<string> = new Subject<string>();
  favoritesSub: BehaviorSubject<any> = new BehaviorSubject(null);
  currentResultSub: Subject<any> = new Subject();

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

    this.storage.select('favorite-markets').then(prefs => {
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




  addFavorite(market: string, message: string) {
    let favour: any[] = this.favoritesSub.getValue() || [];
     // @ts-ignore
    favour = _.reject(favour, {market:market});

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
  }

 /* scanForVolumeJump() {
    this.statsSub.next('START scanForVolumeJump')
    const sub = this.candlesService.scanOnce('5m', 120);
    sub.subscribe(async (data) => {
      const exchange = data.exchange;
      const market = data.market;
      const candles = data.candles;
      this.candles[exchange + market] = candles;
      const res = await CandlesAnalys1.volumeJump(candles);
      console.log(market, res)
      // this.currentResultSub.next(res);
    }, err => {

    }, () => {
      this.statsSub.next('END scanForVolumeJump')
    });
  }*/

  isFall(numbers: number[]): string {
    numbers = _.takeRight(numbers, 4);
    const speeds = MATH.speeds(numbers);
    const isFall = MATH.isFall(speeds);
    const per = MATH.percent(_.last(numbers), _.first(numbers));
    return isFall ? 'FALL ' + per : null;
  }



  scanForFall() {
    this.statsSub.next('SCANNING scanForFall');

    const sub = this.candlesService.scanOnce('5m', 24);
    sub.subscribe(async (data) => {
      const exchange = data.exchange;
      const market = data.market;
      const candles: VOCandle[] = data.candles;
      const last3 = _.takeRight(candles, 3);

    /*  const times = last3.map(function (item) {
        return moment(item.to).format('HH:mm')
      }).join(',');
      console.log(times);*/
      const meds = CandlesAnalys1.meds(last3);

      const volumes = CandlesAnalys1.volumes(candles);
      const volumeMean = _.mean(volumes);
      const preiceChanges = MATH.percent(meds[2], meds[0]);
      const volume2 = last3[1].Volume;
      const volume2Change = MATH.percent(volume2, volumeMean);
      const volumes3 = _.sum(CandlesAnalys1.volumes(last3));

    //  const sorted: VOCandle[] = _.orderBy(candles, 'Volume').reverse();

     // const maxCandle = sorted[0];
      //const maxVolume = maxCandle.Volume;
    //  const maxIndex = candles.indexOf(maxCandle);
     // const last6 = _.takeRight(volumes, 6);
     // const max = _.max(last6);

      const D = MATH.percent(volumes3, volumeMean);
      const result =  'V '+D + ' V2 ' + volume2Change + ' PD '+ preiceChanges + ' T2 '+ moment(last3[1].to).format('HH:mm');
      const date = moment().format('HH:mm');

      this.currentResultSub.next({
        date,
        market,
        result
      });
      // const sum = _.sum(last5);
     //  const LastMax = MATH.percent(max, mean);
     // console.log(market,D, maxIndex);
      if(D > 1000){
        console.log(market, D, volume2Change, preiceChanges);

        this.notify({
          market,
          result
        })
      }/*else if( LastS > 3000){
        this.notify({
          market,
          message: 'V '+D + ' DS '+  LastS
        })
      }*/

     // const meds = CandlesAnalys1.meds(candles);
     // const volsJump = CandlesAnalys1.volumeJump(_.takeRight(candles, 30));

  /*    if (volsJump[0].p > 3000) {
        this.notify({
          market,
          message: volsJump.map(function (item) {
            return JSON.stringify(item);
          }).join(',')
        })
      }
      // const lasts =  _.takeRight(candles,1)

      // console.log(isFall,market, perc, speeds.toString());
      let message = this.isFall(meds);

      if (message) {
        this.notify({
          market,
          message,
          date: moment().format('HH:mm')
        })
      } else {

        const last10 = _.takeRight(meds, 10);

        const max = _.max(last10);
        const min = _.min(last10);
        const last = _.last(last10);
        const ampl = MATH.percent(max, min);
        const diff = MATH.percent(last, (min + max) / 2);
        message = ' ampl  ' + ampl + ' diff ' + diff;
        if (ampl > 1 && diff < -ampl / 3) {
          this.notify({
            market,
            message,

            x: 'X'
          })
        } else {
          if (ampl > 1 && diff > 0) {
            this.notify({
              market,
              message,
              a: 1,

            })
          }

        }


        //  console.log(market + ' ampl  '+ ampl + ' diff ' + diff);

        //const lastprice = CandlesAnalys1.lastPrice(meds);
        //const volumesJump = CandlesAnalys1.volumeJump(candles);

        /!*const allBuy = volumesJump.every(function (item) {
          return item.a === 'BUY'
        });*!/

        /!* if (allBuy) {
           let message = lastprice + '  V BUY ' + volumesJump.map(function (item) {
             return JSON.stringify(item);
           }).join('  ').replace(/[{}"]/g, ' ');
           this.notify({
             market,
             message,
             data: moment().format('HH:mm'),
             x: 'X'
           })
         }*!/

      }*/
    }, err => {
    }, () => {
      this.statsSub.next('ENDED scanForFall')
    });

  }

  scanGoingDown() {
    const sub = this.candlesService.scanOnce('5m', 120);
    sub.subscribe(async (data) => {
        const exchange = data.exchange;
        const market = data.market;
        const candles = data.candles;
        const closes = CandlesAnalys1.closes(candles);
        const last3 = _.mean(_.takeRight(closes, 3));
        const mean = _.mean(closes);
        const res = MATH.percent(last3, mean);
        console.log(market, res);

      }, err => {

      }, () => {
        this.statsSub.next('STOP scanGoingDown')
      }
    );

  }


 /* scanForGoingUp() {
    this.statsSub.next('START scanForGoingUp')
    const sub = this.candlesService.scanOnce('1m', 120);
    sub.subscribe(async (data) => {
      const exchange = data.exchange;
      const market = data.market;
      this.candles[exchange + market] = data.candles;
      const MC = await this.marketCap.getTicker();
      const mc = MC[data.market.split('_')[1]];
      const res = await CandlesAnalys1.analyze(data, mc, null, this.notify.bind(this));
      this.currentResultSub.next(res);
    }, err => {

    }, () => {
      this.statsSub.next('STOP scanForGoingUp')
    });

  }*/


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

      try{
        this.scanForFall();
      } catch (e) {
        console.error(e);
      }

    }, 4.5 * 60000);
    this.scanForFall();



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


  stop(){
    clearInterval(this.scanInterval);
    this.scanInterval = 0;
  }
  currentResult$() {
    return this.currentResultSub.asObservable();
  }




  removeExcludes() {
    const exchange = 'binance';
    this.saveExcludes(exchange, []);
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
      stamp: Date.now(),
      market,
      postpone,
      reason
    });

    this.saveExcludes(exchange, excludes);
  }

  async notify(data: any) {

    data.x = 'X';
    let notifications = await this.notifications();
    if (!notifications) return;

    // @ts-ignore
    let exists = _.find(notifications, {market: data.market});
    if (exists) {
      exists.N++;
      exists.history[String(exists.N)] = moment().format('HH:mm') + ' ' + data.result;
    } else {
      data.date = moment().format('HH:mm');
      data.N = 0;
      data.history = {};
      notifications.unshift(data);
      notifications = notifications.slice(0, 30);
    }
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

  excludesSub: BehaviorSubject<any> = new BehaviorSubject(null);

  async getExcludes(exchange: string) {
    let v = this.excludesSub.getValue();
    if (!v) {
      this.excludesSub.next(await this.storage.select('exclude-markets-' + exchange));
    }
    return this.excludesSub.getValue();
  }

  saveExcludes(exchange: string, excludes: any[]) {
    this.excludesSub.next(excludes);
    this.storage.upsert('exclude-markets-' + exchange, excludes);
  }

  async deleteNotification(exchange: string, market: string) {
    let notes: { market: string }[] = await this.notifications();
    notes = _.reject(notes, {market: market});
    this.dispatch(notes);
  }

  candles: any = {};

  /* async getCandles(exchange: string, market: string) {
     if (this.candles[exchange + market]) return Promise.resolve(this.candles[exchange + market]);
     return this.candlesService.getCandles(exchange, market);
   }*/

  deleteNotifications() {
    this.storage.remove('scanner-markets-notifications');
    this.notificationsSub.next([]);
    ;
  }

  excludeDownTrend() {
    this.statsSub.next('START excludeDownTrend')
    const sub = this.candlesService.scanOnce('1d', 11);
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
      this.statsSub.next('STOP excludeDownTrend')
    });

  }
}
