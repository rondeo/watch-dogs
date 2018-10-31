import {VOBalance, VOBooks, VOOrder} from '../../models/app-models';
import {ApisPrivateService} from '../api-private/apis-private.service';
import {ApisPublicService} from '../api-public/apis-public.service';
import {ApiMarketCapService} from '../api-market-cap.service';
import * as _ from 'lodash';
import {CandlesService} from '../../app-services/candles/candles.service';
import {Observable} from 'rxjs/Observable';
import {VOCandle, VOMCObj} from '../../models/api-models';
import {MATH} from '../../com/math';
import * as moment from 'moment';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import {StorageService} from '../../services/app-storage.service';
import {CandlesAnalys1} from '../../app-services/scanner/candles-analys1';

export class FollowOpenOrder {
  static status: Subject<string> = new Subject<string>();
  base: string;
  coin: string;
  initOrder: { rate: number, fees: number, amountCoin: number, timestamp:number};
  stopLossOrder: VOOrder;
  balanceBase: VOBalance;
  balanceCoin: VOBalance;
  currentCoinRate: number;
  lastMessage: string;

  priceCounUS: number;
  candles: VOCandle[];
  constructor(
    public exchange: string,
    public market: string,
    private percentStopLoss: number,
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private storage: StorageService,
    private candlesService: CandlesService
  ) {

    const ar = market.split('_');
    this.base = ar[0];
    this.coin = ar[1];
    this.init();
    // console.log(this);

    // this.percentStopLoss = -1;
  }

  async init(){
   this.initOrder =   await this.storage.select('init-order' + this.exchange + this.market);
   if(!this.initOrder) await this.findInitOrder();
   await  this.subscribeForBalances();
    this.start();
  }

  async onNoBalance() {
    this.lastMessage = ' NO BALANCE ' + this.market;
    FollowOpenOrder.status.next(this.lastMessage);
    const last: any = _.last(this.candles) || {};
    last.timestamp = Date.now();
    return this.storage.upsert('no-balance'+  this.exchange + this.market, last);
    // throw new Error('no balance');
  }

  sub1: Subscription;

  async subscribeForBalances() {

    // return new Promise((resolve, reject) =>{
    const MC: VOMCObj = await this.marketCap.getTicker();
    this.priceCounUS = MC[this.coin] ? MC[this.coin].price_usd : 1;

    const apiPrivate = this.apisPrivate.getExchangeApi(this.exchange);
    this.sub1 = apiPrivate.balances$().subscribe(balances => {
      if (!balances) return;

      this.balanceBase = _.find(balances, {symbol: this.base});
      const balanceCoin = _.find(balances, {symbol: this.coin});

      if (this.balanceCoin && this.balanceCoin.available !== balanceCoin.available) {
        console.log(balanceCoin);
        this.lastMessage = ' balance changed  ' + balanceCoin.symbol + ' ' + this.balanceCoin.available + ' to ' + balanceCoin.available;
        FollowOpenOrder.status.next(this.lastMessage);
      }
      this.balanceCoin = balanceCoin;
    });


    /*apiPrivate.allOpenOrders$().subscribe(orders => {
      console.log(orders);
      const myOpenOrder = _.find(orders, {coin: this.coin, base: this.base, action: 'STOP_LOSS'});
      if (myOpenOrder) {
        this.stopLossOrder = myOpenOrder;
      } else {
        console.log(' no my stop loss order')
      }
    });*/


    /*this.apisPublic.getExchangeApi(this.exchange).ticker5min$(this.market).subscribe(ticker =>{
      console.log(ticker);
    })*/

  }

