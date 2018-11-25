import { Injectable } from '@angular/core';
import * as moment from 'moment';
import {ApisPublicService} from '../apis/api-public/apis-public.service';

import {VOCandle} from '../models/api-models';
import {Subject} from 'rxjs/internal/Subject';

@Injectable()
export class TestCandlesService {


  candlesSub: Subject<VOCandle[]> = new Subject()
  constructor(
    private apisPublic: ApisPublicService
  ) { }

  currentTime = moment('2018-11-06T01:35');
  async tick(){
    this.currentTime.add(5, 'minutes')
   const candles =  await this.apisPublic.getExchangeApi('binance')
      .downloadCandles('BTC_RDN','5m', 200, this.currentTime.valueOf());
    candles.forEach(function (item) {
      item.time = moment(item.to).format('HH:mm');
    });
    this.candlesSub.next(candles);
      }

  interval;
  start(){
    this.interval = setInterval(()=>this.tick(), 2000);
  }
  stop(){
    clearInterval(this.interval);
    this.interval = 0;
  }

}
