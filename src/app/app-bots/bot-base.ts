import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {StorageService} from '../a-core/services/app-storage.service';
import {map, skip, withLatestFrom} from 'rxjs/operators';
import * as moment from 'moment';
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
import {SettingsController} from './controllers/settings.controller';
import {LongingController} from './controllers/longing.controller';
import {TaskController} from './controllers/models';
import {StartLongController} from './controllers/start-long.controller';


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

  allBalances: { [coin: string]: VOBalance };
  bus: BotBus;
  static potSizeUS = 50;
  base: string;
  coin: string;
  private logs: any[] = [];
  id: string;


/////////////////////////////////////////////////// new ///////////////

  mas$: Observable<{ last: number, ma3: number, ma7: number, ma25: number, ma99: number }>;// = new BehaviorSubject(null);
  maDelta$: Observable<number>;
  wdType$: BehaviorSubject<WDType>;


  error$: Subject<string> = new Subject();
  priceInit$: BehaviorSubject<number> = new BehaviorSubject(0);
  priceStop$: Observable<number>;
  pots$: BehaviorSubject<number>;
  potsBalance$: Observable<number>;

  bookBuy$: BehaviorSubject<number> = new BehaviorSubject(0);
  bookSell$: BehaviorSubject<number> = new BehaviorSubject(0);

  value$: BehaviorSubject<number> = new BehaviorSubject(0);
  books$: BehaviorSubject<VOBooks> = new BehaviorSubject(null);
  lastPrice$: Observable<number>;

  // stopLoss$: BehaviorSubject<VOOrder> = new BehaviorSubject(null);

  ordersOpen$: BehaviorSubject<VOOrder[]>;//  = new BehaviorSubject([]);
  ordersHistory$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);

  stopLossOrder$: Observable<VOOrder>;

  get buyOrder(): VOOrder {
    return this.ordersOpen$.getValue().find(function (item) {
      return item.orderType === OrderType.BUY;
    });
  }

  set wdType(type: WDType) {
    this.bus.wdType$.next(type);
  }

  get wdType() {
    return this.wdType$.getValue();
  }

  private marketPrecision;
  private interval;
  private sub1: Subscription;
  private sub2: Subscription;
  private sub3: Subscription;


  settingsController: SettingsController;

  controller: TaskController;

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
    this.settingsController = new SettingsController(this.bus);

    const ar = config.market.split('_');
    const base = ar[0];
    const coin = ar[1];
    this.base = base;
    this.coin = coin;
    this.wdType$ = this.bus.wdType$;
    this.ordersOpen$ = this.bus.ordersOpen$;
    this.potsBalance$ = this.bus.potsBalance$;
    this.mas$ = this.bus.mas$;
    this.stopLossOrder$ = this.bus.stopLossOrder$;
    this.pots$ = this.bus.pots$;
    this.maDelta$ = this.bus.mas$.pipe(map(deltaMas));
    this.lastPrice$ = this.bus.mas$.pipe(map(mas => mas.last));
    this.priceStop$ = this.bus.priceStop$;

    this.bus.init().then(() => {
      this.settingsController.init().then(() => {
        this.init().then(() => {

          console.log('  bot created ' + this.id);
          const type = this.bus.wdType$.getValue();
          switch (type) {
            case WDType.LONG:
            /*  this.controller = new LongingController(this);
              this.controller.status.subscribe(status => {
                if(status === 'LOST') {
                  this.controller = null;
                  this.bus.wdType$.next(WDType.LOST);
                }
              });*/
              break;
          }
        })
      })
    });
  }

  subAll;

 /* removeStopLossControlloer() {
    if (!this.stopLossController) return;
    this.stopLossController.destroy();
    this.stopLossController = null;
  }*/



  async init() {
    if (this.subAll) this.subAll.unsubscribe();
    this.bus.wdType$.subscribe(type => {
      console.warn(type);
      switch(type) {
        case WDType.LONG:

          if(this.controller) this.controller.destroy();
          this.controller = new StartLongController(this);
          this.controller.status.subscribe(status => {
            console.log(status);
            if(status === 'DONE') {
              this.controller = new LongingController(this);
              this.controller.status.subscribe(status => {
                if(status === 'LOST') {
                  this.bus.wdType$.next(WDType.LOST);
                  this.controller = null
                }
              })
            }
          })

          break;
      }
      if (type === WDType.OFF) {
        if (this.controller) this.controller.destroy();
        this.controller = null;
      }
    });

    this.apiPrivate.balances$().pipe(skip(1)).subscribe(balances => {
      this.allBalances = balances;
      this.bus.balanceTick(optimizeBalance(this.config.potSize, balances[this.coin]), balances[this.base]);
    });

    const coin = this.coin;

    this.apiPrivate.openOrders$.pipe(map(orders => orders.filter(function (order) {
      return order.coin === coin;
    }))).subscribe(orders => this.bus.ordersOpen$.next(orders));
    this.bus.currentTask$.subscribe(task => {
      if (task) task.start(this).subscribe(result => {
       /* if (result === 'DONE') {
          console.log(' task done ' + task.name);
          switch (task.name) {
            case TaskName.START_LONG:
              this.controller = new LongingController(this);
              break;
          }
          this.bus.currentTask$.next(null);
        }
        console.log('%c ' + this.id + '   ' + result, 'color:red');*/
      });

    })


    ////////////////////////////////// Settings changer ////////


    this.bus.balanceChange$.pipe(
      withLatestFrom(this.bus.wdType$)).subscribe(([balance, wdType]) => {
      console.log(' balance changed ', balance, wdType);
    });

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
      await UTILS.wait(5);
      const res = await this.apiPrivate.cancelOrder2(uid, this.config.market).toPromise();
      await UTILS.wait(5);
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
    }
    if (this.subAll) this.subAll.unsubscribe();
    this.sub1 = null;
  }

  /*subscribeForBalancesAndOrders() {
    if (this.sub1) return;
    const coin = this.coin;
    this.apiPrivate.balances$().pipe(skip(1)).subscribe(balances => {
      this.allBalances = balances;
      this.bus.balanceTick(optimizeBalance(this.potSize, balances[coin]), balances[this.base]);
    });
    // this.subscribeForAll();

    /!*const coin = this.coin;
    const base = this.base;

    this.sub1 = this.apiPrivate.openOrders$.subscribe(orders => {

      const myOrders = orders.filter(function (item) {
        return item.base === base && item.coin === coin;
      });
      console.log(this.id + ' MY open orders   ', myOrders);
      this.ordersOpen$.next(myOrders);
      this.storage.upsert(this.id + '-orders-open', myOrders);
    });

    this.apiPrivate.balances$().pipe(skip(1)).subscribe(balances => {
      this.allBalances = balances;
      this.bus.balanceTick(optimizeBalance(this.potSize,  balances[coin]));
    });

    this.sub3 = this.apiPrivate.ordersHistory$(this.market).subscribe(orders => {
      const buyOrders = orders.filter(function (item) {
        return item.orderType === OrderType.BUY;
      });

      const sellOrders = orders.filter(function (item) {
        return item.orderType === OrderType.SELL;
      });

      this.ordersHistory$.next(orders);
      this.storage.upsert(this.id + '-orders-history', orders);
    });*!/

  }*/

  private adjustBalanceToPots(pots: number, postsBalance: number) {
    const diff = pots - postsBalance;
    console.log('%c ' + this.id + ' pots diff ' + diff, 'color:green');


    if (Math.abs(diff) > 1) {
      const amountCoin = Math.abs(diff) * this.config.potSize;
      if (diff > 0) this.buyCoinInstant(amountCoin).then(res => {
        console.log(this.id + '  followPots BUY ', res)
      }).catch(console.error);
      else this.sellCoinInstant(amountCoin).then(res => {
        console.log(this.id + '  followPots SELL ', res)
      }).catch(console.error);
    }

  }


  downloadBooks() {
    const sub = this.apiPublic.downloadBooks2(this.config.market);
    sub.subscribe(books => {
      this.books$.next(books);
      this.calculateBooks();
    });
    return sub;
  }

  calculateBooks() {
    const books: VOBooks = this.books$.getValue();
    const amount = 0;//this.amountCoin;
    const sellPrice = UtilsBooks.getRateForAmountCoin(books.buy, amount);
    const buyPrice = UtilsBooks.getRateForAmountCoin(books.sell, amount);
    this.marketPrecision = sellPrice.toString().length > buyPrice.toString().length ? sellPrice.toString().length : buyPrice.toString().length;
    this.bookSell$.next(sellPrice);
    this.bookBuy$.next(buyPrice);
  }


  async buyCoinInstant(amountCoin: number) {
    console.log(this.config.market + ' buyCoinInstant ' + amountCoin);
    if (!amountCoin) {
      console.warn(' no QTY');
      this.log({action: 'STOP BUY', reason: ' no QTY'});
      return Promise.resolve(null);
    }
    let books = this.bus.books$.getValue();
    if (!books) {
      books = await this.apiPublic.downloadBooks2(this.config.market).toPromise();
      this.bus.books$.next(books);
    }

    const rate = UtilsBooks.getRateForAmountCoin(books.sell, amountCoin);
    const res = await this.apiPrivate.buyLimit2(this.config.market, amountCoin, rate);
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

  /* async setBuyOrder(rate: number, amountCoin: number) {
     const balanceBase = null // this._balanceBase$.getValue();
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
   }*/

  async setSellOrder(rate: number, amountCoin: number, stopLoss: number) {
    console.warn(' setSellOrder ', rate, amountCoin, stopLoss);
    const balance: VOBalance = null // this._balanceCoin$.getValue()
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
      result = await this.apiPrivate.sellLimit2(this.config.market, amountCoin, rate);
      console.log(this.id + 'SELL_ORDER result', result);
    } catch (e) {
      this.error$.next(this.id + ' SELL_ORDER result ' + e.toString());
    }
    await UTILS.wait(2);
    return result;
  }


  async sellCoinInstant(qty = 0) {

    const amountCoin = qty ? qty : 0;//this.amountCoin;
    const books = await this.apiPublic.downloadBooks2(this.config.market).toPromise();
    const rate = UtilsBooks.getRateForAmountCoin(books.buy, amountCoin);
    console.log('SELL_INSTANT ' + qty);
    return;
    const res = await this.setSellOrder(rate, amountCoin, 0);
    await UTILS.wait(2);
    return res;
  }

  onConfigChanged(wd0: WDType, pots0: number, wd1: WDType, pots1: number, pots: number, orders: VOOrder[]) {

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
    const market = this.config.market;
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
    this.log({action: 'STOP', reason: 'tick'});
  }

  /*saveSettings() {
    this.storage.upsert(this.id + '-settings', this.toJSON());
  }*/

  /* toJSON(): VOWatchdog {
     return {
       exchange: this.exchange,
       market: this.market,

       //pots: this.pots$.getValue(),
       stopLoss: this.stopLossController.toJSON()
     }
   }
 */
  async start() {
    //  if (this.interval) return;
    //  const sec = Math.round(60 + (Math.random() * 20));
    //  console.log(this.market + ' start refresh rate ' + sec);

    // this.interval = setInterval(() => this.tick(), sec * 1000);
  }


}
