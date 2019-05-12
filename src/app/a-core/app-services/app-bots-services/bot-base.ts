import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {StorageService} from '../../services/app-storage.service';
import {filter, skip} from 'rxjs/operators';
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
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {Observable} from 'rxjs/internal/Observable';


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

  wdType$:BehaviorSubject<WDType>;

  stopLossPercent$: BehaviorSubject<number> = new BehaviorSubject(2);
  priceInit$: BehaviorSubject<number> = new BehaviorSubject(0);
  priceStop$: BehaviorSubject<number> = new BehaviorSubject(0);
  pots$: BehaviorSubject<number> = new BehaviorSubject(0);

  bookBuy$: BehaviorSubject<number> = new BehaviorSubject(0);
  bookSell$: BehaviorSubject<number> = new BehaviorSubject(0);

  value$: BehaviorSubject<number> = new BehaviorSubject(0);
  books$: BehaviorSubject<VOBooks> = new BehaviorSubject(null);
  lastPrice$: BehaviorSubject<number> = new BehaviorSubject(0);

  // stopLoss$: BehaviorSubject<VOOrder> = new BehaviorSubject(null);

  ordersOpen$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);
  ordersHistory$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);

  protected _balanceCoin$: BehaviorSubject<VOBalance> = new BehaviorSubject(null);

  get balanceCoin$ (): Observable<VOBalance> {
    return this._balanceCoin$.pipe(filter(v => !!v));
  }
  
  protected _balanceBase$: BehaviorSubject<VOBalance> = new BehaviorSubject(null);
  get balanceBase$() :Observable<VOBalance> {
    return this._balanceBase$.pipe(filter(v => !!v));
  }

  get balanceCoin(): number {
    return this._balanceCoin$.getValue().balance
  }

  get amountCoin() {
    const bal = this._balanceCoin$.getValue();
    if(bal) return bal.balance;
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

  private marketPrecision;
  private interval;
  private sub1: Subscription;
  private sub2: Subscription;
  private candles: VOCandle[];
  stopLossController: StopLossOrder;

///////////////////////////////////////////////////////////////////////////
  constructor(
    public exchange: string,
    public market: string,
    private pots: number,
    public potSize: number,
    wdType: WDType,
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
    this.wdType$ = new BehaviorSubject(wdType);
    if(wdType !== WDType.OFF) this.subscribeForBalancesAndOrders();

    if (pots) this.pots$.next(pots);


    /*marketCap.ticker$().subscribe(MC => {
      this.mcBase = MC[this.base];
      this.mcCoin = MC[this.coin];
    });*/




    this.wdType$.subscribe(type => console.log(type));
    storage.select(this.id + '-orders-history')
      .then(orders => this.ordersHistory$.next(orders?orders.map(function (item) {
        return new MyOrder(item)
      }):[]));

    storage.select(this.id + '-orders-open')
      .then(orders => this.ordersOpen$.next(orders?orders.map(function (item) {
        return new MyOrder(item)
      }):[]));

    console.log('  bot created ' + this.id);

    this.ordersHistory$.subscribe(orders => {

      console.log(this.id + ' orders history ', orders);

      const stopLosses =  orders.filter(function (item) {
        return !!item.stopPrice;
      });

      if(stopLosses.length > 1) {

      }

      const buyOrder = this.buyOrder;
     /* if (buyOrder) {
        this.priceEntry$.next(buyOrder.rate);
      }
      */


    });

    const candles$ = candlesService.candles5m$(market);

    candles$.subscribe(candles => {
      //  console.log(market, candles);
      this.candles = candles;
      const last = candles[candles.length - 1];
      this.lastPrice$.next(last.close);
    });

    this.balanceCoin$.subscribe(balance => {
     // console.log(this.id, balance);
    });


    combineLatest(this.balanceCoin$, this.pots$).pipe(skip(1)).subscribe(([balance, pots]) => {
      //console.log(balance, pots);
      const diff = (this.potSize * pots) - balance.balance;
      console.log(this.id + ' pots diff ' + diff);
      if(Math.abs(diff) > this.potSize /2) {
        if(diff > 0 )  this.buyCoinInstant(diff);
        else this.sellCoinInstant(Math.abs(diff))
      }
    });

    this.stopLossController = new StopLossOrder(
      market,
      apiPrivate,
      this.ordersOpen$,
      candles$,
      this.balanceCoin$,
      wdType);
  }

  subscribeForBalancesAndOrders() {
    const base = this.base;
    const coin = this.coin;

    this.apiPrivate.openOrdersAll$.subscribe(orders => {
      const myOrders = orders.filter(function (item) {
        return item.base === base && item.coin === coin;
      });

      console.log(this.id + ' open orders   ', myOrders);
      this.ordersOpen$.next(myOrders);
    });

    this.apiPrivate.balances$().subscribe(balances => {

      const balanceBase = balances.find(function (item) {
        return item.symbol === base;
      });
      const balanceCoin = balances.find(function(item) {
        return item.symbol === coin;
      });

      this.setBalances(balanceBase, balanceCoin);
    });

    this.apiPrivate.ordersHistory$(this.market).subscribe(orders => {
      const buyOrders = orders.filter(function (item) {
        return item.orderType === OrderType.BUY;
      });

      const sellOrders = orders.filter(function (item) {
        return item.orderType === OrderType.SELL;
      });

      this.storage.upsert(this.id + '-orders-history', this.ordersHistory$.getValue());
      this.ordersHistory$.next(orders);
    });
    combineLatest(this.ordersHistory$, this.balanceCoin$).subscribe(([orders, balance]) => {
      const bal = balance.balance;

      if(orders.length) {

      }

    });

  }

  setBalances(balanceBase: VOBalance, balanceCoin: VOBalance) {
    console.log(this.id + ' balances  ', balanceBase,  balanceCoin);
    const bb = this._balanceBase$.getValue();
    if(!bb || bb.balance !== balanceBase.balance) this._balanceBase$.next(balanceBase);
    const bc = this._balanceCoin$.getValue();
    if(!bc || bc.balance !== balanceCoin.balance) this._balanceCoin$.next(balanceCoin);

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
    console.log('%c buyCoinInstant  ' + this.id + ' ' + qty, 'color:red');
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

      } catch (e) {
        this.log({action: 'ERROR', reason: 'buy coin ' + e.toString()});
      }
      return {uuid: 'test'};
    }

  adjustBalance() {

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

  async setBuyOrder(rate: number, amountCoin: number, stopLoss: number) {

  //  const amountCoin = pots * this.potSize;
    //  this.log({action: 'BUY_ORDER', reason: ' qty ' + amountCoin + ' rate ' + rate});

    return new Promise(async (resolve, reject) => {
      try {
        const order = await this.apiPrivate.buyLimit2(this.market, amountCoin, rate);
        console.log('BUY ORDER RESULT ', order);
        this.log({action: 'BUY_ORDER_RESULT', reason: order.amountCoin + '  ' + order.rate + ' ' + order.isOpen});

      } catch (e) {
        this.log({action: 'ERROR BUY_ORDER_RESULT', reason: e.toString()});
        reject();
      }
      setTimeout(() => resolve(), 2000);
    });
  }

  async setSellOrder(rate: number, pots: number, stopLoss: number) {
    const amountCoin = pots * this.potSize;
   /* this.log({action: 'SELL_ORDER', reason: 'qty ' + amountCoin + 'rate ' + rate + ' live:' + this.isLive});
    if (!this.isLive) return Promise.resolve();

    if (!amountCoin) {
      // Promise.resolve(' amount too low ' + this.balance.balanceUS);
      return;
    }*/

    //  const cancelResult: VOOrder[] = await this.orders.cancelSellOrders();
    /*   this.log({
         orderType: 'cancel orders res ', reason: cancelResult.map(function (item) {
           return item.orderType + ' ' + item.uuid;
         }).toString()
       });*/

    const order = await this.apiPrivate.sellLimit2(this.market, amountCoin, rate);
    this.log({action: 'SELL_LIMIT ', reason: 'rate ' + order.rate + ' qty ' + order.amountCoin + ' open ' + order.isOpen});


    return order;
  }


  async sellCoinInstant(qty = 0) {
    const amountCoin = qty? qty:this.amountCoin;
    let rate = this.bookSell$.getValue();
    if (!rate) {
      await this.downloadBooks().toPromise();
      await UTILS.wait(0.1);
      rate = this.bookSell$.getValue();
    }

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


  log(log: { action: string, reason: string }) {
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
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    this.stopLossController.destroy();
    this.deleteData();
  }

  async deleteData() {
    await this.storage.remove(this.id + '-logs');
    await this.storage.remove(this.id + '-orders-history');
    await this.storage.remove(this.id + '-orders-open');
  }

  async save() {
    this.storage.upsert(this.id + '-orders-history', this.ordersHistory$.getValue());
    this.storage.upsert(this.id + '-orders-open', this.ordersOpen$.getValue());
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
      wdType: this.wdType$.getValue(),
      pots: this.pots$.getValue(),
      stopLossPercent: this.stopLossPercent$.getValue()
    }
  }

  async start() {
    //  if (this.interval) return;
    //  const sec = Math.round(60 + (Math.random() * 20));
    //  console.log(this.market + ' start refresh rate ' + sec);

    // this.interval = setInterval(() => this.tick(), sec * 1000);
  }


}
