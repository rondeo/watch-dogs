import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {VOCandle} from '../../models/api-models';
import {StorageService} from '../../services/app-storage.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

export class CandlesData {
  exchange: string;
  private i: number = -1;

  subscribedMarkets: string[] = [];

  collection: { [id: string]: Subject<{ exchange: string, market: string, candles: VOCandle[] }> } = {};

  constructor(
    private api: ApiPublicAbstract,
    private storage: StorageService,
    private candlesInterval: string,
    private candlesLength: number,
    private overlap: number
    ) {

    this.exchange = api.exchange;
    setInterval(() => this.next(), 6000);
  }

  getExcludes(){
   return this.storage.select('exclude-markets-' + this.exchange);
  }

  getAllSubscriptions(): Observable<{ exchange: string, market: string, candles: VOCandle[] }>[] {
    return Object.values(this.collection).map(function (o) {
      return o.asObservable();
    })
  }

  async subscribe(market: string): Promise<Observable<{ exchange: string, market: string, candles: VOCandle[] }>> {
    const id = 'candles-' + this.exchange + '-' + market + '-' + this.candlesInterval;
    this.subscribedMarkets.push(market);

    if (!this.collection[id]) {
      let data: VOCandle[] = await this.storage.select(id);
      //if(!data) {
      // data = await this.api.downloadCandles(market, interval, 200)
      // }

      const sub = new Subject<{ exchange: string, market: string, candles: VOCandle[] }>();
      this.collection[id] = sub;
    }
    return this.collection[id].asObservable();
  }


  unsubscribe(market: string, interval: string) {
    const id = 'candles-' + this.exchange + '-' + market + '-' + interval;
    this.storage.remove(id);
    delete this.collection[id];
  }

  lastOverlap=0;

  private async next() {

    let market = localStorage.getItem('next-market' + this.exchange);
    if(!market) market = this.subscribedMarkets[0];
    const id = 'candles-' + this.exchange + '-' + market + '-' + this.candlesInterval;
    const exchange = this.exchange;

    const sub = this.collection[id];
    let oldCandels = await this.storage.select(id);
    let candles;
    if (!oldCandels) {
      candles = await this.api.downloadCandles(market, this.candlesInterval, this.candlesLength);
      candles.forEach(function (o) {
        o.time = moment(o.to).format('HH:mm');
      });
    }
    else {
      const overlap = this.overlap;
      let newCandles: VOCandle[] = await this.api.downloadCandles(market, this.candlesInterval, overlap);
      newCandles.forEach(function (o) {
        o.time = moment(o.to).format('HH:mm');
      });

      const first = _.first(newCandles);
      candles = oldCandels.filter(function (o) {
        return o.to < first.to
      });
      this.lastOverlap = oldCandels.length - candles.length;
      console.log('overlap '+ this.lastOverlap);
      candles = _.takeRight(candles.concat(newCandles), this.candlesLength);
    }

    const excluded: string[] = ((await this.getExcludes()) || []).map(function (o) {
      return o.market;
    });

    let available = _.difference(this.subscribedMarkets, excluded);
    let ind = available.indexOf(market);
    if (ind === -1 || ind === available.length - 1) ind = 0;
    else ind++;
    const nextMarket = available[ind];
    console.log(moment().format('HH:mm')+ ' ' + market + ' next ' + nextMarket + ' of ' + available.length);

    localStorage.setItem('next-market' + this.exchange, nextMarket);

    sub.next({exchange, market, candles});
    this.storage.upsert(id, candles);
  }
  removeCandles(market: string){
    const id = 'candles-' + this.exchange + '-' + market + '-' + this.candlesInterval;
    return this.storage.remove(id);
  }

  removeAllCandles() {
    this.subscribedMarkets.forEach(async (o) =>{
      await this.removeCandles(o);
    })
  }

  async getCandles(market: string) {
    const id = 'candles-' + this.exchange + '-' + market + '-' + this.candlesInterval;
    return this.storage.select(id);
  }
}
