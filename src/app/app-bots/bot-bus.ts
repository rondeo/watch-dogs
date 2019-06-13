import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Subject} from 'rxjs/internal/Subject';
import {VOBalance, VOBooks, VOOrder, VOWatchdog, WDType} from '../amodels/app-models';
import {Observable} from 'rxjs/internal/Observable';
import {debounceTime, filter, map, skip} from 'rxjs/operators';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {StorageService} from '../a-core/services/app-storage.service';
import * as moment from 'moment';
import {VOCandle} from '../amodels/api-models';
import {CandlesUtils} from '../a-core/app-services/candles/candles-utils';
import {MATH} from '../acom/math';
import {MACD} from '../trader/libs/techind';
import {MacdSignal} from './macd-signal';
import {Action} from '@ngrx/store';
import {balanceChangeFilter} from './bot-utils';
import {BTask} from './actions/bot-tasks'
import {Subscription} from 'rxjs/internal/Subscription';
import {selectBuyPrices, selectStopPrices} from './controllers/selectors';

export enum BotActions {
  BalanceChanged = 'BalanceChanged',
  BalanceInit = 'BalanceInit'
}

export class BalanceChanged implements Action {
  readonly type: BotActions.BalanceChanged;

  constructor(public payload: { balanceCoinOld: VOBalance, balanceCoin: VOBalance }) {
  }
}

export class BalanceInit implements Action {
  readonly type: BotActions.BalanceInit;

  constructor(public payload: VOBalance) {
  }
}

export type BalanceActions = BalanceChanged | BalanceInit;

export const deltaMas = function (mas) {
  const p = MATH.percent(mas.ma3, mas.ma25);
  return +p.toFixed(2);
}

const createMas = function (candles: VOCandle[]) {
  const last = candles[candles.length - 1];
  const closes = candles.map(function (item) {
    return item.close;
  });
  return CandlesUtils.mas(closes);
}

export enum StopLossState {
  OFF = 'STOP_LOSS_OFF',
  NEED = 'STOP_LOSS_NEED',
  SET = 'STOP_LOSS_SET',
  DUAL = 'STOP_LOSS_DUAL'
}


export class BotBus {
  static filterStopLosses(orders: VOOrder[]) {
    return orders.filter(function (item: VOOrder) {
      return item.stopPrice;
    });
  }

  static stopLossStatus([wdType, openOrders]) {
    switch (wdType) {
      case WDType.LONG:
        const stopLossesOrders = BotBus.filterStopLosses(openOrders);
        if (stopLossesOrders.length > 1) return StopLossState.DUAL;
        if (stopLossesOrders.length === 1) return StopLossState.SET;
        return StopLossState.NEED;
      default:
        return StopLossState.OFF
    }
  }

  private logs: string[] = [];
  mas$: Observable<{ last: number, ma3: number, ma7: number, ma25: number, ma99: number }>; // = new BehaviorSubject(null);

  id: string;

  closes$: Observable<number[]>;
  wdType$: Observable<WDType>;
  error$: Subject<string> = new Subject();

  priceInit$: BehaviorSubject<number> = new BehaviorSubject(0);

  config$: BehaviorSubject<VOWatchdog>;


  market: string;
  min: number;
  pots$: Observable<number>;
  potsBalance$: Observable<number>;
  potsDelta$: Observable<number>;
  bookToBuy$: Observable<number>;
  bookToSell$: Observable<number>;

  settings$: Observable<[WDType, number]>;
  books$: BehaviorSubject<VOBooks> = new BehaviorSubject(null);

  stopLossOrders$: Observable<VOOrder[]>;
  buyOrders$: Observable<VOOrder[]>;
  sellOrders$: Observable<VOOrder[]>;

  priceStop$: Observable<number>;
  entryPrices$: Observable<number[]>;

  balanceCoin$: BehaviorSubject<VOBalance> = new BehaviorSubject(null);
  balanceBase$: BehaviorSubject<VOBalance> = new BehaviorSubject(null);
  balanceChange$: Observable<VOBalance>;

