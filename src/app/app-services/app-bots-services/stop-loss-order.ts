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
    private apiPrivate: ApiPrivateAbstaract
  ) {
    this.subscribe();
  }

  orders: VOOrder[];
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
      this.orders = _.filter(orders, {coin: coin});
    });
  }

  stopLossOrders(): VOOrder[] {
    if(!this.orders) return[];
    return this.orders.filter(function (item) {
      return item.stopPrice;
    })
  }

  calculatePrice(candles: VOCandle[]): number {
    const closes = CandlesAnalys1.closes(candles);
    return _.mean(_.takeRight(closes, 35));
  }

  private async cancelOrder(uuid: string) {
    this.log(' CANCELING ORDER ' + uuid);
    const ar = this.market.split('_');
    return this.apiPrivate.cancelOrder(uuid, ar[0], ar[1]).toPromise();
  }

  async cancelSopLossOrders() {
    return new Promise(async (resolve, reject) => {
      const orders = this.stopLossOrders();
      if (!orders.length) {
        this.log('NO STOP_LOSS to cancel ');
        resolve();
        return;
      }

      Promise.all(orders.map((order) => {
        return this.cancelOrder(order.uuid)
      })).then(result => {
        setTimeout(() => {
          this.apiPrivate.refreshAllOpenOrders();
          setTimeout(() => resolve(result), 5000);
        }, 2000);

      }, reject);
    })
  }


  async checkStopLoss(candles: VOCandle[], balanceCoin: VOBalance) {
    if(!balanceCoin) return Promise.resolve();
    const balanceTotal = balanceCoin.available + balanceCoin.pending;

    const closes = CandlesAnalys1.closes(_.takeRight(candles, 99));
    let ma99 = _.mean(closes);
    const lastPrice = _.last(closes);
    let price = ma99;
    if (lastPrice < ma99) price = lastPrice;

    const orders = this.stopLossOrders();
    if (orders.length > 1) {
      return this.cancelSopLossOrders();
    }

    if(orders.length === 0){
      return this.setStopLoss(price, balanceTotal);
    }

    let order = orders[0];
    // const last_ma99 = MATH.percent(lastPrice, ma99);
    const diff = MATH.percent(order.stopPrice, price);
    const message = ' STOP_LOSS ' + this.percentStopLoss + ' diff ' + diff;
    console.log(this.market + message);
    this.prevValue = diff;

    if (diff < (this.percentStopLoss - 2)) {
      this.log(' RESETTING STOP_LOSS price: ' + price + ' qty ' + balanceTotal);
      await this.cancelSopLossOrders();
      return new Promise((resole, reject) => {
        setTimeout(() => {
          this.apiPrivate.refreshAllOpenOrders();
          setTimeout(() => {
            this.setStopLoss(price, balanceTotal).then(res => {
              resole();
            });
          }, 2000)

        })
      })


    }
  }

  async setStopLoss(price: number, qty: number) {
    const orders = this.stopLossOrders();
    if(orders.length) return Promise.reject('ERROR REMOVE ORDER FIRST ' + JSON.stringify(orders));
    return new Promise(async (resolve, reject) => {
        const newStopLoss: number = price + (price * this.percentStopLoss / 100);

        this.log(' setStopLoss ' + newStopLoss + ' qty: ' + qty);

        const sellPrice = newStopLoss + (newStopLoss * -0.01);
        const api = this.apiPrivate;
        // console.log(' SET STOP LOSS ' + market, currentPrice,  stopPrice, sellPrice);
      let result;
        try {
          result = await api.stopLoss(this.market, qty, newStopLoss, sellPrice);
        } catch (e) {
          reject(e.toString());
        }
        this.apiPrivate.refreshAllOpenOrders();
        setTimeout(() => {
          resolve(result);
        }, 5000);

    })


  }

  destroy() {

  }
}
