import {Component, OnInit} from '@angular/core';
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
import {UTILS} from '../com/utils';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {

  constructor(
    private alerts: BtcUsdtService,
    private apisPublic: ApisPublicService,
    private apisPrivate: ApisPrivateService,
    private storage: StorageService,
    private marketCap: ApiMarketCapService,
    private candlesService: CandlesService
  ) {

  }

  candles: VOCandle[];

  orders: any[] = [];

  currentValues: any;


  followOrder: FollowOpenOrder;

  prevPrice;

  prevAction: string;
  patterns: any[] = [];
  lastOrder: {stamp: number, action: string, price: number};

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


  currentTime = moment('2018-11-20T20:00');
  currentMarket = 'BTC_GO';
  lastStamp: number;

  interval;

  async saveCurrentAction(action: string) {

    const actionValues = (await this.storage.select('action-values')) || [];
    const exists = UTILS.find(this.currentValues, actionValues);

    if (exists) {
      console.log(exists);
      return;
    }
    this.currentValues.action = action;
    actionValues.push(this.currentValues);
    return this.storage.upsert('action-values', actionValues);
    this.storage.upsert('action-values', this.currentValues);
  }

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


  async getCandles() {
    this.currentTime.add(5, 'minutes');
    const candles = await this.apisPublic.getExchangeApi('binance')
      .downloadCandles('BTC_ARDR', '5m', 100, this.currentTime.valueOf());
    return candles;
  }

  buyCoin(candle: VOCandle) {
    const price = candle.close;
    const time = moment(candle.to).format('HH:mm');
    const stamp = candle.to;
    const action = 'BUY';
    if (this.prevAction === action) return;
    this.prevAction = action;
    const orders = this.orders || [];
    this.lastOrder =  {stamp, action, price};
    orders.push(this.lastOrder);
    this.orders = orders;
  }

  sellCoin(candle: VOCandle) {
    const time = moment(candle.to).format('HH:mm');
    const stamp = candle.to;
    const price = candle.close;
    const action = 'SELL';
    if (this.prevAction === action) return;
    this.prevAction = action;
    const orders = this.orders || [];
    this.lastOrder = {stamp, action, price };
    orders.push(this.lastOrder);
    this.orders = orders;
  }

  async tickBot(candles: VOCandle[]) {
    const lastCandle = _.last(candles);
    const lastPrice = lastCandle.close;
    if (this.prevPrice === lastPrice) return;
    this.prevPrice = lastCandle.close;
    const result = await CandlesAnalys1.createState(this.candles);
   /* this.patterns = CandlesAnalys1.createPattern(this.patterns, result);

    const action = CandlesAnalys1.createAction(this.patterns, this.lastOrder);
    if (action) console.warn(action);

    // @ts-ignore
    if (action === 'BUY') this.buyCoin(lastCandle);
    else if (action === 'SELL') this.sellCoin(lastCandle);
    const newPrice = CandlesAnalys1.getVolumePrice(this.patterns);
    console.log(' new price ' + newPrice);*/
  }


  async initAsync() {
    /*
      (await this.alerts.oneMinuteCandles$()).subscribe(candles =>{

        this.candles = _.clone(candles);
      })*/
    // this.start();
  }

  async tick() {
    this.currentTime.add(1, 'minutes');
    //  await this.followOrder.tick();
    // this.currentTime.add(5, 'minutes')
    const candles = await this.apisPublic.getExchangeApi('binance')
      .downloadCandles(this.currentMarket, '1m', 100, this.currentTime.valueOf());

    this.candles = candles;

    this.tickBot(candles);

  }

  onStartClick() {
    if (!this.interval) this.start();
    else this.stop();

    // this.alerts.stop();
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), 2000);
  }

  stop() {
    clearInterval(this.interval);
    this.interval = 0;
  }
}
