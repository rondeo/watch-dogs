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
import {ResistanceSupportController} from './resistance-support-controller';

export class MarketBot {
  resistanceSupport: ResistanceSupportController;
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

  logs: any[] = [];
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
    // console.log('%c !!!!! SELL COIN ' + this.market, 'color:red');
  //  console.log(this.balanceCoin);

   /* if (!this.balanceCoin || this.balanceCoin.available === 0 ) {
      this.log('SELL no Balance');
      return;
    }*/


    try{
      const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
      const qty = this.amountCoin;
      const rate = UtilsBooks.getRateForAmountCoin(books.buy, qty);
      const action = 'SELL';
      this.log({action, reason: ''+rate});
      this.balanceCoin = new VOBalance();
      this.log({action, reason: rate + ' ' +qty});
      this.balanceCoin.available = 0;
      this.balanceBase = new VOBalance();
      this.balanceBase.available = 1000;
    } catch (e) {
      this.log({action: 'ERROR', reason:'download books and buy coin  ' + e.toString()});
    }





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

    // console.log('%c !!!!! BUY COIN ' + this.market, 'color:red');


    /*if (this.balanceCoin && (this.balanceCoin.pending + this.balanceCoin.available) > (this.amountCoin - (this.amountCoin * 0.1))) {
      this.log(' BALANCE exists ');
      return;
    }
*/
    try {
      const action = 'BUY';
      const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
      const qty = this.amountCoin;
      const rate = UtilsBooks.getRateForAmountCoin(books.sell, qty);
      this.balanceCoin = new VOBalance();
      this.balanceCoin.available = qty;

      this.log({action, reason: rate + ' '+qty});
    } catch (e) {
      this.log({action: 'ERROR' , reason:'buy coin ' + e.toString()});
    }

    /* this.apiPublic.downloadBooks2(this.market).toPromise().then(books => {

       this.log(' BUY COIN by books price ' + qty + ' rate ' + rate);
       const result2 = this.apiPrivate.buyLimit2(this.market, qty, rate);
       this.log(' BUY COIN RESULT ' + JSON.stringify(result2));
     })*/
  }

  log(log: {action: string, reason: string}) {
   // if (typeof message !== 'string') out = UTILS.toString(message);
   // else out = message;
    const time = moment().format('HH:mm');
    const market = this.market;
    const out = Object.assign({time, market}, log);
   //  console.log(out);
     this.logs.push(out);
  }

  async tick() {
    setTimeout(() => this.save(), 5000);
    const candles = await this.candlesService.getCandles(this.market);

    const lastCandle = _.last(candles);
    const lastPrice = lastCandle.close;
    if (this.prevPrice === lastPrice) return;
    this.prevPrice = lastCandle.close;
    const toSell  =  CandlesAnalys1.isToSell(candles);

    if(toSell) {
      this.log(toSell);
      this.sellCoinInstant();
    }

    const result = await CandlesAnalys1.createState(candles);
    this.patterns = CandlesAnalys1.groupPatterns(this.patterns, result);


    /*

    const support = this.resistanceSupport.getSupportLevel(result.ma3);
   /!* if(support.length) {
     // console.log(this.market, support);
      const supResults = support.map(function (item) {
        return item.i + '  ' +item.v_D + ' ' + item.date;
      });
      result.sup = supResults.join( '; ');
    }
*!/

    const action = CandlesAnalys1.createAction(this.market, this.patterns, this.lastOrder, support);*/
  /*  if (action) {
      this.log(action);
      if (action.action === 'BUY') this.buyCoinInstant();
      else if (action.action === 'SELL') this.sellCoinInstant();
    }*/

   //  const newPrice = CandlesAnalys1.getVolumePrice(this.patterns);


    // this.log(' sellPrices ' + sellPrices.toString() + ' buyPrices ' + buyPrices.toString())
    // if(soldD > 90) this.sellCoin(last.rate);
  }

  stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = 0;
    this.log({action:'STOP', reason: 'tick'});
  }

  async start() {
    if (this.interval) return;
    let history: any[] = (await this.storage.select(this.id + '-logs')) || [];
    if(history.length === 0){
      const candles =  await this.candlesService.getCandles(this.market);
      const price = _.last(candles).close;
      this.log({action:'BOUGTH', reason: ' P ' + price});
    }

    this.interval = setInterval(() => this.tick(), 60 * 1000);
  }

  async init() {
    const ar = this.market.split('_');
    this.base = ar[0];
    this.coin = ar[1];
    this.balanceBase = new VOBalance();

    this.patterns = (await this.storage.select(this.id + '-patterns')) || [];
    this.orders = (await  this.storage.select(this.id + '-orders')) || [];

    this.resistanceSupport = new ResistanceSupportController(this.market, '15m', this.apiPublic, this.storage);
    await this.resistanceSupport.init();

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

  async deleteHistory(){
    await this.storage.remove(this.id + '-logs');
    await this.storage.remove(this.id + '-patterns');
    await this.storage.remove(this.id + '-orders');
    this.patterns = [];
    this.orders = [];
    this.logs = [];
  }

  async save() {
    if(this.patterns.length) this.storage.upsert(this.id + '-patterns', this.patterns);
   //  this.storage.upsert(this.id + '-orders', this.orders);
    if (!this.logs.length) return;
    let history: any[] = (await this.storage.select(this.id + '-logs')) || [];
    history = history.concat(this.logs);
    this.logs = [];
    history = _.takeRight(history, 500);
    this.storage.upsert(this.id + '-logs', history);
  }

  destroy() {
    this.log({action:'destroy', reason:''});
    this.storage.remove(this.id);
    this.deleteHistory();
    this.stop();
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2)this.sub2.unsubscribe();
    this.resistanceSupport.destroy();
  }


}
