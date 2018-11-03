import {FollowOpenOrder} from '../../apis/open-orders/follow-open-order';
import {VOBooks, VOOrder} from '../../models/app-models';
import * as _ from 'lodash';
import {VOCandle} from '../../models/api-models';
import {MATH} from '../../com/math';
import {CandlesAnalys1} from '../scanner/candles-analys1';

export class StopLossOrder {
  order: VOOrder;
  market: string;

  constructor(private main: FollowOpenOrder) {

    this.market = main.market;
    this.log = main.log;
    this.subscribe();
  }

  log(message: string, save = true) {
    this.main.log(message, save);
  }

  subscribe() {
    const coin = this.main.coin;
    this.main.apiPrivate.openOrdersSub.subscribe(orders => {
      if (!Array.isArray(orders)) return;

      // @ts-ignore
      const myOrder = _.find(orders, {coin: coin});
      if (myOrder.action === 'SELL' && myOrder.stopPrice) this.order = myOrder;
      else this.order = null;
      // this.log(this.market + ' STOP_LOSS ' +(this.order?this.order.stopPrice : ' no stop order'), false)
    })
  }

  getSopLossRate() {
    return this.order.stopPrice
  }

  async cancelOrder() {
    const order = this.order;
    if (!order) {
      this.log(' NO OPEN ORDES ');
      return;
    }
    const uuid = order.uuid;
    this.log(' canceling order ' + order.action);

    let result;
    try {
      result = await this.main.apiPrivate.cancelOrder(uuid, this.main.base, this.main.coin).toPromise();
    } catch (e) {
      //console.log(this);
      console.error(e);
      this.log(e.toString())
    }

    return result;
  }


  async resetStopLoss() {
    await this.cancelOrder();
    this.order = null;
    this.setStopLoss();
  }


  checkStopLossPrice() {

    const candles: VOCandle[] = this.main.candles;
    const closes = _.takeRight(candles, 18).map(function (o) {
      return o.close;
    });

    const price = MATH.median(closes);

    const diff = MATH.percent(this.getSopLossRate(), price);
    const message = ' stop loss diff ' + diff;
    this.log(message);

    if (diff < (this.main.percentStopLoss - 1)) {
      this.resetStopLoss();
    }
  }

  async setStopLoss() {
    this.log(' setStopLoss ');
    const openOrders = this.main.apiPrivate.getAllOpenOrders();

    if (openOrders) {
      const myOrder = _.find(openOrders, {coin: this.main.coin});
      if (myOrder) {
        if (myOrder.action === 'BUY') {

        } else if (myOrder.action === 'SELL') {
          if (myOrder.stopPrice) this.order = myOrder;
        }

        this.log(' ORDER IN PROGRESS ' + myOrder.action + JSON.stringify(myOrder));
        return;
      }
    }


    const candles = this.main.candles;
    const last = _.last(candles);
    const currentPrice = last.close;

    const market = this.market;
    const qty = this.main.balanceCoin.available;

    const stopPrice = currentPrice + (currentPrice * this.main.percentStopLoss / 100);
    const sellPrice = stopPrice + (stopPrice * -0.001);
    this.log(' SETTING new Order ' + this.main.market + ' ' + stopPrice + '  ' + qty);


    const api = this.main.apiPrivate;
    // console.log(' SET STOP LOSS ' + market, currentPrice,  stopPrice, sellPrice);

    try {
      const order = await api.stopLoss(market, qty, stopPrice, sellPrice);
      this.log('STOP LOSS order' + JSON.stringify(order));
      if (order && order.uuid) setTimeout(() => {
        api.refreshBalances();
        api.refreshAllOpenOrders();
        console.log(order);
        if (order.stopPrice) this.order = order;
      }, 5e3);

    } catch (e) {
      this.log('ERROR ' + e.toString());
      if (e.error.msg.indexOf('immediately') !== -1) {
        this.main.percentStopLoss *= 2;
        //const sellPrice = currentPrice + (currentPrice * this.percentStopLoss / 100);
        //  this.sellCoin(100, sellPrice);
      }
      console.error(e);

    }
  }
}
