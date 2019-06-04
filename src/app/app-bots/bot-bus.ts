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
import {StopLossSettings} from './stop-loss-order';

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

export const createMacd30min = function (closes5m: number[]) {
  const closes = CandlesUtils.converCloses5mto30min(closes5m);
  const macd = new MACD(MacdSignal.macdInput(closes));
  return macd.getResult();
};

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

  /*action$: BehaviorSubject<Action> = new BehaviorSubject(null);

  action(action: BalanceActions) {
    switch (action.type) {
      case BotActions.BalanceChanged:
        action = action as BalanceChanged;
        this.balanceCoin$.next(action.payload.balanceCoin);
        break;
      case BotActions.BalanceInit:
        action = action as BalanceInit;
        this.balanceCoin$.next(action.payload);
        break
    }
  }*/

  private logs: string[] = [];
  mas$: Observable<{ last: number, ma3: number, ma7: number, ma25: number, ma99: number }>; // = new BehaviorSubject(null);

  id: string;
  closes$: Observable<number[]>;

  currentTask$: BehaviorSubject<BTask> = new BehaviorSubject(null);

  // tasksQ$: BehaviorSubject<BTask[]> = new BehaviorSubject([]);

  //  currentState$: BehaviorSubject<BotState> = new BehaviorSubject(BotState.OFF);
  //  candles$: Observable<VOCandle[]>;

  wdType$: BehaviorSubject<WDType> = new BehaviorSubject(null);
  error$: Subject<string> = new Subject();

  priceInit$: BehaviorSubject<number> = new BehaviorSubject(0);


  config$: BehaviorSubject<VOWatchdog>;

  pots$: BehaviorSubject<number> = new BehaviorSubject(-1);
  potsBalance$: Observable<number>;
  bookToBuy$: Observable<number>;
  bookToSell$: Observable<number>;

  settings$: Observable<[WDType, number]>;
  books$: BehaviorSubject<VOBooks> = new BehaviorSubject(null);

  stopLossState$: Observable<StopLossState>;

  stopLossOrder$: Observable<VOOrder>;

  priceStop$: Observable<number>;
  balanceCoin$: BehaviorSubject<VOBalance> = new BehaviorSubject(null);
  balanceBase$: BehaviorSubject<VOBalance> = new BehaviorSubject(null);
  balanceChange$: Observable<VOBalance>;

  ordersOpen$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);
  ordersHistory$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);
  stopLossSettings$: BehaviorSubject<StopLossSettings>;

  progressOrders$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);



  balanceTick(balance: VOBalance, balanceBase: VOBalance) {
    // console.log(balanceBase, balance);
    this.balanceCoin$.next(balance);
    this.balanceBase$.next(balanceBase);
  }

  setTask(task: BTask) {
    this.currentTask$.next(task);
  }

  constructor(private config: VOWatchdog, public candles$: Observable<VOCandle[]>, private storage: StorageService) {
    this.id = config.id;
    this.config$ = new BehaviorSubject(config);
    this.balanceChange$ = balanceChangeFilter(this.balanceCoin$);

    setInterval(() => this.saveLogs(), 1e4);

    this.mas$ = candles$.pipe(map(createMas));
    this.closes$ = candles$.pipe(map(CandlesUtils.closes));
    this.stopLossOrder$ = this.ordersOpen$.pipe(
      map(BotBus.filterStopLosses),
      map(orders => orders.length ? orders[0] : null)
    );

    this.potsBalance$ = this.balanceCoin$.pipe(
      filter(v => !!v),
      map(balance => +(balance.balance / config.potSize).toFixed(1)));

    this.stopLossState$ = combineLatest(this.wdType$, this.ordersOpen$)
      .pipe(debounceTime(1000), map(BotBus.stopLossStatus));

    this.stopLossState$.subscribe(res => {
      console.log(this.id, res);
    });
    //.pipe(map( wd => wd === WDType.LONG?StopLossState.ON: StopLossState.OFF));

    this.priceStop$ = this.ordersOpen$.pipe(map(orders => {
      if (!orders) return 0;
      const stopLosses = orders.filter(function (item) {
        return item.stopPrice
      });
      return stopLosses.length ? stopLosses[0].stopPrice : 0;
    }))
  }

  async init() {
    this.ordersHistory$.next(await this.storage.select(this.id + '-orders-history'));
    this.balanceBase$.next(await this.storage.select(this.id + '-balanceBase'));
    this.balanceCoin$.next(await this.storage.select(this.id + '-balanceCoin'));
    this.ordersOpen$.next(await this.storage.select(this.id + '-orders-open'));
    this.stopLossSettings$ = new BehaviorSubject(await this.storage.select(this.id + '-stop-loss-settings'));


    const config = await this.storage.select(this.id + '-config');
    if(config) this.config$.next(Object.assign(this.config, config));
    const settings = (await this.storage.select(this.id + '-settings')) || {};


    this.wdType$.next(settings.wdType || WDType.OFF);
    this.pots$.next(settings.pots || 0);
    this.balanceChange$.subscribe(balance => this.storage.upsert(this.id + '-balanceCoin', balance));
    this.balanceBase$.subscribe(balance => this.storage.upsert(this.id + '-balanceBase', balance));
    this.ordersOpen$.subscribe(orders => this.storage.upsert(this.id + '-orders-open', orders));
    this.ordersHistory$.subscribe(orders => this.storage.upsert(this.id + '-orders-history', orders));
    this.stopLossSettings$.subscribe(sett => this.storage.upsert(this.id + '-stop-loss-settings', sett));
    this.config$.pipe(skip(1)).subscribe(sett => this.storage.upsert(this.id + '-config', sett));

    this.settings$ = combineLatest(this.wdType$, this.pots$).pipe(
      debounceTime(100)
    );
    this.settings$.pipe(skip(1)).subscribe(([wd, pots]) => {
      this.storage.select(this.id + '-settings').then(sett => {
        sett.wdType = wd;
        sett.pots = pots;
        this.storage.upsert(this.id + '-settings', sett);
      });
      console.warn(wd, pots)
    })

  }

  saveSettings(wd: WDType, pots: number) {
    this.storage.select(this.id + '-settings').then(sett => {
      sett.wdType = wd;
      sett.pots = pots;
      this.storage.upsert(this.id + '-settings', sett);
    });

  }

  async destroy() {
    await this.storage.remove(this.id + '-logs');
    await this.storage.remove(this.id + '-orders-history');
    await this.storage.remove(this.id + '-orders-open');
    await this.storage.remove(this.id + '-settings')
  }

  addProgressOrder(order: VOOrder) {
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
  }

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
}
