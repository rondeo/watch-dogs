import {StorageService} from '../../services/app-storage.service';
import {ApisPrivateService} from '../../apis/api-private/apis-private.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import * as _ from 'lodash';
import {VOBalance, VOOrder} from '../../models/app-models';
import {CandlesService} from '../candles/candles.service';
import {BuyOnDown} from './buy-on-down';
import {VOCandle} from '../../models/api-models';
import set = Reflect.set;
import {MATH} from '../../com/math';
import {UTILS} from '../../com/utils';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import * as moment from 'moment';
import {UtilsBooks} from '../../com/utils-books';
import {StopLossOrder} from './stop-loss-order';

export class MarketBot {


  constructor(
    public exchange: string,
    public market: string,
    public amountCoin: number,
    private storage: StorageService,
    private apiPrivate: ApiPrivateAbstaract,
    private apiPublic: ApiPublicAbstract,
    private candlesService: CandlesService
  ) {
    this.id = 'bot-' + market;
    this.init().then(() => {
      this.start();
    });

    //  this.stopLossOrder = new StopLossOrder(market, apiPrivate);
  }
  base: string;
  coin: string;
  balanceBase: VOBalance;
  balanceCoin: VOBalance;

  logs: string[] = [];
  id: string;
  private stopLossOrder: StopLossOrder;

  orders: any[] = [];
  prevAction: string;
  patterns: any[] = [];
  lastOrder: {stamp: number, action: string, price: number};
  prevPrice: number;

  interval;

  sub1;
  sub2;

  private activeOrder: VOOrder;


  timeout;

  async sellCoinInstant() {
    console.log('%c !!!!! SELL COIN ' + this.market, 'color:red');
    console.log(this.balanceCoin);
    if (!this.balanceCoin || this.balanceCoin.available === 0 ) {
      this.log('SELL no Balance');
      return;
    }


    const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
    const qty = this.amountCoin;
    const rate = UtilsBooks.getRateForAmountCoin(books.buy, this.balanceCoin.available);
    const action = 'SELL';
    this.log({action, rate});

    this.balanceCoin = new VOBalance();
    this.balanceCoin.available = this.amountCoin;
    const balance =  this.amountCoin;
    this.log({action, rate, balance});
    this.balanceCoin.available = 0;
    this.balanceBase.available = 1000;


   /* if ((this.balanceCoin.pending + this.balanceCoin.available) < (this.amountCoin + (this.amountCoin * 0.1))) {
      this.log(' NO BALANCE ');
      return;
    }*/


    /* const result1 = await this.stopLossOrder.cancelOrder(this.stopLossOrder.order);
     this.log(' CANCEL ORDER RESULT ' + JSON.stringify(result1));
     setTimeout(() => {
       this.log(' Downloading books ');
       this.apiPublic.downloadBooks2(this.market).toPromise().then(books => {
         const qty = this.balanceCoin.available + this.balanceCoin.pending;
         const rate = UtilsBooks.getRateForAmountCoin(books.buy, this.balanceCoin.available);
         this.log(' SELL COIN by biooks price ' + qty + ' rate ' + rate);
         const result2 = this.apiPrivate.sellLimit2(this.market, qty, rate);
         this.log(' SELL COIN RESULT ' + JSON.stringify(result2));
       })
     }, 2000)*/
  }

  getBalanceCoin() {

  }

  getBalanceBase() {

  }


  async buyCoinInstant() {
    this.log(' BUY COIN ');
    console.log('%c !!!!! BUY COIN ' + this.market, 'color:red');
    if (!this.balanceBase) return;

    if (this.balanceCoin && (this.balanceCoin.pending + this.balanceCoin.available) > (this.amountCoin - (this.amountCoin * 0.1))) {
      this.log(' BALANCE exists ');
      return;
    }

    const action = 'BUY';
    const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
    const qty = this.amountCoin;
    const rate = UtilsBooks.getRateForAmountCoin(books.sell, qty);

    this.balanceCoin = new VOBalance();
    this.balanceCoin.available = this.amountCoin;
    const balance =  this.amountCoin;
    this.log({action, rate, balance});

    /* this.apiPublic.downloadBooks2(this.market).toPromise().then(books => {

       this.log(' BUY COIN by books price ' + qty + ' rate ' + rate);
       const result2 = this.apiPrivate.buyLimit2(this.market, qty, rate);
       this.log(' BUY COIN RESULT ' + JSON.stringify(result2));
     })*/
  }

  log(message: string | Object) {
    let out: string;
    if (typeof message !== 'string') out = UTILS.toString(message);
    else out = message;
    out = moment().format('HH:mm') + ' ' + this.market + out;
    console.log(out);
     this.logs.push(out);
  }
  async tick() {
    setTimeout(() => this.save(), 5000);
    const candles = await this.candlesService.getCandles(this.market);
    const lastCandle = _.last(candles);
    const lastPrice = lastCandle.close;
    if (this.prevPrice === lastPrice) return;
    this.prevPrice = lastCandle.close;
    const result = await CandlesAnalys1.createState(candles);
    this.patterns = CandlesAnalys1.createPattern(this.patterns, result);

    const action = CandlesAnalys1.createAction(this.patterns, this.lastOrder);
    if (action) console.warn(action);

    if (action === 'BUY') this.buyCoinInstant();
    else if (action === 'SELL') this.sellCoinInstant();
    const newPrice = CandlesAnalys1.getVolumePrice(this.patterns);
    console.log(' new price ' + newPrice);

    // this.log(' sellPrices ' + sellPrices.toString() + ' buyPrices ' + buyPrices.toString())
    // if(soldD > 90) this.sellCoin(last.rate);
  }

  stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = 0;
    this.log('ending tick');
  }

  start() {
    if (this.interval) return;
    this.log(' starting tick');
    this.interval = setInterval(() => this.tick(), 60 * 1000);
  }

  async init() {
    const ar = this.market.split('_');
    this.base = ar[0];
    this.coin = ar[1];
    this.balanceBase = new VOBalance();

    this.patterns = (await this.storage.select(this.id + '-patterns')) || [];
    this.orders = (await  this.storage.select(this.id + '-orders')) || [];

   /* this.sub1 = this.apiPrivate.balances$().subscribe(balances => {
      if (!balances) return;
      const bb = _.find(balances, {symbol: this.base});
      const bc = _.find(balances, {symbol: this.coin});
      this.balanceBase = bb;
      this.balanceCoin = bc;
    });

    this.sub2 = this.apiPrivate.allOpenOrders$().subscribe(orders => {
      if (!orders) return;

      const myOrder: VOOrder = <VOOrder>_.find(orders, {coin: this.coin});
      //  console.log(this.market + ' my order ', myOrder);
      this.activeOrder = myOrder;
    })*/
  }

  async save() {
    if (!this.patterns.length) return;
    this.storage.upsert(this.id + '-patterns', this.patterns);
    this.storage.upsert(this.id + '-orders', this.orders);
    if (!this.logs.length) return;
    let history: string[] = (await this.storage.select(this.id)) || [];
    history = history.concat(this.logs);
    this.logs = [];
    history = _.takeRight(history, 500);
    this.storage.upsert(this.id + '-logs', history);
  }

  destroy() {
    this.log('destroy');
    this.storage.remove(this.id);
    this.stop();
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2)this.sub2.unsubscribe();
  }


}
