import { Component, OnInit } from '@angular/core';
import {BtcUsdtService} from '../app-services/alerts/btc-usdt.service';
import {VOCandle} from '../models/api-models';
import * as _ from 'lodash';
import {ApisPublicService} from '../apis/api-public/apis-public.service';
import * as moment from 'moment';
import {CandlesAnalys1} from '../app-services/scanner/candles-analys1';
import {MATH} from '../com/math';
import {StorageService} from '../services/app-storage.service';
import {FollowOpenOrder} from '../apis/open-orders/follow-open-order';
import {ApisPrivateService} from '../apis/api-private/apis-private.service';
import {ApiMarketCapService} from '../apis/api-market-cap.service';
import {CandlesService} from '../app-services/candles/candles.service';
import {VOBalance} from '../models/app-models';
import {SellOnJump} from '../app-services/app-bots-services/sell-on-jump';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {

  candles: VOCandle[];

  orders: any[]

  constructor(
    private alerts: BtcUsdtService,
    private apisPublic: ApisPublicService,
    private apisPrivate: ApisPrivateService,
    private storage: StorageService,
    private marketCap: ApiMarketCapService,
    private candlesService: CandlesService
  ) {

  }

  followOrder:FollowOpenOrder;
  ngOnInit() {
   // this.followOrder = new FollowOpenOrder(
   /*   'binance',
      'BTC_ARDR',
      -4,
      this.apisPrivate,
      this.apisPublic,
      this.marketCap,
      this.storage,
      this.candlesService
    )
   // this.initAsync();
   // this.tradeHistory();

    this.followOrder.getCandles = this.getCandles.bind(this);
    this.followOrder.isTooFast = ()=>{ return false};
   /!* this.followOrder.start = ()=>{
      console.log('SATRT called')
    }*!/

   // this.followOrder.balanceCoin = new VOBalance()
    //this.followOrder.balanceCoin.available = 0;
   // this.followOrder.balanceCoin.pending = 1000;
    this.apisPrivate.getExchangeApi('binance').refreshBalances();

    setTimeout(()=>{
     /!* this.followOrder.stopLossOrder.checkStopLossPrice= (candles, qty)=>{

        console.log('check');
      }
      *!/
    }, 1000)*/


  }



 async getCandles(){
   this.currentTime.add(5, 'minutes')
   const candles =  await this.apisPublic.getExchangeApi('binance')
     .downloadCandles('BTC_ARDR','5m', 100, this.currentTime.valueOf());
   return candles;
  }


  async initAsync() {
  /*
    (await this.alerts.oneMinuteCandles$()).subscribe(candles =>{

      this.candles = _.clone(candles);
    })*/
 // this.start();
  }

  /*
  * '2018-10-23T16:15'
  *
  * 'BTC_AST'
  *
  * 6% down
  *
  *
  *
  * '2018-11-02T04:40'
  *
  * BTC_FUEL
  *
  * 2 jumps
  *
  *
  *'2018-11-02T11:17'
  *
  *
  * BTC_CDT
  *
  *
  * '2018-11-02T20:45'
  *going down
  *
  *
  *
  *
  * BTC_VIB
  * dont sell
  *
  * 2018-11-11T11:15'
  *
  * */



  currentTime = moment('2018-11-11T11:15');
  currentMarket = 'BTC_VIB';
  lastStamp:number;
 async  tick(){
   this.currentTime.add(3, 'minutes');
  //  await this.followOrder.tick();
    this.currentTime.add(5, 'minutes')
   const candles =  await this.apisPublic.getExchangeApi('binance')
      .downloadCandles(this.currentMarket,'5m', 100, this.currentTime.valueOf());

    const last = _.last(candles);
    if(this.lastStamp === last.to) return;
    this.lastStamp = last.to;

   this.candles = candles;
    SellOnJump.isJumpEnd(candles);
  }
  onStartClick() {
   if(!this.interval) this.start();
   else this.stop();

    // this.alerts.stop();
  }

  start(){
    this.interval = setInterval(()=>this.tick(), 2000);
  }
  stop(){
    clearInterval(this.interval);
    this.interval = 0;
  }

  interval;
}
