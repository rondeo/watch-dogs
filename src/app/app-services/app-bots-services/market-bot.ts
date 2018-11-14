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
    this.stopLossOrder = new StopLossOrder(market, apiPrivate);
  }

  async sellCoinInstant() {
    console.log('%c !!!!! SELL COIN ' + this.market, 'color:red');
    console.log(this.balanceCoin);
    if (!this.balanceCoin) return;
    if ((this.balanceCoin.pending + this.balanceCoin.available) < (this.amountCoin + (this.amountCoin * 0.1))) {
      this.log(' NO BALANCE ');
      return;
    }
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

  async buyCoinInstant() {
    this.log('BUY COIN ');
    console.log('%c !!!!! BUY COIN ' + this.market, 'color:red');
    console.log(this.balanceCoin);
    console.log(this.balanceBase);
    if (!this.balanceBase) return;
    if ((this.balanceCoin.pending + this.balanceCoin.available) > (this.amountCoin - (this.amountCoin * 0.1))) {
      this.log(' BALANCE exists ');
      return;
    }

    /* this.apiPublic.downloadBooks2(this.market).toPromise().then(books => {
       const qty = this.amountCoin;
       const rate = UtilsBooks.getRateForAmountCoin(books.sell, qty);
       this.log(' BUY COIN by books price ' + qty + ' rate ' + rate);
       const result2 = this.apiPrivate.buyLimit2(this.market, qty, rate);
       this.log(' BUY COIN RESULT ' + JSON.stringify(result2));
     })*/
  }

  log(message: string) {
    console.log(moment().format('HH:mm') + ' ' + this.market + message);
    // this.history.push(message);
  }

  prevSpeed: number;
  boughtD: number;
  volD: number;
  prevPrice: number;

  prevMove:number;
  async tick() {
    const candles = await this.candlesService.getCandles(this.market);
   //  const vols = CandlesAnalys1.volumes(candles);
    const closes = CandlesAnalys1.closes(candles);
    const last = _.last(candles);
    const lastTime =moment(last.to).format('HH:mm');

    const LCD = MATH.percent(last.close, last.open)

    const ma3 = _.mean(_.takeRight(closes, 3));
    const ma7 = _.mean(_.takeRight(closes, 7));
    let ma3_7 = MATH.percent(ma3, ma7);

   /// const vloM = MATH.median(vols);
   /// const last3Max = _.max(_.takeRight(vols, 3));
   // const volAmpl = MATH.percent(last3Max, vloM);
    await UTILS.wait(10);
    const minVal = this.amountCoin * 0.1;
    let trades1: VOOrder[] = await this.apiPublic.downloadHistory(this.market);

    let trades = trades1.filter(function (item) {
      return item.amountCoin > minVal;
    });

    if (trades.length < 3) {

      return;
    }

    trades = _.orderBy(trades, 'timestamp');

    const minRange: number = +((_.last(trades).timestamp - _.first(trades).timestamp) / 60000).toFixed(2);

    this.timeout = setTimeout(() => this.tick(), (minRange > 0.5 ? minRange : 1) * 30 * 1000);

    /* if (!this.lastStamp) this.lastStamp = moment().subtract(5, 'minutes').valueOf();
     const lastStamp = this.lastStamp;
     trades = trades.filter(function (item) {
       return item.timestamp > lastStamp;
     });*/

    // const first = _.first(trades);
    // const last = _.last(trades);

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

    const avgRates = _.mean(rates);
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

    let speedD = -1;
    const speed = sum / minRange;
    if (this.prevSpeed) {
      speedD = MATH.percent(speed, this.prevSpeed);
    }


    this.prevSpeed = speed;
    this.boughtD = boughtD;
    this.volD = speedD;
    this.log(' ' + minRange + 'min   move ' + move + ' PD ' +  priceChange + ' ma3_7 ' + ma3_7 +  ' VD ' + speedD + ' LCD '  + LCD + ' close ' + last.close + ' T ' + lastTime);

    if(this.prevMove + move > 60){
      console.log('%c !!! ATTENTION ' + this.market)
    }
    this.prevMove = move;
    if (move > 60) {
      this.buyCoinInstant();
    } else if (move < -70) {
      this.sellCoinInstant();
    }

    // this.log(' sellPrices ' + sellPrices.toString() + ' buyPrices ' + buyPrices.toString())
    // if(soldD > 90) this.sellCoin(last.rate);
  }

  stop() {
    if (!this.timeout) return;
    clearTimeout(this.timeout);
    this.timeout = 0;
    this.log('ending tick')
  }

  start() {
    if (this.timeout) return;
    this.log(' starting tick');
    this.timeout = setTimeout(() => this.tick(), 30 * 1000);
  }

  sub1;
  sub2;

  private activeOrder: VOOrder;

  async init() {
    const ar = this.market.split('_');
    this.base = ar[0];
    this.coin = ar[1];

    this.sub1 = this.apiPrivate.balances$().subscribe(balances => {
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
    })
  }

  destroy() {
    this.log('destroy');
    this.stop();
    this.sub1.unsubscribe();
    this.sub2.unsubscribe();
  }


  timeout;


}
