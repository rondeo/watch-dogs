import { Injectable } from '@angular/core';
import * as moment from 'moment';
import {ApisPublicService} from '../a-core/apis/api-public/apis-public.service';

import {VOCandle} from '../amodels/api-models';
import {Subject} from 'rxjs/internal/Subject';
import {HttpClient} from '@angular/common/http';
import {ApiPublicBinance} from '../a-core/apis/api-public/api-public-binance';
import {map} from 'rxjs/operators';

@Injectable()
export class TestCandlesService {
  constructor(
    private apisPublic: ApisPublicService,
    private http: HttpClient
  ) { }


  candlesSub:{[market:string]: Subject<VOCandle[]> } = {};

  currentTime

  interval;
  async tick() {
    this.currentTime.add(5, 'minutes');;
    console.log('tick');
    const markets:string[] = Object.keys(this.candlesSub);
    if(markets.length === 0) {
      this.stop()
    }
    markets.forEach( (market) => {
      const ar = market.split('_');
      this.getCandles(ar[1], this.currentTime.valueOf(), ar[0])
        .subscribe(res => this.candlesSub[market].next(res));
    });
  }

  start(fromTime: string) {
    if(this.interval || !fromTime) return;
    this.currentTime = moment(fromTime);
    this.interval = setInterval(() => this.tick(), 2000);
  }
  stop() {
    clearInterval(this.interval);
    this.interval = 0;
  }

  getTicker(market: string) {
    if(!this.candlesSub[market]) {
      this.candlesSub[market] = new Subject();
    }
    return  this.candlesSub[market];
  }

  getCandles(coin: string, timeTo: number, base = 'BTC'){
    const url = '/api/proxy-save/https://api.binance.com/api/v1/klines?symbol={{coin}}{{base}}&interval=5m&limit=100&endTime={{to}}'
      .replace('{{coin}}', coin)
      .replace('{{base}}', base)
      .replace('{{to}}', '' + timeTo);
    return this.http.get(url).pipe(map(ApiPublicBinance.mapCandles))
  }

}
