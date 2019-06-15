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
import {ShortController} from './controllers/short.controller';
import {LongController} from './controllers/long.controller';
import {BuySellCommands} from './controllers/buy-sell.commands';


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

  commands: BuySellCommands;
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
  shortController: ShortController;
  longController: LongController;
  subAll;

  async init() {


    this.commands = new BuySellCommands(this.bus, this.apiPrivate, this.apiPublic);

    this.bus.balanceChange$.subscribe(async () => {

    });

    this.apiPrivate.balances$().pipe(skip(1)).subscribe(async balances => {
      this.allBalances = balances;
      this.bus.balanceTick(optimizeBalance(this.config.potSize, balances[this.coin]), balances[this.base]);
      console.log(balances[this.coin], this.bus.ordersOpen$.getValue());

      if(this.bus.isDirty){
        await UTILS.wait(5);
        await this.apiPrivate.refreshAllOpenOrders();
        this.bus.isDirty = false;
      } else {
        if(this.bus.balanceCoin.pending && this.bus.openOrders.length === 0) {
          console.log('%c DATA NOT VALID ', 'color:red');
          await this.apiPrivate.refreshAllOpenOrders();
          this.bus.isDirty = false;
        }
      }

    });

    const coin = this.coin;
    this.apiPrivate.openOrders$.pipe(map(orders => orders.filter(function (order) {
      return order.coin === coin;
    }))).subscribe(orders => this.bus.ordersOpen$.next(orders));


    //////////////////////////////////////////////////////////////////////////////////
    let sub: Subscription;
    this.bus.wdType$.subscribe(wdType => {
      console.log(this.id + '  ' + wdType);
      this.unsubscribeAr();

      if (wdType === WDType.LONG) {
        if (this.buySignal) this.buySignal.destroy();
        if(this.shortController) this.shortController.destroy();
        if(this.longController) this.longController.destroy('re-init');
        this.longController = new LongController(this.bus, this.commands);

        this.buySignal = null;
      } else if (wdType === WDType.SHORT) {
        if (this.stopLossAuto) this.stopLossAuto.destroy();
        this.stopLossAuto = null;
      }
    })


  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////

  buySignal: BuySignal;

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
