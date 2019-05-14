import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {StorageService} from '../../services/app-storage.service';
import {filter, map, skip} from 'rxjs/operators';
import * as moment from 'moment';
import {OrderType, VOBalance, VOBooks, VOOrder, VOWatchdog, WDType} from '../../../amodels/app-models';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {CandlesService} from '../candles/candles.service';
import * as _ from 'lodash';
import {UtilsBooks} from '../../../acom/utils-books';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {Subscription} from 'rxjs/internal/Subscription';
import {UTILS} from '../../../acom/utils';
import {VOCandle} from '../../../amodels/api-models';
import {StopLossOrder} from './stop-loss-order';
import {Observable} from 'rxjs/internal/Observable';
import {Subject} from 'rxjs/internal/Subject';
import {CandlesUtils} from '../candles/candles-utils';
import {MATH} from '../../../acom/math';


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
  // state$: BehaviorSubject<BotState>;
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

  mas$: Subject<{ ma3: number, ma7: number, ma25: number, ma99: number }> = new Subject();
  ma$: Subject<number> = new Subject();
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
  lastPrice$: BehaviorSubject<number> = new BehaviorSubject(0);

  // stopLoss$: BehaviorSubject<VOOrder> = new BehaviorSubject(null);

  ordersOpen$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);
  ordersHistory$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);

  protected _balanceCoin$: BehaviorSubject<VOBalance> = new BehaviorSubject(null);

  get balanceCoin$(): Observable<VOBalance> {
    return this._balanceCoin$.pipe(skip(1));
  }

  protected _balanceBase$: BehaviorSubject<VOBalance> = new BehaviorSubject(null);
  get balanceBase$(): Observable<VOBalance> {
    return this._balanceBase$.pipe(filter(v => !!v));
  }

  get balanceCoin(): number {
    return this._balanceCoin$.getValue().balance
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
    if(t !== type) {
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
  private candles: VOCandle[];

  stopLossController: StopLossOrder;

///////////////////////////////////////////////////////////////////////////
  constructor(
    public exchange: string,
    public market: string,
    public potSize: number,
    public apiPrivate: ApiPrivateAbstaract,
    public apiPublic: ApiPublicAbstract,
    public candlesService: CandlesService,
    public storage: StorageService
    // public marketCap: ApiMarketCapService
  ) {

    this.id = exchange + '-' + market;
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

    this.wdType$ = new BehaviorSubject(null);

    this.wdType$.pipe(filter(v => !!v)).subscribe(type => {
      console.log(this.id + ' ' + type);
      if (type !== WDType.OFF) this.subscribeForBalancesAndOrders();
      else this.unsubscribe();

      if(type === WDType.SHORT) {
        this.cancelAllOpenOrders();
      } else if(type === WDType.LONG) {
        this.cancelAllOpenOrders();
        UTILS.wait(5).then(() =>{
          const pots = this.pots$.getValue();
          this.adjustBalanceToPots(pots);
        })
      }

    });



    /*marketCap.ticker$().subscribe(MC => {
      this.mcBase = MC[this.base];
      this.mcCoin = MC[this.coin];
    });*/


    this.wdType$.subscribe(type => console.log(type));
    storage.select(this.id + '-orders-history')
      .then(orders => {
        this.ordersHistory$.next(orders ? orders.map(function (item) {
          return new MyOrder(item)
        }) : []);
      });

    storage.select(this.id + '-orders-open')
      .then(orders => {
        this.ordersOpen$.next(orders ? orders.map(function (item) {
          return new MyOrder(item)
        }) : []);

        storage.select(this.id + '-balanceCoin').then(b => {
          console.log(this.id + ' saved balance ', b);
          this._balanceCoin$.next(b)
        });
      });

    console.log('  bot created ' + this.id);

    this.ordersHistory$.subscribe(orders => {

    });

    const candles$ = candlesService.candles5m$(market);

    candles$.subscribe(candles => {
      //  console.log(market, candles);
      this.candles = candles;
      const last = candles[candles.length - 1];
      const closes = candles.map(function (item) {
        return item.close;
      });
      const mas = CandlesUtils.mas(closes);
      this.mas$.next(mas);
      const p =  MATH.percent(mas.ma3, mas.ma25)
      this.ma$.next(+p.toFixed(2));
      this.lastPrice$.next(+mas.ma3.toPrecision(6));
    });

    this.balanceCoin$.subscribe(balance => {
      const potsBalance = balance ? +(balance.balance / this.potSize).toFixed(1) : 0;
      this.potsBalance$.next(potsBalance);

      if (this.wdType$.getValue() === WDType.SHORT && balance.available > (this.potSize * 0.3)) {
        this.sellCoinInstant(balance.balance);
      }

    });

    this.stopLossController = new StopLossOrder(
      market,
      apiPrivate,
      potSize,
      this.ordersOpen$,
      this.balanceCoin$,
      candles$,
      this.mas$,
      this.wdType$,
      this.storage
    );

    this.priceStop$ = this.stopLossController.stopLossOrder$.pipe(map((order) => {
      return order ? order.stopPrice : 0;
    }))
  }

  async cancelAllOpenOrders() {
    console.log(this.id + ' canceling all open orders')
    const openOrders = this.ordersOpen$.getValue();
   const results = await this.cancelOrders(openOrders.map(function (item) {
      return item.uuid;
    }));
    console.log(this.id + ' CANCEL ORDERS RESULTS ', results);
    await UTILS.wait(5);
    this.apiPrivate.refreshBalances();
    return results;


  }
  cancelOrders(uids: string[]) {
    return Promise.all(uids.map(async (uid) =>{
      await UTILS.wait(2);
      const res = await this.apiPrivate.cancelOrder2(uid, this.market).toPromise();
      await UTILS.wait(2);
      return  res;
    }))

  }
  refreshOpenOrders() {
    this.apiPrivate.refreshOpenOrdersNow();
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
    const base = this.base;
    const coin = this.coin;

    this.sub1 = this.apiPrivate.openOrdersAll$.subscribe(orders => {
      const myOrders = orders.filter(function (item) {
        return item.base === base && item.coin === coin;
      });


      console.log(this.id + ' MY open orders   ', myOrders);
      this.ordersOpen$.next(myOrders);
      this.storage.upsert(this.id + '-orders-open', myOrders);
    });

    this.sub2 = this.apiPrivate.balances$().subscribe(balances => {
      const balanceBase = balances.find(function (item) {
        return item.symbol === base;
      });
      const balanceCoin = balances.find(function (item) {
        return item.symbol === coin;
      });

      const min = this.potSize / 10;
      if (balanceCoin.available < min) balanceCoin.available = 0;
      if (balanceCoin.balance < min) balanceCoin.balance = 0;

      console.log(balanceCoin);
      this.setBalances(balanceBase, balanceCoin);
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

    });
    this.followPots();
  }


  followPots() {
    this.sub4 = this.pots$.pipe(skip(2)).subscribe(pots => {
      console.log(pots);
      const wdType = this.wdType$.getValue();
      if (wdType !== WDType.LONG) return;
      this.adjustBalanceToPots(pots);
    });
  }

  private adjustBalanceToPots(pots){

    const postsBalance = this.potsBalance$.getValue();
    const diff = pots - postsBalance;
    console.log('%c ' + this.id + ' pots diff ' + diff, 'color:green');

    if (Math.abs(diff) > 0.3) {
      const amountCoin = Math.abs(diff) * this.potSize;
      if (diff > 0) this.buyCoinInstant(amountCoin).then(res => {
        console.log(this.id + '  followPots BUY ', res)
      }).catch(console.error);
      else this.sellCoinInstant(amountCoin).then(res => {
        console.log(this.id + '  followPots SELL ', res)
      }).catch(console.error);
    }

  }


  setBalances(balanceBase: VOBalance, balanceCoin: VOBalance) {
    this._balanceBase$.next(balanceBase);
    const oldBalanceCoin: VOBalance = this._balanceCoin$.getValue();
    if (!oldBalanceCoin || oldBalanceCoin.available !== balanceCoin.available || oldBalanceCoin.pending !== balanceCoin.pending) {
      console.log('%c ' + this.id + ' balance changed  ', 'color: red');
      console.log(oldBalanceCoin, balanceCoin);
      this.apiPrivate.refreshOpenOrdersNow().then(openOrders => {
        //  this.apiPrivate.downloadOrdersHistory(this.market, moment().valueOf(), moment().subtract(1, 'day').valueOf())
        //   .subscribe(ordersHistory => {
        //  this.ordersHistory$.next(ordersHistory);
        //  console.log(this.id + ' open orders ', openOrders);
        // this.ordersOpen$.next(openOrders);

        this.storage.upsert(this.id + '-balanceCoin', balanceCoin);
        console.log(this.id + ' new balance  ', balanceCoin);
        this._balanceCoin$.next(balanceCoin);
        // })
      })
    } else this._balanceCoin$.next(balanceCoin);
  }

  calculateBalanceByOrders() {

  }

  buyNow() {


  }

  maintainStopLoss() {

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
    if (!qty) {
      console.warn(' no QTY');
      this.log({action: 'STOP BUY', reason: ' no QTY'});
      return Promise.resolve(null);
    }

    const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
    const rate = UtilsBooks.getRateForAmountCoin(books.sell, qty);
    const res = await this.setBuyOrder(rate, qty);
    await UTILS.wait(2);
    this.apiPrivate.refreshBalances();
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
    const baseAvailable = balanceBase.available;
    let need = (amountCoin * rate);
    need = need + (need * 0.003);
    need = +need.toPrecision(4);
    console.log('%c BUY_ORDER  ' + this.id + ' qty ' + amountCoin + ' need ' + need + ' available ' + baseAvailable, 'color:red');
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
    const balance: VOBalance = this._balanceCoin$.getValue()

    if (!balance) {
      console.error(' no balance ')
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
        }));
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
    this.apiPrivate.refreshBalances();
    return res;
  }


  async

  botInit() {
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

  /*  get state() {
      return this.state$.getValue();
    }

    set state(state: BotState) {
      this.state$.next(state);
      this.storage.upsert('state-' + this.exchange + this.market, state);
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

  toJSON()
    :
    VOWatchdog {
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