  async findInitOrder() {
    const allOrders = await this.apisPrivate.getExchangeApi(this.exchange).getAllOrders(
      this.base, this.coin,
      moment().subtract(23, 'hours').valueOf(),
      moment().valueOf()
    ).toPromise();
    console.log(allOrders);
    const buyOrders = _.filter(allOrders, {base: this.base, coin: this.coin, action: 'BUY'});
    if (buyOrders.length) {
      let rate = 0;
      let fees = 0;
      let amountCoin = 0;
      const timestamp = _.last(buyOrders).timestamp;
      buyOrders.forEach(function (o) {
        rate += +o.rate;
        fees += +o.fee;
        amountCoin += o.amountCoin;
      });
      rate = rate/buyOrders.length;
      const market = this.market;
      const initOrder = {
        market,
        rate,
        fees,
        amountCoin,
        timestamp
      };

      this.initOrder = initOrder;

    } else this.initOrder = {rate: 0, fees:0, amountCoin: 0, timestamp:0 }

    this.storage.upsert('init-order' + this.exchange + this.market, this.initOrder);
    console.warn(buyOrders);
    console.log(this.initOrder)
  }

  async sellCoin(percent: number, rate: number) {
    percent = percent / 100;
    const amountCoin: number = this.balanceCoin.available * percent;
    if (this.balanceCoin.available * this.priceCounUS * percent < 10) {
      throw new Error(' balance too low ' + (this.balanceCoin.available * this.priceCounUS * percent));
    }
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    try {
      const order = await api.sellLimit2(this.market, amountCoin, rate);
    } catch (e) {
      console.error(e);
    }
  }

  async cancelOrder(order: VOOrder) {
    const uuid = order.uuid;
    console.log(' canceling order ', order);
    const apiPrivate = this.apisPrivate.getExchangeApi(this.exchange);
    let result;
    try {
      result = await apiPrivate.cancelOrder(uuid, this.base, this.coin).toPromise();
    } catch (e) {
      console.log(this);
      console.error(e);
    }
  }

  getPrice(candles:VOCandle[]){
    const closes = _.takeRight(candles, 18).map(function (o) {
      return o.close;
    });

    const price = MATH.median(closes);
    if(isNaN(price)) throw new Error(this.market + closes.toString());
    return price;
  }


  async getCandles() {
    let candles: VOCandle[] = await this.candlesService.getCandles(this.exchange, this.market,'5m');
    if(!candles) throw new Error(' no candles ' + this.exchange +  this.market + '5m' );

    //const apiPublic = this.apisPublic.getExchangeApi(this.exchange);
   // let candles = await apiPublic.downloadCandles(this.market, '5m', 24);
    this.candles = candles;
    // console.log(candles);
    return candles
  }

  lastQuery: number = 0;

  async setStopLoss() {

    if (Date.now() - this.lastQuery < 10000) {
      throw new Error(' query fast ' + (Date.now() - this.lastQuery));
    }
    this.lastQuery = Date.now();

    const openOrders = this.apisPrivate.getExchangeApi(this.exchange).getAllOpenOrders();

    if (openOrders) {
      const myOrder = _.find(openOrders, {coin: this.coin});
      if (myOrder) {
        if(myOrder.action === 'BUY'){

        }else if(myOrder.action ==='SELL'){
          if(myOrder.stopPrice)  this.stopLossOrder = myOrder;
        }
        console.log(' ORDER IN PROGRESS ', myOrder);
        return;
      }
    }

    const candles = await this.getCandles();
    const last = _.last(candles);
    const currentPrice =  last.close;//    this.getPrice(candles);


    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const market = this.market;
    const qty = this.balanceCoin.available;
    const stopPrice = currentPrice + (currentPrice * this.percentStopLoss / 100);
    const sellPrice = stopPrice + (stopPrice * -0.001);
    this.lastMessage = 'SETTING new Order ' + this.market + ' ' + stopPrice + '  '+ qty;
    FollowOpenOrder.status.next(this.lastMessage);

    // console.log(' SET STOP LOSS ' + market, currentPrice,  stopPrice, sellPrice);

    try {
      const order = await api.stopLoss(market, qty, stopPrice, sellPrice);
      console.log('STOP LOSS order', order);
      if (order && order.uuid) setTimeout(() => {
        api.refreshBalances();
        api.refreshAllOpenOrders();
        console.log(order);
        if(order.stopPrice) this.stopLossOrder = order;
      }, 5e3);

    } catch (e) {
      if(e.error.msg.indexOf('immediately') !== -1) {
        this.percentStopLoss *=2;
        //const sellPrice = currentPrice + (currentPrice * this.percentStopLoss / 100);
      //  this.sellCoin(100, sellPrice);
      }
      console.error(e);
      if (e.toString().indexOf('no formatter') !== -1) {
        const books: VOBooks = await this.apisPublic.getExchangeApi(this.exchange).downloadBooks(this.base, this.coin).toPromise();
      }
      console.error(e);
    }
  }

