import { Injectable } from '@angular/core';

import {VOCandle} from '../../../amodels/api-models';
import * as _ from 'lodash';
import * as moment from 'moment';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class Candles15minService {

  private candles: { [market: string]: BehaviorSubject<VOCandle[]> } = {};

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService
  ) {
    //setInterval(() => this.updateCandles(), 6e4);
  }

  private currentMarket: string;

  private timeout;
  private updateCandles() {
    const markets = Object.keys(this.candles);
    if(markets.length === 0) {
      this.timeout = null;
      return;
    }
    let ind = markets.indexOf(this.currentMarket);
    ind++;
    if(ind >= markets.length) ind = 0;
    let timeout = (15 * 6e4) / markets.length;

    if(timeout < 10000) timeout = 10000;

    this.timeout = setTimeout(() => this.updateCandles(), timeout);
    this.currentMarket = markets[ind];
    let candles: VOCandle[] = this.candles[this.currentMarket].getValue();

    const lastTo = candles.length?_.last(candles).to:0;

    const diff = moment().diff(lastTo, 'minutes');
    if(diff > 15) {
      this.getCandlesAfter(this.currentMarket, lastTo).then(newCandles => {
        console.log(this.currentMarket + ' new candles ', newCandles);
        if(candles.length) {
          const fromTime = newCandles[0].to;
          candles = candles.filter(function (item) {
            return item.to < fromTime;
          });

          candles = candles.concat(newCandles);
          const id = 'candles-' +this.currentMarket;
          this.candles[this.currentMarket].next(candles);
          this.storage.upsert(id, candles);
        }
      })
    }

    setTimeout(() => this.removeWithoutSubscription(), 10);

  }

  private removeWithoutSubscription() {
    for(let str in this.candles) {
      if(this.candles.hasOwnProperty(str)) {
        const b: BehaviorSubject<VOCandle[]> = this.candles[str];
        if(b.observers.length === 0) delete this.candles[str];
      }
    }
  }

  subscribe$(market: string): BehaviorSubject<VOCandle[]> {
    if(!this.candles[market]) this.candles[market] = new BehaviorSubject([]);
    if(!this.timeout) this.updateCandles();
    return this.candles[market]
  }

  private async getCandlesAfter(market: string, after: number,  exchange = 'binance') {
    const now = moment().valueOf();
    const id = 'candles-' + market;
    let limit = 3;
    if(after=== 0 ) limit = 200;
    else {
      const diff = moment().diff(after, 'minutes');
      limit = Math.ceil(diff / 15);
      console.log('candles ' + market + ' limit ' + limit);
      limit+=2;
    }

    const api = this.apisPublic.getExchangeApi(exchange);
    console.log('  ' + market + ' downloading candles ' + limit);
    let candles = await api.downloadCandles(market, '15m', limit);

   candles.forEach(function (item) {
      item.time = moment(item.to).format('HH:mm');
    });
    return candles;
  }
}
