import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {BalanceState, MarketBalance} from './market-balance';
import {MarketOrders} from './market-orders';
import {MacdSignal} from './macd-signal';
import {StopLossOrder} from './stop-loss-order';
import {StorageService} from '../../services/app-storage.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {filter, map} from 'rxjs/operators';
import * as moment from 'moment';
import {noop} from 'rxjs/internal-compatibility';
import {OrderType, VOBalance, VOMarketCap, VOOrder, VOWatchdog} from '../../../amodels/app-models';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {CandlesService} from '../candles/candles.service';
import * as _ from 'lodash';
import {UtilsBooks} from '../../../acom/utils-books';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {Subscription} from 'rxjs/internal/Subscription';
import {SellOnJump} from './sell-on-jump';
import {BuySellState} from './models';


export enum MCState {
  NONE = 'NONE',
  GREEN = 'GREEN',
  RED = 'RED'
}


export enum BotState {
  NONE = 'NONE',
  FIRST_BUY = 'FIRST_BUY',
  TO_USDT = 'TO_USDT'
}


export class MyOrder implements VOOrder {
  constructor(obj) {
    for (let str in obj) if (obj.hasOwnProperty(str)) this[str] = obj[str];
  }

  uuid: string;
  isOpen: boolean;
  rate: number;
  fee: number;
  orderType: OrderType;
  amountCoin: number;
  timestamp: number;

  message?: string;
  type?: string;
  date?: string;

  exchange?: string;
  priceUS?: number;
  amountUS?: number;
  stopPrice?: number;
  // amountCoinUS?: number; priceUS?: number;

  amountBase?: number;

  feeUS?: number;
  base?: string;
  coin?: string;
  market: string;
  local?: string;
  minutes?: string;
  lastStatus?: string;
}

export class BotBase {
  state$: BehaviorSubject<BotState>;
  mcState$: BehaviorSubject<MCState> = new BehaviorSubject(MCState.NONE);
  base: string;
  coin: string;
  mcCoin: VOMarketCap;
  mcBase: VOMarketCap;
  isLive: boolean;

 // balance: MarketBalance;
  macdSignal: MacdSignal;
 //  stopLossOrder: StopLossOrder;
  sellOnJump: SellOnJump;
  patterns: any[];
  logs: any[] = [];
  id: string;


  sub1: Subscription;
  sub2: Subscription;
  orders$: BehaviorSubject<VOOrder[]> = new BehaviorSubject(null);
  balanceCoin$: BehaviorSubject<VOBalance> = new BehaviorSubject(null);
  entryPrice$: BehaviorSubject<number> = new BehaviorSubject(0);
  targetPrice$: BehaviorSubject<number> = new BehaviorSubject(0);
  liquidPrice$: BehaviorSubject<number> = new BehaviorSubject(0);
  value$: BehaviorSubject<number> = new BehaviorSubject(0);

  interval;

  constructor(
    public exchange: string,
    public market: string,
    public amountUS: number,
    public orderType: OrderType,
    public apiPrivate: ApiPrivateAbstaract,
    public apiPublic: ApiPublicAbstract,
    public candlesService: CandlesService,
    public storage: StorageService,
    public marketCap: ApiMarketCapService
  ) {
    this.id = exchange + '-' + market;
    const ar = market.split('_');
    this.base = ar[0];
    this.coin = ar[1];

    marketCap.ticker$().subscribe(MC => {
      this.mcBase = MC[this.base];
      this.mcCoin = MC[this.coin];
    });
    storage.select(this.id + '-orders').then(orders => this.orders$.next(orders));

    console.log(' bot ' +  this.id);
    this.orders$.pipe(filter(orders => !!orders)).subscribe(orders => {
      console.log(orders);
    })
  }

  buyNow() {

  }

/*
  async buyCoinInstant(qty: number) {
    if (!qty) qty = this.amountCoin;

    if (!qty) {
      console.warn(' no QTY');
      this.log({action: 'STOP BUY', reason: ' no QTY'});
      return null;
    }
    try {
      const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
      const rate = UtilsBooks.getRateForAmountCoin(books.sell, qty);
      this.log({action: 'BUY_INSTANT', reason: ' rate ' + rate});
      const order = await this.apiPrivate.buyLimit2(this.market, qty, rate);
      console.log('BUY ORDER RESULT ', order);
      this.log({action: 'BUY_ORDER_RESULT', reason: order.amountCoin + '  ' + order.rate + ' ' + order.isOpen});
      this.apiPrivate.refreshAllOpenOrders();
    } catch (e) {
      this.log({action: 'ERROR', reason: 'buy coin ' + e.toString()});
    }
    return {uuid: 'test'};
  }
*/

