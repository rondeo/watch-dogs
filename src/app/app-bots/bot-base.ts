import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {StorageService} from '../a-core/services/app-storage.service';
import {debounceTime, filter, map, pairwise, skip} from 'rxjs/operators';
import * as moment from 'moment';
import {OrderType, VOBalance, VOBooks, VOOrder, VOWatchdog, WDType} from '../amodels/app-models';
import {ApiPrivateAbstaract} from '../a-core/apis/api-private/api-private-abstaract';
import {CandlesService} from '../a-core/app-services/candles/candles.service';
import * as _ from 'lodash';
import {UtilsBooks} from '../acom/utils-books';
import {ApiPublicAbstract} from '../a-core/apis/api-public/api-public-abstract';
import {Subscription} from 'rxjs/internal/Subscription';
import {UTILS} from '../acom/utils';
import {VOCandle} from '../amodels/api-models';
import {StopLossOrder} from './stop-loss-order';
import {Observable} from 'rxjs/internal/Observable';
import {Subject} from 'rxjs/internal/Subject';
import {CandlesUtils} from '../a-core/app-services/candles/candles-utils';
import {MATH} from '../acom/math';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {subscribeBalance} from './bot-utils';
import {ApiMarketCapService} from '../a-core/apis/api-market-cap.service';
import {BotBus, deltaMas} from './bot-bus';


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

  bus: BotBus;
  // viewState$: BehaviorSubject<BotState>;
//  mcState$: BehaviorSubject<MCState> = new BehaviorSubject(MCState.NONE);
  static potSizeUS = 50;
  base: string;
  coin: string;
  // mcCoin: VOMarketCap;
  // mcBase: VOMarketCap;

  // balance: MarketBalance;
//   macdSignal: MacdSignal;
  //  stopLossOrder: StopLossOrder;
//  sellOnJump: SellOnJump;
  patterns: any[];
  private logs: any[] = [];
  id: string;

/////////////////////////////////////////////////// new ///////////////

  mas$: Observable<{last: number, ma3: number, ma7: number, ma25: number, ma99: number }>;// = new BehaviorSubject(null);
  maDelta$: Observable<number>;
  wdType$: BehaviorSubject<WDType>;


  error$: Subject<string> = new Subject();
  priceInit$: BehaviorSubject<number> = new BehaviorSubject(0);
  priceStop$: Observable<number>;
  pots$: BehaviorSubject<number> = new BehaviorSubject(-1);
  potsBalance$: BehaviorSubject<number> = new BehaviorSubject(-1);

  bookBuy$: BehaviorSubject<number> = new BehaviorSubject(0);
  bookSell$: BehaviorSubject<number> = new BehaviorSubject(0);

  value$: BehaviorSubject<number> = new BehaviorSubject(0);
  books$: BehaviorSubject<VOBooks> = new BehaviorSubject(null);
  lastPrice$: Observable<number>;

  // stopLoss$: BehaviorSubject<VOOrder> = new BehaviorSubject(null);

  ordersOpen$: BehaviorSubject<VOOrder[]>;//  = new BehaviorSubject([]);
  ordersHistory$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);

  stopLossOrder$: Observable<VOOrder>;

  protected _balanceCoin$: BehaviorSubject<VOBalance> = new BehaviorSubject(null);

  get balanceCoin$(): Observable<VOBalance> {
    return this._balanceCoin$.pipe(filter(v => !!v));
  }

  protected _balanceBase$: BehaviorSubject<VOBalance> = new BehaviorSubject(null);
  get balanceBase$(): Observable<VOBalance> {
    return this._balanceBase$.pipe(filter(v => !!v));
  }

  get balanceCoin(): VOBalance {
    return this._balanceCoin$.getValue()
  }

  get amountCoin() {
    const bal = this._balanceCoin$.getValue();
    if (bal) return bal.balance;
    return (this.pots$.getValue() || 1) * this.potSize;
  }

  get ordersHistory(): VOOrder[] {
    return this.ordersHistory$.getValue() || [];
  }

  get buyOrder(): VOOrder {
    return this.ordersOpen$.getValue().find(function (item) {
      return item.orderType === OrderType.BUY;
    });
  }

  set wdType(type: WDType) {
    const t = this.wdType$.getValue();
    if (t && t !== type) {
      this.wdType$.next(type);
    }
  }

  get wdType() {
    return this.wdType$.getValue();
  }

  private marketPrecision;
  private interval;
  private sub1: Subscription;
  private sub2: Subscription;
  private sub3: Subscription;
  private sub4: Subscription;
  private sub5: Subscription;

  stopLossController: StopLossOrder;

