import {VOBalance, VOBooks, VOOrder} from '../../models/app-models';
import * as _ from 'lodash';
import {VOCandle} from '../../models/api-models';
import {MATH} from '../../com/math';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import * as moment from 'moment';

export class StopLossOrder {

  constructor(
    private market: string,
    private amountCoin: number,
    private apiPrivate: ApiPrivateAbstaract
  ) {
    this.subscribe();
  }
  order: VOOrder;

  percentStopLoss = -3;

  prevValue: number;

  log(message: string) {
    console.log(message);
  }

  subscribe() {
    const coin = this.market.split('_')[1];

    this.apiPrivate.openOrdersSub.subscribe(orders => {
      if (!Array.isArray(orders)) return;

      // @ts-ignore
      const myOrder = _.find(orders, {coin: coin});
      if (myOrder && myOrder.action === 'SELL' && myOrder.stopPrice) this.order = myOrder;

    });

    // this.percentStopLoss = 2;
  }

  getSopLossRate() {
    return this.order.stopPrice;
  }

  calculatePrice(candles: VOCandle[]): number {
    const closes = CandlesAnalys1.closes(candles);
    return _.mean(_.takeRight(closes, 35));
  }

  async cancelOrder(order: VOOrder) {
    if (!order) {
      this.log(' NO OPEN ORDER ');
      return Promise.resolve(null);
    }
    const uuid = order.uuid;
    this.log(' CANCELING ORDER ' + order.type + ' stopPrice ' + order.stopPrice + ' rate ' + order.rate);
    let result;
    try {
      const ar = this.market.split('_');
      result = await this.apiPrivate.cancelOrder(uuid, ar[0], ar[1]).toPromise();
      this.log(' CANCEL Result ' + JSON.stringify(result));
    } catch (e) {
      // console.log(this);
      console.error(e);
      this.log('ERROR CANCEL ORDER ' + e.toString());
    }

    return result;
  }



  async resetStopLoss(closes: number[], qty: number) {
    this.log(' RESET STOP LOSS ');
    if (!this.order) {
      this.log('ERROR SET ORDER to reset it');
      return;
    }
    await this.cancelOrder(this.order);
    this.order = null;
    setTimeout(() => {
      this.apiPrivate.refreshAllOpenOrders();
      setTimeout(()=>this.setStopLoss(closes, qty),2000);

    }, 2000);

  }

  checkStopLoss(candles: VOCandle[], balanceCoin: VOBalance) {

    const qty = balanceCoin.available + balanceCoin.pending;

    const closes = CandlesAnalys1.closes(_.takeRight(candles, 99));
    let ma99 = _.mean(closes);

    const lastPrice = _.last(closes);


    if (!this.order) {
        this.setStopLoss(closes, qty);
        return null;
    }

    const last_ma99 =  MATH.percent(lastPrice, ma99);
    if (lastPrice < ma99) {
      this.log(' LAST price LOW ' + last_ma99);
      return null;
    }

      const diff = MATH.percent(this.order.stopPrice, ma99);


    const message = 'stop loss ' + this.percentStopLoss + ' diff ' + diff;
    if (diff !== this.prevValue) this.log(message);
    this.prevValue = diff;

    if (diff < (this.percentStopLoss - 1)) {

      this.resetStopLoss(closes, qty);
    }
  }

  async setStopLoss(closes: number[], qty: number) {


    if (this.order) {
      this.log('ERROR REMOVE ORDER FIRST ' + JSON.stringify(this.order));
      return;
    }
    const openOrders = this.apiPrivate.getAllOpenOrders();
    if (!Array.isArray(openOrders)) {
      this.log('ERROR open orders is null' );
      return;
    }

    const coin: string = this.market.split('_')[1];
    const myOrder: VOOrder = _.find(openOrders, {coin: coin});
    if (myOrder) {
      if (myOrder.stopPrice) {
        this.order = myOrder;
        console.log(this.market, this.order);
        return;
      } else {
        this.log('ANOTHER ORDER IN PROGRESS ' + JSON.stringify(myOrder));
      }
      return;
    }

    let price = _.mean(_.takeRight(closes, 99));
    const lastPrice = _.last(closes);
    if (lastPrice < price)  price = lastPrice;

    const newStopLoss: number = price + (price * this.percentStopLoss / 100);
    this.log(' setStopLoss ' + newStopLoss + ' qty: ' + qty);
    const ar = this.market.split('_');
    const sellPrice = newStopLoss + (newStopLoss * -0.01);
    const api = this.apiPrivate;
    // console.log(' SET STOP LOSS ' + market, currentPrice,  stopPrice, sellPrice);

    try {
      const order =  await api.stopLoss(this.market, qty, newStopLoss, sellPrice);
      this.log('STOP LOSS result: ' + JSON.stringify(order));
      if (order && order.uuid) setTimeout(() => {
       //  api.refreshBalances();
       //  api.refreshAllOpenOrders();
        console.log(order);
        if (order.stopPrice) this.order = order;
      }, 5e3);

    } catch (e) {
      this.log('ERROR ' + e.toString());
      if (e.error.msg.indexOf('immediately') !== -1) {
        this.percentStopLoss *= 2;
        // const sellPrice = currentPrice + (currentPrice * this.percentStopLoss / 100);
        //  this.sellCoin(100, sellPrice);
      }
      console.error(e);

    }
  }
}
