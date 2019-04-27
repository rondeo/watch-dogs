import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';

import {VOCandle} from '../../../amodels/api-models';
import {StorageService} from '../../services/app-storage.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Observable, Subject} from 'rxjs';


export class CandlesData {
  constructor(
    private api: ApiPublicAbstract,
    private storage: StorageService,
    public candlesInterval: string
    ) {

    this.exchange = api.exchange;
   this.interval =  setInterval(() => this.step(), 10000);
  }
  exchange: string;
  private i = -1;

  interval;
  subscribedMarkets: string[] = [];
  statsSub: Subject<string> = new Subject();
  candlesSub: Subject<any> = new Subject();
  private subscriptions: { [id: string]: Subject<{ exchange: string, market: string, candles: VOCandle[] }> } = {};
  private candlesLength = 120;

  lastOverlap = 0;

  getExcludes() {
   return this.storage.select('exclude-markets-' + this.exchange);
  }

  getAllSubscriptions(): Observable<{ exchange: string, market: string, candles: VOCandle[] }>[] {
    return Object.values(this.subscriptions).map(function (o) {
      return o.asObservable();
    });
  }

  subscribe(market: string): Observable<{ exchange: string, market: string, candles: VOCandle[] }> {
    const id = 'candles-' + this.exchange + '-' + market + '-' + this.candlesInterval;
    if (this.subscribedMarkets.indexOf(market) === -1) this.subscribedMarkets.push(market);
    if (!this.subscriptions[id]) {
      const sub = new Subject<{ exchange: string, market: string, candles: VOCandle[] }>();
      /*this.storage.select(id).then(candles=>{

      }) */
      this.subscriptions[id] = sub;
    }
    return this.subscriptions[id].asObservable();
  }


  getInterval(): number {
    const units = this.candlesInterval.slice(-1);
    const num = +this.candlesInterval.slice(0, -1);
    if (isNaN(num)) throw new Error('candlesInterval ' +  num);
    const mult = units === 'm' ? 60e3 : 360e3;
    return num * mult;
  }

  unsubscribe(market: string) {
    const id = 'candles-' + this.exchange + '-' + market + '-' + this.candlesInterval;
    this.subscribedMarkets = _.reject( this.subscribedMarkets, market);
    this.storage.remove(id);
    delete this.subscriptions[id];
  }

  private async step() {
    let market = localStorage.getItem('next-market' + this.exchange);

    if (!market) market = this.subscribedMarkets[0];

    const id = 'candles-' + this.exchange + '-' + market + '-' + this.candlesInterval;
    const exchange = this.exchange;
    const sub = this.subscriptions[id];

    let oldCandels: VOCandle[] = await this.storage.select(id);
    let candles;

    if (!oldCandels) {
      candles = await this.api.downloadCandles(market, this.candlesInterval, this.candlesLength);
      candles.forEach(function (o) {
        o.time = moment(o.to).format('HH:mm');
      });
    } else {
      const diff: number = Date.now() - _.last(oldCandels).to;

      const interval = this.getInterval();
      let req = Math.ceil(diff / interval / 1000);
      if (req < 1) {
        console.log(' dont need ' + diff + '  ' +  this.candlesInterval);
        return;
      }
      if (req > this.candlesLength) req = this.candlesLength;
      console.log(market, req);

      let newCandles: VOCandle[] = await this.api.downloadCandles(market, this.candlesInterval, req);
      newCandles.forEach(function (o) {
        o.time = moment(o.to).format('HH:mm');
      });
      const first = _.first(newCandles);
      candles = oldCandels.filter(function (o) {
        return o.to < first.to;
      });
      this.lastOverlap = oldCandels.length - candles.length;
      candles = _.takeRight(candles.concat(newCandles), this.candlesLength);
    }


    let available = this.subscribedMarkets;
    let ind = available.indexOf(market);
    if (ind === -1 || ind === available.length - 1) ind = 0;
    else ind++;
    const nextMarket = available[ind];

   //  this.statsSub.next(this.exchange + ' '+ market +' OverLap: '+ this.lastOverlap + ' Avail: ' +  available.length);
   //  console.log(moment().format('HH:mm')+ ' ' + market + ' next ' + nextMarket + ' of ' + available.length);

    localStorage.setItem('next-market' + this.exchange, nextMarket);
    this.candlesSub.next({exchange, market, candles});
    sub.next({exchange, market, candles});
    this.storage.upsert(id, candles);
  }
  removeCandles(market: string) {
    const id = 'candles-' + this.exchange + '-' + market + '-' + this.candlesInterval;
    return this.storage.remove(id);
  }

  removeAllCandles() {
    this.subscribedMarkets.forEach(async (o) => {
      await this.removeCandles(o);
    });
  }

  async getCandles(market: string) {
    const id = 'candles-' + this.exchange + '-' + market + '-' + this.candlesInterval;
    return this.storage.select(id);
  }

  stop() {
    clearInterval(this.interval);
    this.interval = 0;

  }

  destroy() {
    this.stop();
    this.removeAllCandles();

  }
}
