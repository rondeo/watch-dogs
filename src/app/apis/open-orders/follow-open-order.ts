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

export class FollowOpenOrder {
  static status: Subject<string> = new Subject<string>();
  base: string;
  coin: string;
  initOrder: VOOrder;
  stopLossOrder: VOOrder;
  balanceBase: VOBalance;
  balanceCoin: VOBalance;
  currentCoinRate: number;
  lastMessage: string;

  priceCounUS: number;

  constructor(
    public exchange: string,
    public market: string,
    private percentStopLoss: number,
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private candlesService: CandlesService
  ) {

    const ar = market.split('_');
    this.base = ar[0];
    this.coin = ar[1];

    this.subscribeForBalances();
    console.log(this);

    // this.percentStopLoss = -1;
  }


  onNoBalance() {
    throw new Error('no balance');
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
      if ((this.balanceCoin.available + this.balanceCoin.pending) * this.priceCounUS < 10) {
        this.lastMessage = ' NO BALANCE ' + this.balanceCoin.symbol;
        FollowOpenOrder.status.next(this.lastMessage);
        this.onNoBalance();
        this.destroy();
      } else if (this.balanceCoin.available * this.priceCounUS > 10) this.setStopLoss();
      else this.start();
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
    console.log(' canceling order ' + order.coin);
    const apiPrivate = this.apisPrivate.getExchangeApi(this.exchange);
    let result;
    try {
      result = await apiPrivate.cancelOrder(uuid, this.base, this.coin).toPromise();
    } catch (e) {
      console.error(e);
    }
  }

  async getPrice() {
    const apiPublic = this.apisPublic.getExchangeApi(this.exchange);
    let candles = await apiPublic.downloadCandles(this.market, '5m', 5);
    // console.log(candles);
    const closes = candles.map(function (o) {
      return o.close
    });
    return _.mean(closes);
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

      if (myOrder && myOrder.action === 'BUY') {
        console.log('%c BUY ORDER IN PROCESS', 'color:red');
        return;
      }
    }

    const currentPrice = await this.getPrice();
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const market = this.market;
    const qty = this.balanceCoin.available;
    const stopPrice = currentPrice + (currentPrice * this.percentStopLoss / 100);
    const sellPrice = stopPrice + (stopPrice * -0.001);
    this.lastMessage = 'SETTING new Order ' + this.market + ' ' + stopPrice;
    FollowOpenOrder.status.next(this.lastMessage);
    ;
    // console.log(' SET STOP LOSS ' + market, currentPrice,  stopPrice, sellPrice);

    try {
      const order = await api.stopLoss(market, qty, stopPrice, sellPrice);
      console.log('STOP LOSS order', order);
      if (order) setTimeout(() => {
        api.refreshBalances();
        api.refreshAllOpenOrders();
      }, 5e3);

    } catch (e) {
      console.error(e);

      if (e.toString().indexOf('no formatter') !== -1) {
        const books: VOBooks = await this.apisPublic.getExchangeApi(this.exchange).downloadBooks(this.base, this.coin).toPromise();
      }
      console.error(e);
    }
  }

  lastCheck: number;

  private async checkPrice() {
    const now = Date.now();
    if (now - this.lastCheck < 6e4) {
      console.log(' TOO FAST check ' + this.market)
      return
    }
    this.lastCheck = now;
    const coin = this.coin;
    const openOrders = this.apisPrivate.getExchangeApi(this.exchange).getAllOpenOrders();
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
    }
    const currentPrice = await this.getPrice();
    const diff = MATH.percent(myOrder.stopPrice, currentPrice);

    this.lastMessage = this.market + '  ' + diff;
    FollowOpenOrder.status.next(this.lastMessage);
    myOrder.lastStatus = moment().format('HH:mm') + '  ' + diff;
    if (diff < (this.percentStopLoss - 1)) {
      this.lastMessage = 'CANCELLING ORDER ' + this.lastMessage + ' stop price: ' + myOrder.stopPrice;
      FollowOpenOrder.status.next(this.lastMessage);
      this.cancelOrder(myOrder)
    }
  }

  destroy() {
    console.log('DESTROY ' + this.exchange + this.market);
    this.stop();
    if (this.sub1) this.sub1.unsubscribe();

  }

  checkInterval;

  start() {
    if (this.checkInterval) return;
    this.lastMessage = ' Start following ' + this.balanceCoin.symbol
    FollowOpenOrder.status.next(this.lastMessage);
    this.checkInterval = setInterval(() => this.checkPrice(), moment.duration(5, 'minutes'));
  }

  stop() {
    this.lastMessage = ' STOPPING ' + this.market;
    FollowOpenOrder.status.next(this.lastMessage);
    clearInterval(this.checkInterval);
    this.checkInterval = null;

  }
}