  async setBuyOrder(rate: number, amountUS: number, stopLoss: number) {
    console.log(amountUS, this.mcCoin);
    const amountCoin = amountUS / this.mcCoin.price_usd;
    this.log({action: 'BUY_ORDER', reason: ' qty ' + amountCoin + ' rate ' + rate});
    if (!this.isLive) {
      const market = this.market;
      let uuid = Date.now();
      let orderType = OrderType.BUY;
      let isOpen = false;
      const timestamp = Date.now();
      let fee = amountCoin * 0.002;
      const order: MyOrder = new MyOrder({market, uuid, orderType, amountCoin, isOpen, timestamp, fee, amountUS});
      const orders = this.orders$.getValue() || [];
      orders.push(order);
      if (stopLoss) {
        uuid++;
        fee = fee * 2;
        orderType = OrderType.STOP_LOSS;
        isOpen = true;
        const stopLossOrder: MyOrder = new MyOrder({market, uuid, orderType, isOpen, timestamp, fee, amountUS});
        orders.push(stopLossOrder);
      }

      this.orders$.next(orders);
      this.save();
      return Promise.resolve();
    }
    return new Promise(async (resolve, reject) => {
      try {
        const order = await this.apiPrivate.buyLimit2(this.market, amountCoin, rate);
        console.log('BUY ORDER RESULT ', order);
        this.log({action: 'BUY_ORDER_RESULT', reason: order.amountCoin + '  ' + order.rate + ' ' + order.isOpen});
        this.apiPrivate.refreshAllOpenOrders();
      } catch (e) {
        this.log({action: 'ERROR BUY_ORDER_RESULT', reason: e.toString()});
        reject();
      }
      setTimeout(() => resolve(), 2000);
    });
  }

  async setSellOrder(rate: number, amountUS: number, stopLoss: number) {
    const amountCoin = amountUS / this.mcCoin.price_usd;
    this.log({action: 'SELL_ORDER', reason: 'qty ' + amountCoin + 'rate ' + rate + ' live:' + this.isLive});
    if (!this.isLive) return Promise.resolve();

    if (!amountCoin) {
      // Promise.resolve(' amount too low ' + this.balance.balanceUS);
      return;
    }

    //  const cancelResult: VOOrder[] = await this.orders.cancelSellOrders();
    /*   this.log({
         orderType: 'cancel orders res ', reason: cancelResult.map(function (item) {
           return item.orderType + ' ' + item.uuid;
         }).toString()
       });*/

    const order = await this.apiPrivate.sellLimit2(this.market, amountCoin, rate);
    this.log({action: 'SELL_LIMIT ', reason: 'rate ' + order.rate + ' qty ' + order.amountCoin + ' open ' + order.isOpen});

    this.apiPrivate.refreshAllOpenOrders();
    return order;
  }


  async sellCoinInstant() {
    const amountCoin = this.balanceCoin$.getValue().available;
    // await this.orders.cancelAllOrders();
    try {
      const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
      const rate = UtilsBooks.getRateForAmountCoin(books.buy, amountCoin);
      this.log({action: 'SELL_INSTANT', reason: 'qty ' + amountCoin + ' rate ' + rate});
      const sellResult = await this.apiPrivate.sellLimit2(this.market, amountCoin, rate);
      console.log(sellResult);
      this.log({action: 'RESULT SELL_INSTANT ', reason: sellResult.amountCoin + '  ' + sellResult.rate});

    } catch (e) {
      this.log({action: 'ERROR SELL_INSTANT', reason: JSON.stringify(e)});
    }
    // this.state$.next(BotState.SOLD);
  }


