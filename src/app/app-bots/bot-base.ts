import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {StorageService} from '../a-core/services/app-storage.service';
import {filter, map, skip} from 'rxjs/operators';
import {OrderType, VOBalance, VOBooks, VOOrder, VOWatchdog, WDType} from '../amodels/app-models';
import {ApiPrivateAbstaract} from '../a-core/apis/api-private/api-private-abstaract';
import {CandlesService} from '../a-core/app-services/candles/candles.service';
import * as _ from 'lodash';
import {UtilsBooks} from '../acom/utils-books';
import {ApiPublicAbstract} from '../a-core/apis/api-public/api-public-abstract';
import {Subscription} from 'rxjs/internal/Subscription';
import {UTILS} from '../acom/utils';
import {Observable} from 'rxjs/internal/Observable';
import {Subject} from 'rxjs/internal/Subject';
import {ApiMarketCapService} from '../a-core/apis/api-market-cap.service';
import {BotBus, deltaMas} from './bot-bus';
import {Store} from '@ngrx/store';
import {AppState} from '../app-store/reducers';
import {optimizeBalance} from './bot-utils';
import {TaskController} from './controllers/models';
import {
  buyForLong,
  buyingForLong,
  selectSellOrdersForLong, sellForLong,
  setStopLossAuto,
  transferToSLState
} from './controllers/selectors';
import {StopLossAuto} from './stop-loss-auto';
import {cancelBuysForShort, cancelStopLossOnShort, needSellOrder, shortIsReady, waitForSelling} from './controllers/short-selectors';
import {cancelOrders} from './controllers/cancel-orders';
import {BuySignal} from './controllers/buy-signal';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';


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
  action: string;
  isOpen: boolean;
  rate: number;
  fee: number;
  orderType: OrderType;
  amountCoin: number;
  timestamp: number;

  pots?: number;

  message?: string;
  type?: string;
  date?: string;
  exchange?: string;

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

export interface BotSettings {
  pots: number;
  wdType: WDType
}

export class BotBase {

  allBalances: { [coin: string]: VOBalance };
  bus: BotBus;
  static potSizeUS = 50;
  base: string;
  coin: string;
  private logs: any[] = [];
  id: string;


/////////////////////////////////////////////////// new ///////////////

  mas$: Observable<{ last: number, ma3: number, ma7: number, ma25: number, ma99: number }>;
  maDelta$: Observable<number>;
  wdType$: Observable<WDType>;


  error$: Subject<string> = new Subject();
  priceInit$: Observable<number[]>;
  priceStop$: Observable<number>;
  pots$: Observable<number>;
  potsBalance$: Observable<number>;

  bookBuy$: BehaviorSubject<number> = new BehaviorSubject(0);
  bookSell$: BehaviorSubject<number> = new BehaviorSubject(0);

  value$: BehaviorSubject<number> = new BehaviorSubject(0);
  books$: BehaviorSubject<VOBooks> = new BehaviorSubject(null);
  lastPrice$: Observable<number>;
  ordersOpen$: BehaviorSubject<VOOrder[]>;
  ordersHistory$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);

  stopLossOrder$: Observable<VOOrder>;

  get buyOrder(): VOOrder {
    return this.ordersOpen$.getValue().find(function (item) {
      return item.orderType === OrderType.BUY;
    });
  }

  set wdType(type: WDType) {
    this.bus.setWDType(type)
  }

  private marketPrecision;
  private interval;
  private sub1: Subscription;
  private sub2: Subscription;
  private sub3: Subscription;

  controller: TaskController;

  subs: Subscription[] = [];

