import { Component, OnInit } from '@angular/core';
import {BtcUsdtService} from '../app-services/alerts/btc-usdt.service';
import {VOCandle} from '../models/api-models';
import * as _ from 'lodash';
import {ApisPublicService} from '../apis/api-public/apis-public.service';
import * as moment from 'moment';
import {CandlesAnalys1} from '../app-services/scanner/candles-analys1';
import {MATH} from '../com/math';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {

  candles: VOCandle[];
  constructor(
    private alerts: BtcUsdtService,
    private apisPublic: ApisPublicService
  ) {

  }

  ngOnInit() {
   this.initAsync();
  }

  start(){
    this.interval = setInterval(()=>this.main(), 10000);
    this.main();
  }
  stop(){
    clearInterval(this.interval);
    this.interval = 0;
  }

  interval;
  async initAsync() {
  /*
    (await this.alerts.oneMinuteCandles$()).subscribe(candles =>{

      this.candles = _.clone(candles);
    })*/
 // this.start();
  }

  currentTime = moment('2018-10-23T16:15');

 async  main(){
    this.currentTime.add(5, 'minutes')
   const candles =  await this.apisPublic.getExchangeApi('binance')
      .downloadCandles('BTC_AST','5m', 24, this.currentTime.valueOf());
  //   console.log(candles);
   /*const last10 = _.takeRight(.speeds(candles), 10);
   console.log(last10);
   const last4 = _.takeRight(last10, 4);
   const flast4 = last4.shift();

   const isFall = last4.every(function (o) {
     const prev = this.v;
     this.v = o;
     return o < prev;
   },{v:flast4});

   console.log(flast4, last4, isFall);
*/
    this.candles = candles;

  }
  onStopClick() {
   if(!this.interval) this.start();
   else this.stop();

    // this.alerts.stop();
  }
}
