import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {StorageService} from '../../services/app-storage.service';
import {VOOrder} from '../../models/app-models';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import * as _ from 'lodash';
import * as moment from 'moment';
import {until} from 'selenium-webdriver';
import urlIs = until.urlIs;

export enum OrdersState {
  NONE= 'NONE',
  BUYING = 'BUYING',
  SELLING = 'SELLING',
  STOP_LOSS = 'STOP_LOSS',
  BUYING_SELLING ='BUYING_SELLING',
  DUAL_BUY = 'DUAL_BUY',
  DUAL_SELL ='DUAL_SELL'
}

export class MarketOrders {
  id:string
  base: string;
  coin: string;
  state$: BehaviorSubject<OrdersState>;
  sub1;
  ordersHistory$: BehaviorSubject<VOOrder[]>;
  openOrders$: BehaviorSubject<VOOrder[]>;


  constructor(
    private market: string,
    private apiPrivate: ApiPrivateAbstaract,
    private storage: StorageService,
    private priceUS: number
  ) {
    const ar = market.split('_');
    this.base = ar[0];
    this.coin = ar[1];
    this.id = this.apiPrivate.exchange + this.market;
  }


  log(log: {action: string, reason: string}){
    console.log(log.action + ' ' + log.reason);
  }

  async init() {
    this.ordersHistory$ = new BehaviorSubject((await this.storage.select(this.id + '-orders-history')) || []);
    this.openOrders$ = new BehaviorSubject((await this.storage.select(this.id + '-open-orders')) || []);
    this.state$ = new BehaviorSubject(OrdersState.NONE);
    this.sub1 = this.apiPrivate.allOpenOrders$().subscribe(orders => {
      if (!orders) return;
      const myOrders: VOOrder[] = <VOOrder[]>_.filter(orders, {market: this.market});
      //  console.log(this.market + ' my order ', myOrder);
      const oldOrders = this.openOrders$.getValue();
      if (oldOrders.length !== myOrders.length) {
        this.openOrders$.next(myOrders);
        this.storage.upsert(this.id + '-open-orders', myOrders);
      }
    });

    this.openOrders$.subscribe(orders =>{
      if(orders.length === 0){
        if(this.state !== OrdersState.NONE) this.state$.next(OrdersState.NONE);
        return
      }
      const sellOrders = _.filter(orders, {action:'SELL'});
      const buyOrdres = _.filter(orders, {action:'BUY'});
      const stopLoss = sellOrders.filter(function (item) {
        return item.stopPrice
      });

      let newState = OrdersState.NONE;

      if(buyOrdres.length && sellOrders.length) newState = OrdersState.BUYING_SELLING;
      else if(stopLoss.length ) {
        if(stopLoss.length === sellOrders.length) newState = OrdersState.STOP_LOSS;
        else newState = OrdersState.DUAL_SELL;
      } else if(sellOrders.length){
        if(sellOrders.length ==1 ) newState = OrdersState.SELLING;
        else  newState = OrdersState.DUAL_SELL;
      } else if(buyOrdres.length){
        if(buyOrdres.length === 1) newState = OrdersState.BUYING;
        else newState = OrdersState.DUAL_BUY;
      }

      if(this.state$.getValue() !== newState) this.state$.next(newState);


    })
  }

  get state(){
    return this.state$.getValue();
  }

  get buyOrders() {
    const activeOrders = this.openOrders$.getValue();
     return activeOrders.filter(function (item) {
      return item.action === 'BUY';
    });
  }
  get sellOrders() {
     return this.openOrders$.getValue().filter(function (item) {
      return item.action === 'SELL'
    });
  }

  async cancelAllOrders() {
    if(this.state$.getValue() === OrdersState.NONE) return Promise.resolve([{uuid:'no urders'}]);
    this.state$.next(OrdersState.NONE);
    return Promise.all([this.cancelSellOrders(), this.cancelBuyOrders()]);

  }

  async cancelBuyOrders() {
    const uuids = _.map(this.buyOrders, 'uuid');
    if(uuids.length){
      this.log({action: 'CANCEL', reason:' ALL BUY ORDERS'});
      return this.cancelOrders(uuids);
    }
    return Promise.resolve([]);
  }

  async cancelSellOrders() {
    const uuids = _.map(this.sellOrders, 'uuid');
    if(uuids.length){
      this.log({action: 'CANCEL', reason:' ALL SELL ORDERS'});
      return this.cancelOrders(uuids);
    }
    return Promise.resolve([]);

  }

  private async cancelOrder(uuid: string) {
    const ar = this.market.split('_');
    return this.apiPrivate.cancelOrder(uuid, ar[0], ar[1]).toPromise();
  }

  async cancelOrders(uuids: string[]) {
    if(uuids.length === 0) return Promise.resolve();
    return new Promise(async (resolve, reject) => {
      Promise.all(uuids.map((uuid) => {
        return this.cancelOrder(uuid)
      })).then(result => {
        setTimeout(() => {
          this.apiPrivate.refreshAllOpenOrders();
          setTimeout(() => resolve(result), 5000);
        }, 2000);

      }, reject);
    })
  }

  async refreshOrdersHistory() {
    let orders: VOOrder[] = this.ordersHistory$.getValue();

    let allOrders: VOOrder[] = await this.apiPrivate.getAllOrders(
      this.base, this.coin,
      moment().subtract(23, 'hours').valueOf(),
      moment().valueOf(),
    ).toPromise();


    if (orders.length) {
      const to = _.last(orders).timestamp;
      allOrders = allOrders.filter(function (item) {
        item.timestamp > to;
      });
      orders = orders.concat(allOrders);
    }else orders = allOrders;

    this.storage.upsert(this.id + '-orders-history', orders);
  }


/*
  async findOrdersHistory(after: number) {
    if (!after) after = moment().subtract(23, 'hours').valueOf();
    console.log(' findOrdersHistory ');

    const market = this.market;
    const allOrders: VOOrder[] = await this.apiPrivate.getAllOrders(
      this.base, this.coin,
      after,
      moment().valueOf(),
    ).toPromise();

    const ordersHistory = [];

    console.log(this.market + ' orders history ', allOrders);

    const buyOrders = _.filter(allOrders, {base: this.base, coin: this.coin, action: 'BUY'});

    if (buyOrders.length) {
      let rate = 0;
      let fees = 0;
      let amountCoin = 0;
      const timestamp = _.last(buyOrders).timestamp;

      buyOrders.forEach(function (o) {
        rate += +o.rate;
        fees += +o.fee;
        amountCoin += o.amountCoin;
      });

      rate = rate / buyOrders.length;

      const buyOrder = {
        uuid: '',
        isOpen: false,
        market,
        rate,
        fees,
        amountCoin,
        timestamp,
        date: moment(timestamp).format('DD HH:mm')
      };

      ordersHistory.push(buyOrder);
    }

    const sellOrders = _.filter(allOrders, {base: this.base, coin: this.coin, action: 'SELL'});

    if (sellOrders.length) {
      let rate = 0;
      let fees = 0;
      let amountCoin = 0;
      const date = moment(_.last(buyOrders).timestamp).format('DD HH:mm');

      sellOrders.forEach(function (o) {
        rate += +o.rate;
        fees += +o.fee;
        amountCoin += o.amountCoin;
      });
      rate = rate / sellOrders.length;

      const sellOrder = {
        uuid: '',
        isOpen: false,
        market,
        rate,
        fees,
        amountCoin,
        to,
        date
      };
      ordersHistory.push(sellOrder);
    }
    return ordersHistory;
    // console.warn(buyOrders);

  }*/



}
