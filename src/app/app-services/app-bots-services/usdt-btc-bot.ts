import {VOMCObj} from '../../models/api-models';
import * as _ from 'lodash';

import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {VOBalance, VOBooks, VOOrder} from '../../models/app-models';
import {CandlesService} from '../candles/candles.service';
import {map} from 'rxjs/operators';
import {pipe} from 'rxjs/internal-compatibility';
import {CandlesAnalys1} from '../scanner/candles-analys1';

export class UsdtBtcBot {
  priceCounUS;
  private sub1;
  private sub2;
  private sub3;
  private base = 'USDT';
  private coin = 'BTC';
  private releaseAmountUS = 120;
  private stopLossOrders: VOOrder[];
  private currentOrders: VOOrder[];
  private percentStopLoss = -2;

  private get market() {
    return this.base + '_' + this.coin;
  }

  private balanceBase: VOBalance;
  private balanceCoin: VOBalance;
  private interval;

  constructor(
    private marketCap: ApiMarketCapService,
    private apiPrivate: ApiPrivateAbstaract,
    private candlesService: CandlesService
  ) {

  }


  async tick() {
    if (!this.balanceBase || !this.balanceCoin) {
      console.log(this.market + ' BALANCES not ready');
      return;
    }
    if (this.isNeedStopLoss()) return;

    console.log(this.market, this.currentOrders, this.stopLossOrders);
    const candles = await this.candlesService.getCandles(this.market);
    // console.log(candles);
    const availableUS = this.balanceCoin.available * this.priceCounUS;
    console.log(availableUS);
    if (availableUS < (this.releaseAmountUS - 20)) {
      if (this.currentOrders) {
        console.log(this.market + ' ORDER in progress ', this.currentOrders);
      } else {

        // this.buyCoin();
      }

      return;
    }
  }

  isNeedStopLoss() {
    const availableUS = this.balanceCoin.available * this.priceCounUS;
    if (availableUS / 1.5 < (this.releaseAmountUS + 20)) {
      console.log(' amount too small for stop loss ' + (availableUS / 1.5) + '   ' + (this.releaseAmountUS + 20));
      return false;
    }


    if (this.stopLossOrders) return false;
    this.setStopLoss();
    return true;
  }


  async setStopLoss() {
    console.log(' NEED to set Stop loss');
    const candles = await this.candlesService.getCandles(this.market);
    const lastPrice = _.last(candles).close;
    const mas = CandlesAnalys1.mas(candles);
    const ma99 = mas.ma99;
    const currentPrice = ma99 < lastPrice ? lastPrice : ma99;
    const availableUS = (this.balanceCoin.available * this.priceCounUS) - this.releaseAmountUS - 10;
    console.log(' STOP LOSS available ' + availableUS);

    if (availableUS < 20) {
      console.log(' nothing to stop LOSS ' + availableUS);
      return;
    }

    const qty = +(availableUS / this.priceCounUS).toFixed(8);

    const stopPrice = +(currentPrice + (currentPrice * this.percentStopLoss / 100)).toFixed(1);
    const sellPrice = +(stopPrice + (stopPrice * -0.001)).toFixed(1);

    let message =  this.market + ' SET STOP_LOSS  stopPrice ' + stopPrice + '  sellPrice ' + sellPrice + '   ' + qty;

    console.log(message);

    try {
      const order: VOOrder = await this.apiPrivate.stopLoss(this.market, qty, stopPrice, sellPrice);
      console.log('result STOP LOSS order', order);
      if (order && order.uuid) {
        if(!this.stopLossOrders) this.stopLossOrders = [];
        this.stopLossOrders.push(order);
      }

    } catch (e) {
      console.error(e);
    }
  }

  async buyCoin() {
    console.log(this.market + ' buyCoin');
    const availableUS = this.balanceCoin.available * this.priceCounUS;
    const amountCoin = (this.releaseAmountUS + 20 - availableUS) / this.priceCounUS;
    const rate = _.last(await this.candlesService.getCandles(this.market)).close;
    const order = await this.apiPrivate.buyLimit2(this.market, amountCoin, rate);
    if(!this.currentOrders) this.currentOrders = [];
    this.currentOrders.push(order);
    console.log(this.market, order);
  }

  async cancelOrder(order: VOOrder) {
    if (!order) {
      console.warn(' no order to cancel ' + this.market);
      return;
    }
    const uuid = order.uuid;
    console.log(' canceling order ', order);
    let result;
    try {
      result = await this.apiPrivate.cancelOrder(uuid, this.base, this.coin).toPromise();
    } catch (e) {
      console.error(e);
    }
    return result
  }

  unsubscribe() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.sub3) this.sub3.unsubscribe();
  }

  async subscribe() {
    this.sub2 = this.marketCap.ticker$().pipe(
      map(obj => obj ? obj['BTC'].price_usd : 0)
    )
      .subscribe(price => this.priceCounUS = price);

    this.sub1 = this.apiPrivate.balances$().subscribe(balances => {
      if (!balances) return;
      this.balanceBase = _.find(balances, {symbol: this.base});
      this.balanceCoin = _.find(balances, {symbol: this.coin});
    });

    this.sub3 = this.apiPrivate.allOpenOrders$()
      .pipe(
        map(orders => {
          console.log(' OPEN ORDERS ', orders);
          return _.filter(orders, {coin: this.coin, base: this.base})
        })
      ).subscribe(orders => {
        if (!orders) return;
        console.log(this.market, orders);
        this.currentOrders = orders;
        this.stopLossOrders = orders.filter(function (item) {
          return !!item.stopPrice;
        })
      });

  }

  start() {
    if (this.interval) return;
    this.subscribe();
    this.interval = setInterval(() => this.tick(), 6000);
  }

  stop() {
    clearInterval(this.interval);
    this.interval = 0;
    this.unsubscribe();
  }
}
