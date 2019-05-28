import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Subject} from 'rxjs/internal/Subject';
import {VOBalance, VOBooks, VOOrder, WDType} from '../amodels/app-models';
import {Observable} from 'rxjs/internal/Observable';
import {debounceTime, filter, map} from 'rxjs/operators';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {StorageService} from '../a-core/services/app-storage.service';
import * as moment from 'moment';
import {VOCandle} from '../amodels/api-models';
import {CandlesUtils} from '../a-core/app-services/candles/candles-utils';
import {MATH} from '../acom/math';
import {MACD} from '../trader/libs/techind';
import {MacdSignal} from './macd-signal';


export const createMacd30min = function(closes5m: number[]) {
const closes = CandlesUtils.converCloses5mto30min(closes5m);
  const macd = new MACD(MacdSignal.macdInput(closes));
  return macd.getResult();
};

export const deltaMas = function(mas) {
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


export enum BotState {
  OFF = 'BOT_STATE_OFF',
  CANCELING_ORDERS = 'CANCELING_ORDERS',
  SELLING_COIN = 'SELLING_COIN',
  WAITING = 'WAITING'
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

  closes$: Observable<number[]>;
 //  candles$: Observable<VOCandle[]>;

  wdType$: BehaviorSubject<WDType> = new BehaviorSubject(null);
  state$: BehaviorSubject<string> = new BehaviorSubject(null);
  error$: Subject<string> = new Subject();

  priceInit$: BehaviorSubject<number> = new BehaviorSubject(0);


  pots$: BehaviorSubject<number> = new BehaviorSubject(-1);
  potsBalance$: Observable<number>;

  bookToBuy$: Observable<number>;
  bookToSell$: Observable<number>;

  books$: BehaviorSubject<VOBooks> = new BehaviorSubject(null);

  stopLossState$: Observable<StopLossState>;

  stopLossOrder$: Observable<VOOrder>;

  priceStop$: Observable<number>;


  balanceCoin$: BehaviorSubject<VOBalance> = new BehaviorSubject(null);

  ordersOpen$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);
  ordersHistory$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);

  progressOrders$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);

  constructor(public id: string, public candles$: Observable<VOCandle[]>, private storage: StorageService) {

    setInterval(() => this.saveLogs(), 1e4);

    this.mas$ = candles$.pipe(map(createMas));

    this.closes$ = candles$.pipe(map(CandlesUtils.closes))


    this.stopLossOrder$ = this.ordersOpen$.pipe(
      // filter(v => !!v),
      map(BotBus.filterStopLosses),
      map(orders => orders.length ? orders[0] : null)
    );

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
