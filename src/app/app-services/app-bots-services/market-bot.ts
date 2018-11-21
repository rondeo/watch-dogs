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

  private history: string[] = [];
  base: string;
  coin: string;
  balanceBase: VOBalance;
  balanceCoin: VOBalance;
  candlesInterval = '5m';

  id: string;
  private stopLossOrder: StopLossOrder;


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
    // this.buyOnDown = new BuyOnDown(market, this.apiPrivate);
    // this.buyOnDown.buySignal = (price) => {
    // this.buySignal(price);
    // }

    //this.buyCoin.log = (message) => {
    //  this.log(message);
    //};
    this.init().then(() => {
      this.start();
    });

    //  this.stopLossOrder = new StopLossOrder(market, apiPrivate);
  }

  async sellCoinInstant() {
    console.log('%c !!!!! SELL COIN ' + this.market, 'color:red');
    console.log(this.balanceCoin);
    if (!this.balanceCoin || this.balanceCoin.available ===0 ) {
      this.log('SELL no Balance');
      return;
    }


    const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
    const qty = this.amountCoin;
    const rate = UtilsBooks.getRateForAmountCoin(books.buy, this.balanceCoin.available);
    const action = 'SELL';
    this.log({action, rate});
    this.balanceCoin.available = 0;
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

  getBalanceCoin(){

  }

  getBalanceBase(){

  }
  async buyCoinInstant() {
    this.log('BUY COIN ');
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
    this.log({action, rate});

    this.balanceCoin = new VOBalance();
    this.balanceCoin.available = this.amountCoin;

    /* this.apiPublic.downloadBooks2(this.market).toPromise().then(books => {

       this.log(' BUY COIN by books price ' + qty + ' rate ' + rate);
       const result2 = this.apiPrivate.buyLimit2(this.market, qty, rate);
       this.log(' BUY COIN RESULT ' + JSON.stringify(result2));
     })*/
  }

  async saveCurrentAction(action: string){

    const actionValues = (await this.storage.select('action-values')) || [];
    const exists = UTILS.find(this.currentValues, actionValues);

    if(exists) {
      console.log(exists);
      return;
    }
    this.currentValues.action = action;
    actionValues.push(this.currentValues);
    return this.storage.upsert('action-values', actionValues);
    this.storage.upsert('action-values', this.currentValues)
  }

  log(message: string | Object) {
    let out: string;
    if (typeof message !== 'string') out = UTILS.toString(message);
    else out = message;
    out = moment().format('HH:mm') + ' ' + this.market + out;
    console.log(out);
    this.history.push(out);
    // this.history.push(message);
  }

  volMinute: number;
  boughtD: number;
  // volD: number;
  prevPrice = 1;
 // prevVolume = 1;
  prevMove = 0;
  currentValues:any;
  async tick() {
    setTimeout(() => this.save(), 5000);
    const candles = await this.candlesService.getCandles(this.market);
    const lastCandle = _.last(candles);

    if (this.prevPrice === lastCandle.close) return;
    this.prevPrice = lastCandle.close;

    const closes = CandlesAnalys1.closes(candles);
    const volumes = CandlesAnalys1.volumes(candles);

    const lastPrice = _.mean(_.takeRight(closes, 3));
    const lastVolume = _.mean(_.takeRight(volumes, 3));

    const preLastVolume = _.mean(_.take(_.takeRight(volumes, 6),3));

    const preLastPrice =  _.mean(_.take(_.takeRight(closes, 6),3));

    const PD = MATH.percent(lastPrice, preLastPrice);

     const VD = MATH.percent(lastVolume, preLastVolume);

    const mas = CandlesAnalys1.mas(candles);
    const vols = CandlesAnalys1.vols(candles);

    const ma3_25 = MATH.percent(mas.ma3, mas.ma25);
    const ma25_99 = MATH.percent(mas.ma25, mas.ma99);
    const v3_25 = MATH.percent(vols.v3, vols.v25);
    const v3_med = MATH.percent(vols.v3, vols.vmed);

    const actionValues = await this.storage.select('action-values');

    this.currentValues = {PD, ma3_25, ma25_99, VD, v3_25, v3_med};

    this.log(this.currentValues);

    if(!actionValues) return;
    const result = UTILS.find(this.currentValues, actionValues);

    if(result) this.log(result);




    const minPrice = _.min(closes);


    /*const now = Date.now();
    const minAgo = moment().subtract(5, 'minutes').valueOf();
    const minVal = this.amountCoin * 0.5;

    let trades1: VOOrder[] = await this.apiPublic.downloadHistory(this.market);
    // trades1 =  _.orderBy(trades1, 'timestamp');
    let minRange: number = +((_.first(trades1).timestamp - _.last(trades1).timestamp) / 60000).toFixed(2);

    if (minRange < 0.5 ) minRange = 2;
    else if (minRange > 5) minRange = 5;
    this.timeout = setTimeout(() => this.tick(), (minRange * 30 * 1000));

    let trades = trades1.filter(function (item) {
      return item.amountCoin > minVal && item.timestamp > minAgo;
    });




    if (trades.length < 3) {
        this.log(minRange + ' min NO VOLUME  in trades ' + minVal);
      return;
    }





    const fishes = trades;//_.takeRight(_.orderBy(trades, 'amountCoin'), 20);


    let sum = 0;
    let bought = 0;
    let sold = 0;
    // const sellPrices = [];
    // const buyPrices = [];

    const rates = [];

    fishes.forEach(function (item) {
      if (item.action === 'BUY') {
        bought += item.amountCoin;
        //  buyPrices.push(item.rate);
      }
      else {
        sold += item.amountCoin;
        // sellPrices.push(item.rate);
      }
      rates.push(item.rate);
      sum += item.amountCoin;
    });



    const avgRates = MATH.median(rates);
    let priceChange = 0;
    if (this.prevPrice) {
      priceChange = MATH.percent(avgRates, this.prevPrice);
    }

    this.prevPrice = avgRates;
    const l = fishes.length;
    sum = sum / l;
    bought = bought / l;
    sold = sold / l;
    const boughtD = +(100 * bought / sum).toFixed(2);
    const soldD = +(100 * sold / sum).toFixed(2);

    const move = Math.round(boughtD - soldD);

    const BUYD = MATH.percent(boughtD, soldD);

    let volD = -1;
    const volMin = sum / minRange;


    if (this.volMinute) {
      volD = MATH.percent(volMin, this.volMinute);
    }

    this.volMinute = volMin;
    this.boughtD = boughtD;
   //  this.volD = speedD;
    const diff = move - this.prevMove;


    await UTILS.wait(10);

    const candles = await this.candlesService.getCandles(this.market);
    //  const vols = CandlesAnalys1.volumes(candles);
    const closes = CandlesAnalys1.closes(candles);
    const last = _.last(candles);
    const lastTime = moment(last.to).format('HH:mm');
    const COD = MATH.percent(last.close, last.open);
    const ma3 = _.mean(_.takeRight(closes, 3));
    const ma7 = _.mean(_.takeRight(closes, 7));
    let ma3_7 = MATH.percent(ma3, ma7);

    const message = ' diff ' + diff + '  move ' + move + ' PD ' + priceChange + ' VD ' + volD + ' n '+trades.length+' m3_7 ' + ma3_7 + ' COD '+ COD;
    this.log(message);

   /!* if (diff > 60 || diff < -60) {
      console.log('%c !!! ATTENTION ' + this.market + ' diff ' + diff + ' now ' + move + ' prev ' + this.prevMove, 'color:red');
    }*!/

    this.prevMove = move;
    if (move > 60) {
      this.buyCoinInstant();
    } else if (move < -70) {

      this.sellCoinInstant();
    }
*/

    // this.log(' sellPrices ' + sellPrices.toString() + ' buyPrices ' + buyPrices.toString())
    // if(soldD > 90) this.sellCoin(last.rate);
  }

  stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = 0;
    this.log('ending tick')
  }

  interval

  start() {
    if (this.interval) return;
    this.log(' starting tick');
    this.interval = setInterval(() => this.tick(), 60 * 1000);
  }

  sub1;
  sub2;

  private activeOrder: VOOrder;

  async init() {
    const ar = this.market.split('_');
    this.base = ar[0];
    this.coin = ar[1];
    this.balanceBase = new VOBalance();
    this.balanceCoin;

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
    if (!this.history.length) return;
    let history: string[] = (await this.storage.select(this.id)) || [];
    history = history.concat(this.history);
    this.history = [];
    history = _.takeRight(history, 500);
    this.storage.upsert(this.id, history);
  }

  destroy() {
    this.log('destroy');
    this.storage.remove(this.id);
    this.stop();
    this.sub1.unsubscribe();
    this.sub2.unsubscribe();
  }


  timeout;


}