///////////////////////////////////////////////////////////////////////////
  constructor(
    public config: VOWatchdog,
    public apiPrivate: ApiPrivateAbstaract,
    public apiPublic: ApiPublicAbstract,
    private store: Store<AppState>,
    public candlesService: CandlesService,
    public storage: StorageService,
    public marketCap: ApiMarketCapService,
    private btcusdt
  ) {
    this.id = config.id;

    const candles$ = candlesService.candles5m$(config.market);

    this.bus = new BotBus(config, candles$, storage);

    const ar = config.market.split('_');
    const base = ar[0];
    const coin = ar[1];
    this.base = base;
    this.coin = coin;
    this.wdType$ = this.bus.wdType$;
    this.ordersOpen$ = this.bus.ordersOpen$;
    this.potsBalance$ = this.bus.potsBalance$;
    this.mas$ = this.bus.mas$;
    this.pots$ = this.bus.pots$;
    this.maDelta$ = this.bus.mas$.pipe(map(deltaMas));
    this.lastPrice$ = this.bus.mas$.pipe(map(mas => mas.last));
    this.priceStop$ = this.bus.priceStop$;
    this.priceInit$ = this.bus.entryPrices$;

    this.bus.init().then(() => {
      this.init();
    });
  }

  stopLossAuto: StopLossAuto;
  subAll;

  async init() {

    //if (this.config.wdType === WDType.LONG_SL && this.config.stopLoss.auto)
     // this.stopLossAuto = new StopLossAuto(this.apiPrivate, this.bus);

    this.bus.balanceChange$.subscribe(() => {
      this.apiPrivate.refreshAllOpenOrders();
    });

    this.apiPrivate.balances$().pipe(skip(1)).subscribe(balances => {
      this.allBalances = balances;
      if(this.bus.isDirty) {
        UTILS.wait(5).then(() => {
          this.apiPrivate.refreshAllOpenOrders().then(() => {
            this.bus.isDirty = false;
          })
        })
      }
      console.log(balances[this.coin], this.bus.ordersOpen$.getValue())

      this.bus.balanceTick(optimizeBalance(this.config.potSize, balances[this.coin]), balances[this.base]);
      if(this.config.wdType === WDType.LONG) {
        console.log(this.bus.balanceCoin$.getValue(), this.bus.ordersOpen$.getValue())
      }
    });

    const coin = this.coin;

    this.apiPrivate.openOrders$.pipe(map(orders => orders.filter(function (order) {
      return order.coin === coin;
    }))).subscribe(orders => this.bus.ordersOpen$.next(orders));


    //////////////////////////////////////////////////////////////////////////////////
    this.bus.wdType$.subscribe(wdType => {
      console.log(this.id + '  ' + wdType);
      this.unsubscribeAr();

      if (wdType === WDType.LONG) {
        if (this.buySignal) this.buySignal.destroy();
        this.buySignal = null;
        this.initLong();
      } else if (wdType === WDType.SHORT) {
        if (this.stopLossAuto) this.stopLossAuto.destroy();
        this.stopLossAuto = null;
        this.initShort();
      }
    })
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////



  buySignal: BuySignal;
  initShort() {
    console.log(' INIT SHORT');
    let sub: Subscription;
    sub = cancelStopLossOnShort(this.bus).subscribe(stopLossOrders => {
      console.log(' cancelStopLossOnShort ', stopLossOrders);


      cancelOrders(stopLossOrders, this.apiPrivate, this.bus).subscribe(res => console.log(res))
    });
    this.subs.push(sub);
    sub = waitForSelling(this.bus).subscribe(data => {
      console.log(' waitForSelling  ', data);
    });
    this.subs.push(sub);
    sub = cancelBuysForShort(this.bus).subscribe(buyOrders => {
      console.log(' need cancel buy orders for short ', buyOrders)
      if(this.bus.isDirty) return;
      this.bus.isDirty = true;
      cancelOrders(buyOrders, this.apiPrivate, this.bus)
    });

    this.subs.push(sub);
    sub = needSellOrder(this.bus).subscribe(amountCoin => {
      console.log(' need sell order ', amountCoin);

      const market = this.config.market;

      const order: VOOrder = {
        uuid: Date.now().toString(),
        isOpen: true,
        market,
        action: 'SELL',
        type: 'TEMP',
        amountCoin,
        rate: 0
      };
      this.bus.addOrder(order);

     /* this.sellCoinInstant(amountCoin).then(res => {
        console.log(' need sell order RESULT ', res);
      })*/
      /*  this.buyCoinInstant(data).then(res => {
          console.log(' need sell order RESULT ', res);
        })*/
    });

    this.subs.push(sub);
    sub = shortIsReady(this.bus).subscribe(amountCoin => {
      console.log(this.id + ' ready to buy ' + amountCoin);
      if (!this.buySignal) {
        this.buySignal = new BuySignal(this.bus);
        const s = combineLatest(shortIsReady(this.bus), this.buySignal.signal$).subscribe(([amountCoin, signal]) => {
          console.log(amountCoin, signal);
          if (signal === 'BUY_NOW') {
            console.log('BUY_NOW transferring to long  ');
            this.bus.setWDType(WDType.LONG);
          }
        });
        this.subs.push(s)
      }
    });
    this.subs.push(sub);
  }

  initLong() {

    let sub: Subscription;
    console.log(' INIT LONG ');
    sub = buyForLong(this.bus).subscribe(({amountCoin, buyOrders}) => {
      console.log(this.id + ' BUY FOR LONG ', amountCoin, buyOrders);
      const market = this.config.market;
      const order: VOOrder = {
        uuid: Date.now().toString(),
        isOpen: true,
        market,
        action: 'BUY',
        type: 'TEMP',
        amountCoin,
        rate: 0
      };
      this.bus.addOrder(order);
    });
    this.subs.push(sub);
    sub = buyingForLong(this.bus).subscribe(data => {
      console.log(this.id + ' BUYING FOR LONG ', data);
    });
    this.subs.push(sub);
    sub = setStopLossAuto(this.bus).subscribe(data => {
      console.log(this.id + ' SET STOP_LOSS Auto ', data);
     // if (!this.stopLossAuto) this.stopLossAuto = new StopLossAuto(this.apiPrivate, this.bus);
    });
    this.subs.push(sub);
    sub = selectSellOrdersForLong(this.bus).subscribe(sellOrders => {
      if(sellOrders.length) console.log(this.id + ' CANCEL SELL ORDERS FOR LONG ', sellOrders);
    });
    this.subs.push(sub);
    sub = transferToSLState(this.bus).subscribe(data => {
      console.log(this.id + ' TRANSFER TO SL STATE ', data);
      // this.bus.setWDType(WDType.LONG_SL);
    });

    this.subs.push(sub);

    sub = this.bus.tempOrders$.subscribe(tempOrders => {
      console.log(tempOrders);
      if(tempOrders.length === 1) {
        console.log(' snd order ', tempOrders);
        this.sendOrder(tempOrders[0])
      } else {
        console.log(' ERROR FEW TEMP ORDERS', tempOrders);
      }
    })

    this.subs.push(sub);

    sub = sellForLong(this.bus).subscribe(({amountCoin, orders}) => {
      console.log(this.id + ' SELL LONG ', amountCoin, orders);
      if(this.stopLossAuto) {
        this.stopLossAuto.destroy();
      }
      if(orders.length) {
        cancelOrders(orders, this.apiPrivate, this.bus);
        return;
      }

      amountCoin = Math.abs(amountCoin);
      const market = this.config.market

      const order: VOOrder = {
        uuid: Date.now().toString(),
        isOpen: true,
        market,
        action: 'SELL',
        type: 'TEMP',
        amountCoin,
        rate: 0
      };
      this.bus.addOrder(order);
    })


  }



  async cancelAllOpenOrders() {
    console.log(this.id + ' canceling all open orders')
    /*const openOrders = this.ordersOpen$.getValue();

    const results = await this.cancelOrders(openOrders.map(function (item) {
      return item.uuid;
    }));
    console.log(this.id + ' CANCEL ORDERS RESULTS ', results);
    await UTILS.wait(5);
    this.apiPrivate.refreshBalancesNow();*/
    //  return results;
  }


  refreshOpenOrders() {
    this.apiPrivate.refreshAllOpenOrders()
  }

  unsubscribeAr() {
    this.subs.forEach(function (item) {
      item.unsubscribe()
    });
    this.subs = [];
  }


  unsubscribe() {
    if (this.sub1) {
      this.sub1.unsubscribe();
      this.sub2.unsubscribe();
      this.sub3.unsubscribe();
    }

    if (this.subAll) this.subAll.unsubscribe();
    this.sub1 = null;
  }


  async buyCoinInstant(order: VOOrder) {
    console.warn(this.config.market + ' buyCoinInstant ' + order.amountCoin);
    if (!order.amountCoin) {
      console.warn(' no QTY');
      return Promise.resolve(null);
    }
    let books = this.bus.books$.getValue();
    if (!books) {
      books = await this.apiPublic.downloadBooks2(order.market).toPromise();
      this.bus.books$.next(books);
    }
    order.rate = UtilsBooks.getRateForAmountCoin(books.sell, order.amountCoin);
    return this.sendOrder(order);
  }

  async sendOrder(order: VOOrder) {
    if(this.bus.isDirty) {
      console.log(' DATA DIRTY');
      return
    }
    this.bus.isDirty = true;
    if(order.amountCoin === 0) {
      console.warn(' amount 0');
      this.bus.removeOrder(order);
      return;
    }
    let res = order;
    if(order.action === 'SELL') {
      const balanceCoin = this.bus.balanceCoin$.getValue();
      if(balanceCoin.available < order.amountCoin) {
        console.log(' DONT have available balance coin ', order, balanceCoin);
        return
      }
    }


    console.log('sending order ', order);
    if(!order.rate) {
      console.log(' DOWNLOADING BOOKS FOR Rate ');
      const books = await this.apiPublic.downloadBooks2(order.market).toPromise();
      const myBooks = order.action === 'BUY'?books.sell:books.buy;
      order.rate = UtilsBooks.getRateForAmountCoin(myBooks, order.amountCoin);
      await UTILS.wait(10);
    }

    const balanceBase: VOBalance = this.bus.balanceBase$.getValue();
    if(balanceBase.available < order.amountCoin * order.rate) {
      console.log(' DONT HAVE enough balance base ' +(order.amountCoin * order.rate), order, balanceBase);
      return
    }

    try {
      if (order.action === 'BUY') res = await this.apiPrivate.buyLimit2(order.market, order.amountCoin, order.rate);
      else res = await this.apiPrivate.sellLimit2(order.market, order.amountCoin, order.rate);
    } catch (e) {
      console.log(e);
    }
    if (res) {
      console.log(order, res);
      res.type = 'SENT';
      this.bus.replaceOrder(order, res);
    }
    return res;
  }

  async sellCoinInstant(order: VOOrder) {

    const books = await this.apiPublic.downloadBooks2(this.config.market).toPromise();
    const rate = UtilsBooks.getRateForAmountCoin(books.buy, order.amountCoin);
    console.warn('SELL_INSTANT ' + order.amountCoin);

    return this.sendOrder(order);
  }


  onConfigChanged(wd0: WDType, pots0: number, wd1: WDType, pots1: number, pots: number, orders: VOOrder[]) {

  }

  destroy() {
    this.stop();
    this.unsubscribeAr();
    this.unsubscribe();
    this.deleteData();
  }

  async deleteData() {
    await this.storage.remove(this.id + '-logs');
    await this.storage.remove(this.id + '-orders-history');
    await this.storage.remove(this.id + '-orders-open');
    await this.storage.remove(this.id + '-settings')
  }

  async saveLogs() {
    if (!this.logs.length) return;
    const logs = await this.getLogs();
    this.logs = [];
    this.storage.upsert(this.id + '-logs', _.takeRight(logs, 500));
  }

  async getLogs() {
    let history: any[] = (await this.storage.select(this.id + '-logs')) || [];
    return history.concat(this.logs);
  }

  stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = 0;
  }

  async start() {
    //  if (this.interval) return;
    //  const sec = Math.round(60 + (Math.random() * 20));
    //  console.log(this.market + ' start refresh rate ' + sec);

    // this.interval = setInterval(() => this.tick(), sec * 1000);
  }


}