  lastCheck: number;
  private async tick() {
    if(!this.balanceCoin){
      console.log('no balance coin ' + this.market);
      return
    }

    if ((this.balanceCoin.available + this.balanceCoin.pending) * this.priceCounUS < 10) {
      this.onNoBalance().then(()=>{
        this.destroy();
        this.onEnd();
      })
      return;
    }
   //  console.log(moment().format('HH:mm')+ ' ctr ' + this.market);
    const now = Date.now();
    if (now - this.lastCheck < 5e4) {
      console.log(' TOO FAST ctr ' + this.market);
      return
    }

    if (this.balanceCoin.available * this.priceCounUS > 10) {
      this.setStopLoss();
      return;
    }
    this.lastCheck = now;
    const coin = this.coin;
    if(!this.initOrder) {
      await this.findInitOrder();
      return;
    }

    if(!this.stopLossOrder) {
      await this.setStopLoss();
      return;
    }

    const candles =  await this.getCandles();

    const progress = CandlesAnalys1.progress(candles);

    const goingUp = CandlesAnalys1.goingUp(candles);
    // const  MA3 = CandlesAnalys1.MA3(candles);
   /* const openOrders = this.apisPrivate.getExchangeApi(this.exchange).getAllOpenOrders();
    if (!openOrders) {
      this.lastMessage = ' NO OPEN ORDERS ';
      FollowOpenOrder.status.next(this.lastMessage);
      return;
    }

    const myOrder: VOOrder = _.find(openOrders, {coin: this.coin});
    if (!myOrder) {
      this.lastMessage = ' NO MY ORDER';
      FollowOpenOrder.status.next(this.lastMessage);
      return
    }*/
    const currentPrice =  this.getPrice(candles);
    if(isNaN(this.stopLossOrder.stopPrice)) {
      console.log(this);
      return;
    }

    // console.log(currentPrice, this.stopLossOrder.stopPrice);
    const diff = MATH.percent(this.stopLossOrder.stopPrice, currentPrice);

    this.lastMessage = this.market + '  ' + diff + '  progress ' + progress + ' goingUp ' + goingUp;

    FollowOpenOrder.status.next(this.lastMessage);
    this.stopLossOrder.lastStatus = moment().format('HH:mm') + '  ' + diff;
    if (diff < (this.percentStopLoss - 1)) {
      this.lastMessage = 'CANCELLING ORDER ' + this.lastMessage + ' stop price: ' + this.stopLossOrder.stopPrice;
      FollowOpenOrder.status.next(this.lastMessage);

      if(this.stopLossOrder) {
        this.cancelOrder(this.stopLossOrder);
        this.stopLossOrder = null;
      }
      else this.setStopLoss();


    }
  }

  destroy() {
    console.log('DESTROY ' + this.exchange + this.market);
    this.stop();
    if (this.sub1) this.sub1.unsubscribe();

  }

  onEnd(){

  }
  checkInterval;

  start() {
    if (this.checkInterval) return;
    this.lastMessage = ' Start following ' + this.balanceCoin.symbol
    FollowOpenOrder.status.next(this.lastMessage);
    this.checkInterval = setInterval(() => this.tick(), moment.duration(3, 'minutes'));
  }

  stop() {
    this.lastMessage = ' STOPPING ' + this.market;
    FollowOpenOrder.status.next(this.lastMessage);
    clearInterval(this.checkInterval);
    this.checkInterval = null;

  }
}
