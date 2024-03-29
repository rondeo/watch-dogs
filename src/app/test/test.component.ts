import {Component, OnInit} from '@angular/core';
import {BtcUsdtService} from '../a-core/app-services/alerts/btc-usdt.service';
import {VOCandle} from '../amodels/api-models';
import * as _ from 'lodash';
import {ApisPublicService} from '../a-core/apis/api-public/apis-public.service';
import * as moment from 'moment';
import {CandlesAnalys1} from '../a-core/app-services/scanner/candles-analys1';
import {MATH} from '../acom/math';
import {StorageService} from '../a-core/services/app-storage.service';
import {FollowOpenOrder} from '../a-core/apis/open-orders/follow-open-order';
import {ApisPrivateService} from '../a-core/apis/api-private/apis-private.service';
import {ApiMarketCapService} from '../a-core/apis/api-market-cap.service';
import {CandlesService} from '../a-core/app-services/candles/candles.service';
import {VOBalance} from '../amodels/app-models';
import {UTILS} from '../acom/utils';
import {TestCandlesService} from './test-candles.service';
import {CandlesUtils} from '../a-core/app-services/candles/candles-utils';

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
    private candlesService: CandlesService,
    private testService: TestCandlesService
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
  running = false;

  async saveCurrentAction(action: string) {
    const actionValues = (await this.storage.select('orderType-values')) || [];
    const exists = UTILS.find(this.currentValues, actionValues);
    if (exists) {
      console.log(exists);
      return;
    }
    this.currentValues.orderType = action;
    actionValues.push(this.currentValues);
    return this.storage.upsert('orderType-values', actionValues);
    this.storage.upsert('orderType-values', this.currentValues);
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
    // const result = await CandlesAnalys1.createState(this.candles);
   /* this.patterns = CandlesAnalys1.createPattern(this.patterns, result);

    const orderType = CandlesAnalys1.createAction(this.patterns, this.lastOrder);
    if (orderType) console.warn(orderType);

    // @ts-ignore
    if (orderType === 'BUY') this.buyCoin(lastCandle);
    else if (orderType === 'SELL') this.sellCoin(lastCandle);
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
    this.currentTime.add(5, 'minutes');
    //  await this.followOrder.tick();
    // this.currentTime.add(5, 'minutes')


   // this.tickBot(candles);

  }

  onStartClick() {
    this.running = !this.running;
    if(this.running) this.start();
    else this.stop();
  }

  start() {
    this.testService.getTicker('BTC_AST').subscribe(candles => {
      this.candles = candles;
      // console.log(candles);
      const closes = CandlesUtils.closes(candles);
      const volumes = CandlesUtils.volumes(candles);

      const mas = CandlesUtils.mas(closes);
      const vols = CandlesUtils.vols(volumes);

      console.log(' ma3_ma25 ' + MATH.percent(mas.ma3, mas.ma25));
      console.log(' ma3_ma7 ' + MATH.percent(mas.ma3, mas.ma7));


      console.log(' v3_med ' + MATH.percent(vols.v3, vols.med));
      console.log(' last_med ' + MATH.percent(vols.last, vols.med));

    });
    this.testService.start('2018-10-23T15:15')

  }

  stop() {
    this.testService.stop();
  }
}
