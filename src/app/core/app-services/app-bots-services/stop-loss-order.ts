import {VOBalance, VOBooks, VOOrder} from '../../../models/app-models';
import * as _ from 'lodash';
import {VOCandle} from '../../../models/api-models';
import {MATH} from '../../com/math';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import * as moment from 'moment';

export class StopLossOrder {

  constructor(
    private market: string,
    private apiPrivate: ApiPrivateAbstaract
  ) {
    this.subscribe();
  }

  orders: VOOrder[] = [];
  percentStopLoss = -2;
  percentStopLoss2 = -3;
  prevValue: number;

  subscribe() {
    this.apiPrivate.openOrdersSub.subscribe(orders => {
      if (!Array.isArray(orders)) return;

      this.orders = orders.filter(function (item) {
        return item.market === this.market && item.stopPrice
      }, {market: this.market});
    });
  }

  log(data: { action: string, reason: string }) {
    console.log(data.action + ' ' + data.reason)
  }

  calculatePrice(candles: VOCandle[]): number {
    const closes = CandlesAnalys1.closes(candles);
    return _.mean(_.takeRight(closes, 35));
  }

  private async cancelOrder(uuid: string) {
    this.log({action: 'CANCELING ORDER ', reason: uuid});
    const ar = this.market.split('_');
    return this.apiPrivate.cancelOrder(uuid, ar[0], ar[1]).toPromise();
  }

  async cancelSopLossOrders() {
    if (!this.orders.length) return Promise.resolve();
    return new Promise(async (resolve, reject) => {
      Promise.all(this.orders.map((order) => {
        return this.cancelOrder(order.uuid)
      })).then(result => {
        setTimeout(() => {
          this.apiPrivate.refreshAllOpenOrders();
          setTimeout(() => resolve(result), 5000);
        }, 2000);

      }, reject);
    })
  }


  async checkStopLoss(price: number, qty: number) {
    if (!this.orders.length) throw new Error('no stop loss');
    let order = this.orders[0];
    // const last_ma99 = MATH.percent(lastPrice, ma99);
    const diff = MATH.percent(order.stopPrice, price);
    const message = ' STOP_LOSS ' + this.percentStopLoss + ' diff ' + diff;
    console.log(this.market + message);
    this.prevValue = diff;
    if (diff < (this.percentStopLoss - 3)) {
      this.percentStopLoss = this.percentStopLoss2;
      this.log({action: 'RESETTING STOP_LOSS', reason: ' price ' + price});
      return this.cancelSopLossOrders();
    }
  }

  async setStopLoss(lastPrice: number, qty: number) {
    const orders = this.orders;
    if (orders.length) return Promise.reject('ERROR REMOVE ORDER FIRST ' + JSON.stringify(orders));
    return new Promise(async (resolve, reject) => {
      const newStopLoss: number = +(lastPrice + (lastPrice * this.percentStopLoss / 100)).toFixed(8);
      const sellPrice = +(newStopLoss + (newStopLoss * -0.01)).toFixed(8);
      this.log({action: ' setStopLoss ', reason: ' P ' + newStopLoss + ' qty: ' + qty + ' Ps ' + sellPrice});

      const api = this.apiPrivate;
      let result;
      try {
        result = await api.stopLoss(this.market, qty, newStopLoss, sellPrice);
        this.log({action: 'RESULT SL', reason: result.uuid});
      } catch (e) {
        reject(e.toString());
      }

      this.apiPrivate.refreshAllOpenOrders();
      setTimeout(() => {
        resolve(result);
      }, 2000);

    })


  }

  destroy() {

  }
}
