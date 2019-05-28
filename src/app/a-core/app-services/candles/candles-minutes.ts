import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';

import {VOCandle} from '../../../amodels/api-models';
import {StorageService} from '../../services/app-storage.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Observable, Subject} from 'rxjs';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {first} from 'rxjs/operators';


export class CandlesMinutes {
  id: string;
  minutes: number;
  expire = 0;
  expireStr: string;
  private candlesLength = 300;
  candles$: BehaviorSubject<VOCandle[]> = new BehaviorSubject(null);

  get numSubscribers() {
    return this.candles$.observers.length
  }

  constructor(
    public exchange: string,
    public market: string,
    public candlesInterval: string,
    private apisPublic: ApisPublicService,
    private storage: StorageService,
  ) {
    this.id = 'candles-' + exchange + '-' + market + '-' + candlesInterval;
    this.minutes = +candlesInterval.substr(0, 1);
    storage.select(this.id).then(candles => {
      if (candles) {
        const last: VOCandle = candles[candles.length - 1];
        this.expire = last.to + (this.minutes * 2 * 6e4);
        this.expireStr = moment(this.expire).format('HH:mm');
        if (this.expire > Date.now()) this.candles$.next(candles);
        // console.log(this.id, this.expireStr);
      }
    });
  }

  getCandles() {
    return this.candles$.getValue();
  }

  updateCandles() {
    const now = moment().valueOf();
    let length = this.candlesLength;
    let oldCandles = this.candles$.getValue() || [];
   if(oldCandles.length < this.candlesLength) oldCandles = [];
    if (oldCandles.length) {
      const missingMinutes = (now - oldCandles[oldCandles.length - 1].to) / 6e4;
      length = Math.ceil(missingMinutes / this.minutes) + 1;
      if (length > 50) {
        length = this.candlesLength;
        oldCandles = [];
      }
    }

    console.log('downloading candles ' + this.market + ' ' + length);
    this.apisPublic.getExchangeApi(this.exchange).downloadCandles(this.market, this.candlesInterval, length).then(newCandles => {

      const from = newCandles[0].to - 10;

      oldCandles = oldCandles.filter(function (item) {
        return item.to < from;
      });
      newCandles.forEach(function (item) {
        item.time = moment(item.to).format('HH:mm');
      });
      const candles = oldCandles.concat(newCandles);
      this.expire = now + (this.minutes * 2 * 6e4);
      this.expireStr = moment(this.expire).format('HH:mm');
      this.candles$.next(candles);
      this.storage.upsert(this.id, _.takeRight(candles, this.candlesLength * 2));
    })
  }

  destroy() {
    console.log('destroy ' + this.id);
    this.storage.remove(this.id);

  }
}
