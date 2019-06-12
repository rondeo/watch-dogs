import {Injectable} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {OrdersHistory} from '../market-history/orders-history';
import {CandlesMinutes} from './candles-minutes';
import * as _ from 'lodash';

import {VOCandle} from '../../../amodels/api-models';

import * as moment from 'moment';
import * as moment_round from 'moment-round';
import {Observable, Subject} from 'rxjs';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {filter, skip} from 'rxjs/operators';

@Injectable()
export class CandlesService {

  private candles15m: { [market: string]: BehaviorSubject<VOCandle[]> } = {};

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService
  ) {


    //  setInterval(() => this.updateCandles(), 5 * 6000);


    setInterval(() => {
     this.update5mCandles();
    }, 20000);
  }


  collection: { [id: string]: CandlesMinutes } = {};

  // canlesLength = 240;
  // overlap = 20;
  exchange = 'binance';

  candlesDatas: CandlesMinutes[];

  // userExclude = 'BCN,STORM,GRS,SC,DENT,NPXS,NCASH,PAX,BCC,FUN,TUSD,HOT,AMB,TRIG';

  candlesSub: Subject<{ exchange: string, market: string, candles: VOCandle[] }>
    = new Subject<{ exchange: string, market: string, candles: VOCandle[] }>();

  timeout;


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /* async updateLast2Candles(market, sub: BehaviorSubject<VOCandle[]>) {

     let candles: VOCandle[] = sub.getValue();

     if (candles.length === 0 || moment().diff(_.last(candles).to, 'minutes') > 20) {
       console.log(' DOWNLOADING candles for ' + market);
       candles = await this.apisPublic.getExchangeApi(this.exchange).downloadCandles(market, '15m', 120);
       candles.forEach(function (item) {
         item.time = moment(item.to).format('HH:mm');
       })
     }

     let minuteCandles = await this.getCandles(market);

     const timestampMinute = _.last(minuteCandles).to;

     const timestampLast = _.last(candles).to;
     console.log(moment(timestampLast).format('HH:mm:ss'), moment(timestampMinute).format('HH:mm:ss'));
     if (timestampMinute === timestampLast) {
       console.log(market + 'MINUTE candles same time ');
       return
     }

     if (minuteCandles.length < 30) {
       console.error(minuteCandles);

       return;
     }


     const lastFrom = moment().subtract(moment().minutes() % 15, 'minutes').second(0).valueOf();//.format('HH:mm:ss');

     const prevFrom = moment(lastFrom).subtract(15, 'minutes').valueOf();
     const to = moment().valueOf();


     const prev15min1m: VOCandle[] = minuteCandles.filter(function (item) {
       return item.to > prevFrom && item.to < lastFrom;
     });

     const last15min1m = minuteCandles.filter(function (item) {
       return item.to > lastFrom;
     });

     candles = candles.filter(function (item) {
       return item.to < prevFrom;
     });

     console.log(market + ' prev ' + prev15min1m.length + ' last15min1m ', last15min1m);

     const prev = CandlesAnalys1.createCandle(prev15min1m);
     const last = CandlesAnalys1.createCandle(last15min1m);

     candles.push(prev);
     candles.push(last);

     const err = CandlesAnalys1.checkCandles(candles.slice(0, -1), 15 * 60000);

     if (err.length) {
       console.log(err, candles);

     } else {
       candles = _.takeRight(candles, 120);
       sub.next(candles);
       this.storage.upsert(this.exchange + market + '15m', candles);
     }
   }*/

  updateNext1h(markets: string[], candles1h: { [market: string]: BehaviorSubject<VOCandle[]> }) {
    if (!markets.length) return;
    const market = markets.shift();
    const sub = candles1h[market];
    console.log('%c ' + market + ' downloading 100 candles 1h', 'color:#ffbf00');
    this.apisPublic.getExchangeApi('binance').downloadCandles(market, '1h', 100).then(candles => {
      sub.next(candles);
      setTimeout(() => this.updateNext1h(markets, candles1h), 20000);
    });
  }

  static removeUnused(candlesObj) {
    let markets = Object.keys(candlesObj).slice(0);
    markets.forEach(function (market) {
      const sub = candlesObj[market];
      if (!sub.observers.length) delete candlesObj[market];
    });
    return candlesObj;
  }

  updateCandles1h() {
    this.candles1h = CandlesService.removeUnused(this.candles1h);
    const markets = Object.keys(this.candles1h).slice(0);
    this.updateNext1h(markets, this.candles1h);

  }

  private candles1h: { [market: string]: BehaviorSubject<VOCandle[]> } = {};

  candles1h$(market: string) {
    if (!this.candles1h[market]) {
      const sub = new BehaviorSubject([]);
      ;
      this.candles1h[market] = sub;
      console.log('%c ' + market + ' downloading 100 candles 1h', 'color:#ffbf00');
      this.apisPublic.getExchangeApi('binance').downloadCandles(market, '1h', 100).then(candles => {
        sub.next(candles);
      })
    }
    return this.candles1h[market].asObservable().pipe(skip(1));
  }

  update5mCandles(){
    for(let market in this.candles5m) {
      if(this.candles5m[market].numSubscribers === 0) {
        this.candles5m[market].destroy();
        delete this.candles5m[market];
      }
    }

    const ar: CandlesMinutes[] = Object.values(this.candles5m);
    const now = Date.now();
   //  console.log(ar);
    const toUpdate: CandlesMinutes = ar.find(function (item) {
      return item.expire < now;
    });
    if(toUpdate) toUpdate.updateCandles();
   //  else console.log(' no candles to update');
  }

  private candles5m: { [market: string]: CandlesMinutes } = {};

  candles5m$(market: string) {
    if (!this.candles5m[market]) {
      this.candles5m[market] = new CandlesMinutes('binance', market, '5m', this.apisPublic, this.storage);
    }
    return this.candles5m[market].candles$.pipe(filter(v => !!v));
  }

  deleteCandles(market: string) {
    delete this.candles15m[market];
    this.storage.remove(this.exchange + market + '15m');
  }

  private _mas = {};
  private _volumes = {};
  private _closes = {};

  closes(market: string): number[] {
    if (!this._closes[market]) this._closes[market] = CandlesAnalys1.closes(this.candles15m[market].getValue());
    return this._closes[market];
  }

  mas(market: string): { ma3: number, ma7: number, ma25: number, ma99: number } {
    if (!this._mas[market]) this._mas[market] = CandlesAnalys1.mas(null, this.closes(market));
    return this._mas[market];
  }

  volumes(market: string) {
    if (!this._volumes[market]) this._volumes[market] = CandlesAnalys1.volumes(this.candles15m[market].getValue());
    return this._volumes[market];
  }


  candles15min$(market: string): Observable<VOCandle[]> {
    if (!this.candles15m[market]) {
      const sub = new BehaviorSubject([]);

      this.minuteCandles$(market).subscribe(candles1m => {
        if (!candles1m.length) return;
        //  console.log(market + ' 1 min candles triggered');
        let candles15m = sub.getValue();
        if (!candles15m.length) return;

        const timestamp = moment().subtract(moment().minutes() % 15, 'minutes').second(0).valueOf();
        const from1 = moment(timestamp).subtract(15, 'minutes').valueOf();
        const from2 = moment(timestamp).subtract(30, 'minutes').valueOf();

        const lastCandles = candles1m.filter(function (item) {
          return item.to > timestamp;
        });

        // console.log('15m last candles ' + lastCandles.length);

        const prevCandles = candles1m.filter(function (item) {
          return item.to < timestamp && item.to > from1;
        });

        const prev2Candles = candles1m.filter(function (item) {
          return item.to < from1 && item.to > from2;
        });

        const prevCandle = CandlesAnalys1.createCandle(prevCandles);
        const prev2Candle = CandlesAnalys1.createCandle(prev2Candles);

        candles15m = candles15m.filter(function (item) {
          return item.to < from2;
        });

        candles15m.push(prev2Candle);
        candles15m.push(prevCandle);

        if (lastCandles.length > 3) {
          const lastCandle = CandlesAnalys1.createCandle(lastCandles);
          candles15m.push(lastCandle);
        }


        // console.log(' 15m last 2 ' +candles15m[candles15m.length -2].time + ' ' +_.last(candles15m).time);
        //  console.log(_.map(candles15m, 'time'));


        candles15m = _.takeRight(candles15m, 200);

        sub.next(candles15m);
        this._volumes[market] = null;
        this._mas[market] = null;
        this._closes[market] = null;

        this.storage.upsert('candles-' + this.exchange + market + '15m', candles15m);

      });

      this.candles15m[market] = sub;

      this.storage.select('candles-' + this.exchange + market + '15m').then((candles: VOCandle[]) => {

        if (candles) console.log(market + ' 15m ' + moment().diff(_.last(candles).to, 'minutes') + ' min');

        if (candles && moment().diff(_.last(candles).to, 'minutes') < 25 && candles.length > 190) {

          sub.next(candles);
        } else {

          console.log('%c ' + market + ' download 200 candles 15m', 'color:#ffbf00');
          this.apisPublic.getExchangeApi(this.exchange).downloadCandles(market, '15m', 200).then(candles => {
            candles.forEach(function (item) {
              item.time = moment(item.to).format('HH:mm');

            });

            this.storage.upsert('candles-' + this.exchange + market + '15m', candles);
            // const closes = CandlesAnalys1.closes(candles);
            // this.closes15m$(market).next(closes);
            this._volumes[market] = null;
            this._mas[market] = null;
            this._closes[market] = null;
            sub.next(candles);
          })
        }

      })
    }

    return this.candles15m[market].asObservable();
  }

  /* async updateCandlesNext(markets: string[], i) {
     i++;
     if (i >= markets.length) {
       return;
     }
     const market = markets[i];
     const sub = this.candles15m[market];

     await this.updateLast2Candles(market, sub);
     setTimeout(() => this.updateCandlesNext(markets, i), 2000);
   }

   updateCandles() {
     //  console.log(moment().subtract(moment().minutes() % 15, 'minutes').minutes());

     const minutes = moment().minutes() % 15;
     // console.log(minutes);
     // const lastCandle = _.last(Object.values(this.candles15m)[0].getValue());
     if (minutes < 10) {
       console.log(minutes);
       return;
     }
     const subs = Object.values(this.candles15m);
     if (subs.length === 0) return;
     const markets = Object.keys(this.candles15m);
     if (markets.length) this.updateCandlesNext(markets, -1);
   }
 */
  getCandles15min(market: string) {
    if (this.candles15m[market]) return this.candles15m[market].getValue();
    return null;
  }


  statsSub: Subject<string> = new Subject();

  async init() {

  }

  saveSubscribed() {
    clearTimeout(this.timeout);
  }

  /* async getNewCandles(exchange: string, market: string, candlesInterval: string){
     const id = 'candles-'+exchange + market + candlesInterval;
     let oldCandels: VOCandle[] = await this.storage.select(id);
     if (oldCandels && oldCandels.length > 100) {
       const lastOld = _.last(oldCandels);
       const diff = moment().diff(lastOld.to, 'minutes');
       //  console.log(market + ' diff  min:' + diff ) ;
       if (diff < 5) {
         // console.log(oldCandels.length);
         return null;
       }
     }
     return this.getCandles( market);
   }
 */


  createOneCandle(candles: VOCandle[]): VOCandle {
    const first: VOCandle = _.first(candles);
    const last: VOCandle = _.last(candles);
    return {
      to: last.to,
      from: first.to,
      close: last.close,
      open: first.open,
      high: -1,
      low: -1,
      Volume: _.sum(CandlesAnalys1.volumes(candles))
    }
  }


  parseInterval(candlesInterval: string): number {
    const units = candlesInterval.slice(-1);
    const num = +candlesInterval.slice(0, -1);
    if (isNaN(num)) throw new Error('candlesInterval ' + num);
    const mult = units === 'm' ? 60e3 : 360e3;
    return num * mult;
  }

  async getOneMinuteCandles(exchange: string, market: string) {
    const id = 'candles-' + exchange + '-' + market + '-1m';
    let candles: VOCandle[] = (await this.storage.select(id));
    return candles;
  }

  private async getMiniteCandles(market: string, from: number, to: number) {
    const candles = await this.getCandles(market);
    return candles.filter(function (item) {
      return item.to > from && item.to < to;
    });
  }


  last15mCandle: VOCandle;


  private checkCandles(candles: VOCandle[], interval: number) {
    let prev = _.first(candles).to - interval;
    const err = [];
    candles.forEach(function (item, i) {
      const next = prev + interval;
      const diff = Math.round(Math.abs(item.to - next) / 30000);
      if (diff) err.push(i);
      prev = item.to;
    });
    return err;
  }

  minuteCandles$(market: string) {
    if (!this.minuteCandles[market]) this.minuteCandles[market] = new BehaviorSubject([]);
    return this.minuteCandles[market].asObservable();
  }

  minuteCandles: { [market: string]: BehaviorSubject<VOCandle[]> } = {};

  async getCandles(market: string) {
    const now = moment().valueOf();
    const api = this.apisPublic.getExchangeApi(this.exchange);
    const id = 'candles-' + market;
    let oldCandels: VOCandle[] = (await this.storage.select(id));

    if (!oldCandels || moment().diff(_.last(oldCandels).to, 'minutes') > 10) {
      console.log(market + ' 1m DOWNLOADING 200 candles')
      let candles = await api.downloadCandles(market, '1m', 200);
      candles = candles.filter(function (item) {
        return item.to < now;
      });
      await this.storage.upsert(id, candles);
      return candles;
    }

    const lastOld = _.last(oldCandels);
    const diff = moment().diff(lastOld.to, 'minutes');
    // console.log(market, diff);
    if (diff < 3) {
      // console.log(oldCandels.length);
      return oldCandels;
    }

    let limit = 5;
    if (diff > 5) limit = 11;

    console.log('%c ' + moment().format('HH:mm') + ' ' + market + ' 1m download new candles ' + limit, 'color:brown');
    // console.log(' updating candles ' + market + limit);
    let candles = await api.downloadCandles(market, '1m', limit);
    candles = candles.filter(function (item) {
      return item.to < now;
    });

    candles.forEach(function (item) {
      item.time = moment(item.to).format('HH:mm');
    });

    const firstTime = _.first(candles).to;

    oldCandels = oldCandels.filter(function (item) {
      return item.to < firstTime;
    });

    candles = oldCandels.concat(candles);
    const err = this.checkCandles(candles, 60000);

    if (err.length) {
      console.error(err);
      console.log(market + ' 1m DOWNLOADING 200 candles ');
      candles = await api.downloadCandles(market, '1m', 200);
      candles = candles.filter(function (item) {
        return item.to < now;
      });
    }

    if (this.minuteCandles[market]) this.minuteCandles[market].next(candles);
    else this.minuteCandles[market] = new BehaviorSubject(candles);
    await this.storage.upsert(id, _.takeRight(candles, 200));

    return candles;
  }

  getAllSubscriptions(): Observable<{ exchange: string, market: string, candles: VOCandle[] }>[] {
    const candles: CandlesMinutes[] = Object.values(this.collection);
    let out = [] = [];


    return out;
  }

  subscribe(exchange: string, market: string, candlesInterval: string) {
    let cdata: CandlesMinutes = _.find(this.candlesDatas, {exchange: exchange, candlesInterval: candlesInterval});
  }

  unsubscribe(exchange: string, market: string, interval: string) {
    let ctr: CandlesMinutes = this.collection[exchange];
    //  ctr.subscribe(market);
  }


  /* stop() {
     clearInterval(this.currentTimeout);
     this.currentTimeout = 0;
     /!* Object.values(this.collection).forEach(function (o) {
        o.destroy();
      });
      this.collection= {};*!/
   }*/
}