  async botInit() {
   /* const ar = this.market.split('_');
  //  this.base = ar[0];
   // this.coin = ar[1];

   //  this.state$ = new BehaviorSubject<BotState>((await this.storage.select('state-' + this.exchange + this.market)) || BotState.NONE);

    await this.initMarketCap();
    //  console.log(this.market + ' init ' + this.isLive + ' $' + this.amountCoinUS);
    this.patterns = (await this.storage.select(this.id + '-patterns')) || [];
    const MC = await this.marketCap.ticker();
    const priceUS = MC[this.coin].price_usd;
    this.balance = new MarketBalance(this.market, this.apiPrivate, this.storage, this.marketCap);
    // this.orders = new MarketOrders(this.market, this.apiPrivate, this.storage, priceUS);
    // await this.orders.init();
    // console.log(this.market + ' ORDERS init DONE ');
    this.macdSignal = new MacdSignal(this.market, this.candlesService);
    await this.balance.init();


    this.sellOnJump = new SellOnJump(this.market, this.candlesService);
    this.sellOnJump.state$.subscribe(state => {
      if (state === BuySellState.SELL_ON_JUMP && this.balance.state === BalanceState.BOUGHT) {

        this.log({action: 'SELL_ON_JUMP', reason: this.sellOnJump.reason});

        this.sellCoinInstant(0);
      }
      console.log(this.market + ' sellOnJump ' + state + ' ' + this.sellOnJump.reason);
    });

    this.macdSignal.state$.subscribe(res => {
      this.log({action: 'MACD ' + res, reason: this.macdSignal.reason});
      /!* if (res === BuySellState.BUY_NOW) {
         this.log({orderType: 'BUY_BY_MACD', reason: this.macdSignal.reason});
       } else if (res === BuySellState.SELL_NOW) {
         this.log({orderType: 'SELL_BY_MACD', reason: this.macdSignal.reason})
       }*!/
    });

    if (!this.isLive) console.log('%c ' + this.market + ' NOT LIVE ', 'color:red');
    console.log(this.market + ' BALANCE  init DONE $' + this.balance.balanceUS);
    this.balance.balance$.subscribe(balance => {
      if (balance.change) {
        this.log({action: 'BALANCE', reason: ' ' + balance.change});
        this.apiPrivate.refreshAllOpenOrders();
        console.warn(this.market + ' balance changed ' + balance.change)
      }
    });

    this.balance.state$.subscribe(state => {
      this.log({action: 'BALANCE', reason: state});
    });

    // this.stopLossOrder = new StopLossOrder(this.market, this.apiPrivate);
    // this.stopLossOrder.log = this.log.bind(this);

    const sub = this.candlesService.candles15min$(this.market);

    sub.subscribe(candles => {
      //  console.log(_.map(_.takeRight(candles, 10),'time'));
    })*/
  }


  initMarketCap() {
    this.marketCap.ticker$().pipe(
      map(obj => {
        if (!obj) return;

        this.mcCoin = obj[this.coin];
        this.mcBase = obj[this.base];

        if (!this.mcCoin) {
          console.log(this.coin, obj);
          return
        }
        const prevSate = this.mcState$.getValue();
        let newState = MCState.NONE;

        if (this.mcCoin.r6 < 0) newState = MCState.RED;
        else if (this.mcCoin.r6 >= 0) newState = MCState.GREEN;
        if (prevSate !== newState) {

          if (prevSate !== MCState.NONE) this.log({
            action: prevSate + '->' + newState,
            reason: this.mcCoin.rank + ' r6 ' + this.mcCoin.r6 + ' r24 ' +
              this.mcCoin.r24 + ' 1w ' + this.mcCoin.percent_change_7d + ' 1d ' + this.mcCoin.percent_change_24h
          });
          this.mcState$.next(newState);
        }
      })
    ).subscribe(noop);
  }


  log(log: { action: string, reason: string }) {
    // if (typeof message !== 'string') out = UTILS.toString(message);
    // else out = message;
    const time = moment().format('DD HH:mm');
    const market = this.market;
    const out = Object.assign({time, market}, log);
    //  console.log(out);
    if (this.isLive) console.log(this.market + ' ' + log.action + ' ' + log.reason);
    this.logs.push(out);
  }

 /* get amountCoin() {
    if (!this.mcCoin) {
      console.warn(' no MC data');
      return 0;
    }

    let amount = (this.amountUS / this.mcCoin.price_usd);
    if (amount > 10) {
      amount = Math.round(amount);
      if (this.balance.balance > 0) {
        amount = amount - this.balance.balance;
      }
    } else amount = +amount.toFixed(2);
    return amount
  }
*/
  get state() {
    return this.state$.getValue();
  }

  set state(state: BotState) {
    this.state$.next(state);
    this.storage.upsert('state-' + this.exchange + this.market, state);
  }

  get priceBase() {
    return this.mcBase.price_usd;
  }

  get priceCoin() {
    return this.mcCoin.price_usd;
  }

  destroy() {
    this.stop();
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    this.deleteData();
  }

  async deleteData() {
    await this.storage.remove(this.id + '-logs');
    await this.storage.remove(this.id + '-orders');
  }

  async save() {
    this.storage.upsert(this.id + '-orders', this.orders$.getValue());
    if (!this.logs.length) return;
    const logs = await this.getLogs();
    this.logs = [];
    this.storage.upsert(this.id + '-logs', _.takeRight(logs, 500));
  }


  async getLogs() {
    let history: any[] = (await this.storage.select(this.id + '-logs')) || [];
    return history.concat(this.logs);
  }

  getPatterns() {
    return this.patterns;
  }


  stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = 0;
    this.log({action: 'STOP', reason: 'tick'});
  }

  toJSON(): VOWatchdog {
    return {
      exchange: this.exchange,
      market: this.market,
      orderType: this.orderType,
      isLive: this.isLive,
      amountUS: this.amountUS
    }
  }

  async start() {
    //  if (this.interval) return;
    //  const sec = Math.round(60 + (Math.random() * 20));
    //  console.log(this.market + ' start refresh rate ' + sec);

    // this.interval = setInterval(() => this.tick(), sec * 1000);
  }


}