  ordersOpen$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);
  ordersHistory$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);
 // stopLossSettings$: BehaviorSubject<StopLossSettings>;
  // progressOrders$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);


  constructor(private config: VOWatchdog, public candles$: Observable<VOCandle[]>, private storage: StorageService) {
    this.id = config.id;
    this.market = config.market;
    this.min = config.potSize / 10;
    this.config$ = new BehaviorSubject(config);
    this.wdType$ = this.config$.pipe(map(cfg => cfg.wdType));
    this.pots$ =  this.config$.pipe(map(cfg => cfg.pots));
    this.balanceChange$ = balanceChangeFilter(this.balanceCoin$);

    setInterval(() => this.saveLogs(), 1e4);

    this.mas$ = candles$.pipe(map(createMas));
    this.closes$ = candles$.pipe(map(CandlesUtils.closes));

    this.stopLossOrders$ = this.ordersOpen$.pipe(map(BotBus.filterStopLosses));

    this.buyOrders$ = this.ordersOpen$.pipe(map(orders => orders.filter(function (order: VOOrder) {
      return order.action === 'BUY';
    })));
    this.sellOrders$ = this.ordersOpen$.pipe(map(orders => orders.filter(function (order: VOOrder) {
      return order.action === 'SELL';
    })));

    this.potsBalance$ = this.balanceCoin$.pipe(
      filter(v => !!v),
      map(balance => +(balance.balance / config.potSize).toFixed(1)));

    this.potsDelta$ = combineLatest(this.pots$, this.potsBalance$).pipe(map(([pots, potsBalance]) => {
      return potsBalance / pots;
    }))

    /*this.stopLossState$ = combineLatest(this.wdType$, this.ordersOpen$)
      .pipe(debounceTime(1000), map(BotBus.stopLossStatus));

    this.stopLossState$.subscribe(res => {
      console.log(this.id, res);
    });*/
    //.pipe(map( wd => wd === WDType.LONG?StopLossState.ON: StopLossState.OFF));

    this.priceStop$ = this.ordersOpen$.pipe(map(selectStopPrices));
    this.entryPrices$ = this.ordersOpen$.pipe(map(selectBuyPrices));
  }

  setEntryPrice(price: number) {
    const cfg = this.config$.getValue();
    cfg.entryPrice = price;
    this.config$.next(cfg);
  }
  balanceTick(balance: VOBalance, balanceBase: VOBalance) {
    this.balanceCoin$.next(balance);
    this.balanceBase$.next(balanceBase);
  }

  setWDType(wdType: WDType) {
    this.config$.next(Object.assign(this.config$.getValue(), {wdType}));
  }

  async init() {
    this.ordersHistory$.next(await this.storage.select(this.id + '-orders-history'));
    this.balanceBase$.next(await this.storage.select(this.id + '-balanceBase'));
    this.balanceCoin$.next(await this.storage.select(this.id + '-balanceCoin'));
    this.ordersOpen$.next(await this.storage.select(this.id + '-orders-open'));
    // this.stopLossSettings$ = new BehaviorSubject(await this.storage.select(this.id + '-stop-loss-settings'));


    const config = await this.storage.select(this.id + '-config');
   //  config.id = config.exchange + '-' + config.market;

    if(config) this.config$.next(Object.assign(this.config, config));

    this.balanceChange$.subscribe(balance => this.storage.upsert(this.id + '-balanceCoin', balance));
    this.balanceBase$.subscribe(balance => this.storage.upsert(this.id + '-balanceBase', balance));
    this.ordersOpen$.subscribe(orders => this.storage.upsert(this.id + '-orders-open', orders));
    this.ordersHistory$.subscribe(orders => this.storage.upsert(this.id + '-orders-history', orders));
   // this.stopLossSettings$.subscribe(sett => this.storage.upsert(this.id + '-stop-loss-settings', sett));
    this.config$.pipe(skip(1)).subscribe(sett =>  this.storage.upsert(this.id + '-config', sett));
  }

  saveSettings(wdType: WDType, pots: number, entryPrice: number, liquidPrice: number) {
    const cfg = Object.assign(this.config$.getValue(), {wdType, pots, entryPrice, liquidPrice});
    this.config$.next(cfg);
  }

  async destroy() {
    await this.storage.remove(this.id + '-logs');
    await this.storage.remove(this.id + '-orders-history');
    await this.storage.remove(this.id + '-orders-open');
    await this.storage.remove(this.id + '-settings')
  }

 /* addProgressOrder(order: VOOrder) {
    let orders = this.progressOrders$.getValue();
    orders.push(order);
    this.progressOrders$.next(orders);
  }

  removeProgressOrderByID(uuids: string[]) {
    let orders = this.progressOrders$.getValue();
    const l = orders.length;
    if (!l) return;
    orders = orders.filter(function (item) {
      return uuids.indexOf(item.uuid) !== -1;
    });
    if (orders.length !== l) this.progressOrders$.next(orders);
  }*/

  log(message: string) {
    message = moment().format('DD HH:mm') + ' ' + message;
    this.logs.push(message);
  }

  async getLogs() {
    const newLogs = this.logs;
    const oldLogs = (await this.storage.select(this.id + '-logs')) || [];
    return oldLogs.concat(newLogs);
  }

  private saveLogs() {
    if (this.logs.length === 0) return;
    this.logs = [];
    this.getLogs().then(logs => {
      const l = logs.length;
      if (l > 200) logs = logs.slice(l - 200);
      this.storage.upsert(this.id + '-logs', logs)
    });
  }

  addOrder(order: VOOrder) {
    const orders = this.ordersOpen$.getValue();
    orders.push(order);
    this.ordersOpen$.next(orders);
  }

  replaceOrder(order: VOOrder, res: VOOrder) {
    let orders = this.ordersOpen$.getValue();
    orders = orders.filter(function (item) {
      item.uuid !== order.uuid
    });
    orders.push(res);
    this.ordersOpen$.next(orders);
  }

  removeOrder(order: VOOrder) {
    let orders = this.ordersOpen$.getValue();
    orders = orders.filter(function (item) {
      item.uuid !== order.uuid
    });
    this.ordersOpen$.next(orders);

  }
}