///////////////////////////////////////////////////////////////////////////
  constructor(
    public exchange: string,
    public market: string,
    public potSize: number,
    public apiPrivate: ApiPrivateAbstaract,
    public apiPublic: ApiPublicAbstract,
    public candlesService: CandlesService,
    public storage: StorageService,
    public marketCap: ApiMarketCapService
  ) {

    this.id = exchange + '-' + market;
    const candles$ = candlesService.candles5m$(market);

    this.bus = new BotBus(this.id, candles$, storage);
    const ar = market.split('_');
    const base = ar[0];
    const coin = ar[1];
    this.base = base;
    this.coin = coin;
    this.storage.select(this.id + '-settings').then((sett: VOWatchdog) => {
      if (!sett) return;
      this.wdType$.next(sett.wdType);
      this.pots$.next(sett.pots);
    });

    this.wdType$ = this.bus.wdType$;
    this.ordersOpen$ = this.bus.ordersOpen$;
    this._balanceCoin$ = this.bus.balanceCoin$;
    this.mas$ = this.bus.mas$;
    this.stopLossOrder$ = this.bus.stopLossOrder$;

    combineLatest(this._balanceCoin$, this.wdType$).pipe(filter(([balance, type])=>{
      return !!balance && type === WDType.SHORT
    })).subscribe(([balance, wdType])=>{
      console.log(balance);
        if(balance.pending) {
          this.cancelAllOpenOrders();
        } else if(balance.available) {
          this.sellCoinInstant(balance.available);
          UTILS.wait(10).then(() => {
            this.apiPrivate.refreshBalancesNow();
          })
        }
    })


    this.wdType$.pipe(filter(v => !!v)).subscribe(type => {
      console.log(this.id + ' ' + type);
      if (type !== WDType.OFF) this.subscribeForBalancesAndOrders();
      else this.unsubscribe();
      if (type === WDType.SHORT) {
        // this.cancelAllOpenOrders();
      } else if (type === WDType.LONG) {

        /* this.cancelAllOpenOrders();
         UTILS.wait(5).then(() =>{
           const pots = this.pots$.getValue();
           this.adjustBalanceToPots(pots);
         })*/
      }
    });

    this.balanceCoin$.pipe(skip(1)).subscribe(balanceCoin => {
      console.warn(this.id, balanceCoin);
      this.storage.upsert(this.id + '-balanceCoin', balanceCoin);
      this.apiPrivate.refreshAllOpenOrders();
    });

    storage.select(this.id + '-orders-history')
      .then(orders => {
        this.ordersHistory$.next(orders ? orders.map(function (item) {
          return new MyOrder(item)
        }) : []);
      });


    storage.select(this.id + '-balanceCoin').then(b => {
      console.log(this.id + ' saved balance ', b);
      this._balanceCoin$.next(b);

      storage.select(this.id + '-orders-open')
        .then(orders => {
          this.ordersOpen$.next(orders ? orders.map(function (item) {
            return new MyOrder(item)
          }) : []);

        });
    });

    console.log('  bot created ' + this.id);

    this.ordersHistory$.subscribe(orders => {

    });

    this.maDelta$ = this.bus.mas$.pipe(map(deltaMas));
    this.lastPrice$ = this.bus.mas$.pipe(map(mas => mas.last));


    combineLatest(this.balanceCoin$, marketCap.ticker$()
      .pipe(map(MC => MC[this.coin].price_usd)))
      .subscribe(([balance, priceUS]) => {
      this.potSize = BotBase.potSizeUS / priceUS;
      const potsBalance = balance ? +(balance.balance / this.potSize).toFixed(1) : 0;
      this.potsBalance$.next(potsBalance);
    });

    this.stopLossController = new StopLossOrder(
      market,
      apiPrivate,
      this.bus,
      this.storage
    );

    this.priceStop$ = this.bus.priceStop$
  }

  subAll;

  subscribeForAll() {

    this.balanceCoin$.pipe(
      pairwise()
    ).subscribe(([old, balance]) =>{
      console.log('old / new balance', old, balance);
    });

    if (this.subAll) this.subAll.unsubscribe();
    this.subAll = combineLatest(this.wdType$, this.balanceCoin$, this.pots$, this.potsBalance$)
      .pipe(debounceTime(100))
      .subscribe(([type, balance, pots, potsBalance]) => {
        if (type === WDType.LONGING && potsBalance === 0) {
          this.wdType$.next(WDType.LOST);
        } else if (type === WDType.LONG && potsBalance !== 0) {
          this.wdType$.next(WDType.LONGING);
          this.adjustBalanceToPots(pots, potsBalance);
        } else if (type === WDType.LONGING && potsBalance !== 0) {
          this.adjustBalanceToPots(pots, potsBalance);
        }


      })
  }

  async cancelAllOpenOrders() {
    console.log(this.id + ' canceling all open orders')
    const openOrders = this.ordersOpen$.getValue();
    const results = await this.cancelOrders(openOrders.map(function (item) {
      return item.uuid;
    }));
    console.log(this.id + ' CANCEL ORDERS RESULTS ', results);
    await UTILS.wait(5);
    this.apiPrivate.refreshBalancesNow();
    return results;
  }

  cancelOrders(uids: string[]) {
    return Promise.all(uids.map(async (uid) => {
      await UTILS.wait(2);
      const res = await this.apiPrivate.cancelOrder2(uid, this.market).toPromise();
      await UTILS.wait(2);
      return res;
    }))

  }

  refreshOpenOrders() {
    this.apiPrivate.refreshAllOpenOrders()
  }

  unsubscribe() {
    if (this.sub1) {
      this.sub1.unsubscribe();
      this.sub2.unsubscribe();
      this.sub3.unsubscribe();
      this.sub4.unsubscribe();
    }
    this.sub1 = null;
  }

  subscribeForBalancesAndOrders() {
    if (this.sub1) return;
    this.subscribeForAll();
    const base = this.base;
    const coin = this.coin;

    this.sub1 = this.apiPrivate.openOrders$.subscribe(orders => {
      const myOrders = orders.filter(function (item) {
        return item.base === base && item.coin === coin;
      });
      console.log(this.id + ' MY open orders   ', myOrders);
      this.ordersOpen$.next(myOrders);
      this.storage.upsert(this.id + '-orders-open', myOrders);
    });

    this.sub2 = subscribeBalance(base, coin, this.potSize / 10, this.apiPrivate.balances$(), this._balanceCoin$, this._balanceBase$);

    this.sub3 = this.apiPrivate.ordersHistory$(this.market).subscribe(orders => {
      const buyOrders = orders.filter(function (item) {
        return item.orderType === OrderType.BUY;
      });

      const sellOrders = orders.filter(function (item) {
        return item.orderType === OrderType.SELL;
      });

      this.ordersHistory$.next(orders);
      this.storage.upsert(this.id + '-orders-history', orders);
    });

  }

  private adjustBalanceToPots(pots: number, postsBalance: number) {
    const diff = pots - postsBalance;
    console.log('%c ' + this.id + ' pots diff ' + diff, 'color:green');


    if (Math.abs(diff) > 1) {
      const amountCoin = Math.abs(diff) * this.potSize;
      if (diff > 0) this.buyCoinInstant(amountCoin).then(res => {
        console.log(this.id + '  followPots BUY ', res)
      }).catch(console.error);
      else this.sellCoinInstant(amountCoin).then(res => {
        console.log(this.id + '  followPots SELL ', res)
      }).catch(console.error);
    }

  }


  downloadBooks() {
    const sub = this.apiPublic.downloadBooks2(this.market);
    sub.subscribe(books => {
      this.books$.next(books);
      this.calculateBooks();
    });
    return sub;
  }

  calculateBooks() {
    const books: VOBooks = this.books$.getValue();
    const amount = this.amountCoin;
    const sellPrice = UtilsBooks.getRateForAmountCoin(books.buy, amount);
    const buyPrice = UtilsBooks.getRateForAmountCoin(books.sell, amount);
    this.marketPrecision = sellPrice.toString().length > buyPrice.toString().length ? sellPrice.toString().length : buyPrice.toString().length;
    this.bookSell$.next(sellPrice);
    this.bookBuy$.next(buyPrice);
  }


  async buyCoinInstant(qty: number) {
    console.warn(' buyCoinInstant ' + qty);
    if (!qty) {
      console.warn(' no QTY');
      this.log({action: 'STOP BUY', reason: ' no QTY'});
      return Promise.resolve(null);
    }

    const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
    const rate = UtilsBooks.getRateForAmountCoin(books.sell, qty);
    const res = await this.setBuyOrder(rate, qty);
    await UTILS.wait(2);
    this.apiPrivate.refreshBalancesNow();
    return res;
  }

  addPots(pots: number) {
    let oldPots = this.pots$.getValue();
    oldPots = oldPots + pots;
    this.pots$.next(oldPots);
  }

  removePots(pots: number) {
    let oldPots = this.pots$.getValue();
    oldPots = oldPots - pots;
    this.pots$.next(oldPots);
  }

  async setBuyOrder(rate: number, amountCoin: number) {
    const balanceBase = this._balanceBase$.getValue();
    if (!balanceBase) return;
    const baseAvailable = balanceBase.available;
    let need = (amountCoin * rate);
    need = need + (need * 0.003);
    need = +need.toPrecision(4);
    console.warn('%c BUY_ORDER  ' + this.id + ' qty ' + amountCoin + ' need ' + need + ' available ' + baseAvailable, 'color:red');
    if (baseAvailable < need) {
      this.error$.next(this.id + ' available ' + baseAvailable + ' need  ' + need);
      return
    }

    let result;
    try {
      result = await this.apiPrivate.buyLimit2(this.market, amountCoin, rate);

    } catch (e) {
      this.error$.next(this.id + ' ERROR BUY_ORDER_RESULT ' + e.toString());
    }
    await UTILS.wait(2);
    return result
  }

  async setSellOrder(rate: number, amountCoin: number, stopLoss: number) {
    console.warn(' setSellOrder ', rate, amountCoin, stopLoss);
    const balance: VOBalance = this._balanceCoin$.getValue()
    if (!balance) {
      console.error(' no balance ');
      return Promise.resolve()
    }

    if (amountCoin > balance.balance) {
      console.error(' no enough balance ');
      return Promise.resolve()
    }

    if (amountCoin > balance.available) {
      const openOrders = this.ordersOpen$.getValue();
      if (openOrders.length) {
        console.log('CANCELING ALL OPEN orders ', openOrders);
        await Promise.all(openOrders.map((item) => {
          return this.apiPrivate.cancelOrder2(item.uuid, item.market).toPromise();
        })).catch(err => {
          console.error('ERROR CANCELING ORDERS', err);
          this.apiPrivate.refreshAllOpenOrders();
        });
        await UTILS.wait(5);
      } else {
        console.error(' no available and no open orders ')
      }


    }

    console.log(this.id + ' SELL_ORDER qty ' + amountCoin + 'rate ' + rate);
    let result;
    try {
      result = await this.apiPrivate.sellLimit2(this.market, amountCoin, rate);
      console.log(this.id + 'SELL_ORDER result', result);
    } catch (e) {
      this.error$.next(this.id + ' SELL_ORDER result ' + e.toString());
    }
    await UTILS.wait(2);
    return result;
  }


  async sellCoinInstant(qty = 0) {
    const amountCoin = qty ? qty : this.amountCoin;
    const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
    const rate = UtilsBooks.getRateForAmountCoin(books.buy, amountCoin);
    console.log('SELL_INSTANT ' + qty);
    const res = await this.setSellOrder(rate, amountCoin, 0);
    await UTILS.wait(2);
    return res;
  }


  async botInit() {
    /* const ar = this.market.split('_');
   //  this.base = ar[0];
    // this.coin = ar[1];

    //  this.viewState$ = new BehaviorSubject<BotState>((await this.storage.select('viewState-' + this.exchange + this.market)) || BotState.NONE);

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
     this.sellOnJump.viewState$.subscribe(viewState => {
       if (viewState === BuySellState.SELL_ON_JUMP && this.balance.viewState === BalanceState.BOUGHT) {

         this.log({action: 'SELL_ON_JUMP', reason: this.sellOnJump.reason});

         this.sellCoinInstant(0);
       }
       console.log(this.market + ' sellOnJump ' + viewState + ' ' + this.sellOnJump.reason);
     });

     this.macdSignal.viewState$.subscribe(res => {
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

     this.balance.viewState$.subscribe(viewState => {
       this.log({action: 'BALANCE', reason: viewState});
     });

     // this.stopLossOrder = new StopLossOrder(this.market, this.apiPrivate);
     // this.stopLossOrder.log = this.log.bind(this);

     const sub = this.candlesService.candles15min$(this.market);

     sub.subscribe(candles => {
       //  console.log(_.map(_.takeRight(candles, 10),'time'));
     })*/
  }


  log(log
        :
        {
          action: string, reason
            :
            string
        }
  ) {
    // if (typeof message !== 'string') out = UTILS.toString(message);
    // else out = message;
    const time = moment().format('DD HH:mm');
    const market = this.market;
    const out = Object.assign({time, market}, log);
    //  console.log(out);
    //  if (this.isLive) console.log(this.market + ' ' + log.action + ' ' + log.reason);
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

  /*  get viewState() {
      return this.viewState$.getValue();
    }

    set viewState(viewState: BotState) {
      this.viewState$.next(viewState);
      this.storage.upsert('viewState-' + this.exchange + this.market, viewState);
    }*/

  destroy() {
    this.stop();
    this.unsubscribe();
    this.stopLossController.destroy();
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

  getPatterns() {
    return this.patterns;
  }

  stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = 0;
    this.log({action: 'STOP', reason: 'tick'});
  }

  saveSettings() {
    this.storage.upsert(this.id + '-settings', this.toJSON());
  }

  toJSON(): VOWatchdog {
    return {
      exchange: this.exchange,
      market: this.market,
      wdType: this.wdType$.getValue(),
      pots: this.pots$.getValue(),
      stopLoss: this.stopLossController.toJSON()
    }
  }

  async start() {
    //  if (this.interval) return;
    //  const sec = Math.round(60 + (Math.random() * 20));
    //  console.log(this.market + ' start refresh rate ' + sec);

    // this.interval = setInterval(() => this.tick(), sec * 1000);
  }


}
