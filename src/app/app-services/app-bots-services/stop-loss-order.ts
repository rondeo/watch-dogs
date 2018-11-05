import {VOBooks, VOOrder} from '../../models/app-models';
import * as _ from 'lodash';
import {VOCandle} from '../../models/api-models';
import {MATH} from '../../com/math';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import * as moment from 'moment';

export class StopLossOrder {
  order: VOOrder;


  constructor(
    private market: string,
    private percentStopLoss: number,
    private apiPrivate: ApiPrivateAbstaract
  ) {
    this.subscribe();
  }

  log(message: string) {
    console.log(message)
  }

  subscribe() {
    const coin = this.market.split('_')[1];

    this.apiPrivate.openOrdersSub.subscribe(orders => {
      if (!Array.isArray(orders)) return;

      // @ts-ignore
      const myOrder = _.find(orders, {coin: coin});
      if (myOrder && myOrder.action === 'SELL' && myOrder.stopPrice) {
        if (!this.order)
          this.log('STOP LOSS ' + myOrder.stopPrice + ' ' + myOrder.rate + ' ' + moment(myOrder.timestamp).format('DD HH:mm'));
        this.order = myOrder;
      }
      else this.order = null;
      // this.log(this.market + ' STOP_LOSS ' +(this.order?this.order.stopPrice : ' no stop order'), false)
    })

    // this.percentStopLoss = 2;
  }

  getSopLossRate() {
    return this.order.stopPrice
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
      const ar = this.market.split('_')
      result = await this.apiPrivate.cancelOrder(uuid, ar[0], ar[1]).toPromise();
      this.log(' CANCEL Result ' + JSON.stringify(result));
    } catch (e) {
      //console.log(this);
      console.error(e);
      this.log('ERROR CANCEL ORDER ' + e.toString())
    }

    return result;
  }


  async resetStopLoss(candles: VOCandle[], qty: number) {
    this.log(' RESET STOP LOSS ')
    await this.cancelOrder(this.order);
    this.order = null;
    this.setStopLoss(candles, qty);
  }


  prevValue: number

  checkStopLossPrice(candles: VOCandle[], qty: number) {

    const closes = CandlesAnalys1.oc(candles);
    const price = _.mean(_.takeRight(closes, 7));

    const diff = MATH.percent(this.getSopLossRate(), price);
    const message = 'stop loss ' + this.percentStopLoss + ' diff ' + diff;
    if (diff !== this.prevValue) this.log(message);
    this.prevValue = diff;


    if (diff < (this.percentStopLoss - 1)) {
      this.resetStopLoss(candles, qty);
    }
  }

  async setStopLoss(candles: VOCandle[], qty: number) {
    this.log(' setStopLoss ');
    const openOrders = this.apiPrivate.getAllOpenOrders();
    const ar = this.market.split('_');

    if (openOrders) {
      const myOrder = _.find(openOrders, {coin: ar[1]});
      if (myOrder) {
        if (myOrder.action === 'BUY') {

        } else if (myOrder.action === 'SELL') {


          if (myOrder.stopPrice) this.order = myOrder;
          else {
            const last = _.last(candles).close;
            console.log(last, myOrder);
            if(myOrder.rate > last){
              this.cancelOrder(myOrder);;
            }
          }
        }

        this.log(' ORDER IN PROGRESS ' + myOrder.action + JSON.stringify(myOrder));
        return;
      }
    }

    const last = _.last(candles);
    const currentPrice = last.close;

    const market = this.market;

    const stopPrice = currentPrice + (currentPrice * this.percentStopLoss / 100);
    const sellPrice = stopPrice + (stopPrice * -0.001);

    this.log('NEW STOP_LOSS stopPrice: ' + stopPrice + ' sellPrice: ' + sellPrice + ' qty: ' + qty);


    const api = this.apiPrivate;
    // console.log(' SET STOP LOSS ' + market, currentPrice,  stopPrice, sellPrice);

    try {
      const order = await api.stopLoss(market, qty, stopPrice, sellPrice);
      this.order = null;
      this.log('STOP LOSS result: ' + JSON.stringify(order));
      if (order && order.uuid) setTimeout(() => {
        api.refreshBalances();
        api.refreshAllOpenOrders();
        console.log(order);
        if (order.stopPrice) this.order = order;
      }, 5e3);

    } catch (e) {
      this.log('ERROR ' + e.toString());
      if (e.error.msg.indexOf('immediately') !== -1) {
        this.percentStopLoss *= 2;
        //const sellPrice = currentPrice + (currentPrice * this.percentStopLoss / 100);
        //  this.sellCoin(100, sellPrice);
      }
      console.error(e);

    }
  }
}
