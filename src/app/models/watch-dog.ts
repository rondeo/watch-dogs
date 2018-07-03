import {VOBalance, VOMarketCap, VOWATCHDOG, VOWatchdog} from './app-models';
import {VOMCAgregated} from './api-models';
import {MovingAverage, VOMovingAvg} from '../com/moving-average';
import {ɵAnimationStyleNormalizer} from '@angular/animations/browser';
import * as moment from 'moment';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {b} from '@angular/core/src/render3';
import {ApiPublicAbstract} from '../apis/api-public/api-public-abstract';
import {ApisPublicService} from '../apis/apis-public.service';
import {ApiPrivateAbstaract} from '../apis/api-private/api-private-abstaract';
import {ApisPrivateService} from '../apis/apis-private.service';
import {ApiMarketCapService} from '../apis/api-market-cap.service';
import {StorageService} from '../services/app-storage.service';
import {SellCoinFilling} from '../app-services/app-bots-services/sell-coin-filling';
import {Subscription} from 'rxjs/Subscription';

export interface RunResults {
  actiin: string;
  isTrigger: boolean;
  reason: string;
  date: string;
}

export enum WatchDogStatus {
  INITIALIZED = 'INITIALIZED',
  WAITING = 'WAITING',
  TO_SELL = 'TO_SELL',

  SELLING_IN_PROGRESS = 'SELLING_IN_PROGRESS',
  SELLING_GOT_ORDER = 'SELLING_GOT_ORDER',
  SELLING_ORDER_CLOSED = 'SELLING_ORDER_CLOSED',

  ERROR_SELLING = 'ERROR_SELLING',

  SOLD_OUT = 'SOLD_OUT',
  SOLD = 'SOLD',

  NO_BALANCE = 'NO_BALANCE',
  NO_BALANCE_BASE = 'NO_BALANCE_BASE',

  CHECKING_ORDER = 'CHECKING_ORDER'
}

export class WatchDog extends VOWatchdog {

  static _statusChangedSub: Subject<WatchDog> = new Subject<WatchDog>();

  static statusChanges$(): Observable<WatchDog> {
    return WatchDog._statusChangedSub.asObservable();
  }

  date: string;
  baseUS: number;
  coinUS: number;
  coinMC: VOMCAgregated;
  baseMC: VOMCAgregated;
  message: string;
  history: any[];
  balanceBase: number;
  balanceCoin: number;
  wdId: string;
  sellCoinFill: SellCoinFilling;
  sub1
  sub2
  sub3: Subscription;
  //  isToSell: boolean;

  static isTest: boolean;

  get status(): WatchDogStatus {
    return this._status;
  }

  set status(val: WatchDogStatus) {
    if (this.status === val) return
    this._status = val;
    WatchDog._statusChangedSub.next(this);
  }

  constructor(public wd: VOWatchdog) {
    super(wd);
    this.wdId = this.exchange + '-' + this.base + '-' + this.coin;
    this.subscribeForBalances();
  }

  subscribeForBalances() {
    if (!this.exchange || !this.base || !this.coin) return;
    ApiMarketCapService.instance.getData().then(MC => {
      this.coinMC = MC[this.coin];
      this.baseMC = MC[this.base];
      const api: ApiPrivateAbstaract = ApisPrivateService.instance.getExchangeApi(this.exchange);
      this.message = 'initialized';
      this.sub1 = api.balance$(this.coin).subscribe(balance => {
        console.log(this.wdId, balance);
        if (balance) {
          this.balanceCoin = balance.balance;
          this.coinUS = Math.round(this.balanceCoin * this.coinMC.price_usd);
          if (!this.coinUS) this.status = WatchDogStatus.SOLD;
        } else {
          this.balanceCoin = 0;
          this.coinUS = 0;
          this.status = WatchDogStatus.NO_BALANCE;
        }

      });

      this.sub2 = api.balance$(this.base).subscribe(balance => {
        //  console.log(this.wdId, balance);
        if (balance) {
          this.balanceBase = balance.balance;
          this.baseUS = Math.round(this.balanceBase * this.baseMC.price_usd);
          //  if (!this.baseUS) this.status = WatchDogStatus.NO_BALANCE_BASE;
        } else {
          // this.status = WatchDogStatus.NO_BALANCE_BASE;
          console.warn(' no balance for ' + this.base);
        }
      })
    })

  }


  setDataMC(curr: VOMCAgregated, base: VOMCAgregated) {
    this.coinMC = curr;
    this.baseMC = base;
  }

  async getHistory(): Promise<any[]> {
    if (this.history) return Promise.resolve(this.history);
    return StorageService.instance.select(this.wdId + '-history').then(res => {
      if (!res || !Array.isArray(res)) res = [];
      this.history = res
      return this.history;
    });
  }

  async saveHistory(): Promise<any> {
    return StorageService.instance.upsert(this.wdId + '-history', this.history);
  }

  async onError(msg: string) {
    const errors = await StorageService.instance.select(this.wdId + '-errors') || [];
    errors.push({
      timestamp: moment().format(),
      message: msg,
    })
    return await StorageService.instance.upsert(this.wdId + '-errors', errors);
  }

  async addHistory(msg: string) {
    console.log(this.wdId + ' ' + msg + '  ' + this.status);
    const h = await this.getHistory();
    h.push({
      time: moment().format('HH:mm'),
      timestamp: moment().format(),
      message: msg,
      status: this.status
    })
  }

  createSellCoin() {
    this.sellCoinFill = new SellCoinFilling(this);
    this.sub3 = this.sellCoinFill.statusChanged$().subscribe(status => {
      this.status = status.status;
      this.addHistory(status.message);
      switch (status.status) {
        case WatchDogStatus.SELLING_ORDER_CLOSED:
          ApisPrivateService.instance.getExchangeApi(this.exchange).refreshBalances();
          this.sellCoinFill.dectroy();
          this.sub3.unsubscribe();
          this.sellCoinFill = null;
          break;
        case WatchDogStatus.ERROR_SELLING:
          this.onError(status.message);
          break;
      }
    })
  }

  async runSellingStart(curr: VOMCAgregated, base: VOMCAgregated) {
    console.log(this.wdId + ' runSellingStart');
    const history = await this.getHistory();
    if (!this.sellCoinFill) {
      this.createSellCoin();
      this.sellCoinFill.sell();
    } else this.onError('selling excists ')

  }

  async runWaiting(curr: VOMCAgregated, base: VOMCAgregated) {
    const date = moment().format('HH:mm');
    const history = await this.getHistory();
    const status = this.status;
    const prev = this.coinMC;
    if (prev.timestamp === curr.timestamp) {
      console.log(this.wdId + ' sane timestamp ');
      return;
    }

    this.coinMC = curr;
    this.baseMC = base;
    if (!prev) return this.status;

    const values: number[] = [prev.price_btc, curr.price_btc, prev.last20, curr.last20, -0.11];

    const percentChange2h = 100 * ((curr.last20 - prev.last20) / prev.last20);

    values.push(percentChange2h);
    const isToSell = percentChange2h < -0.11;
    if (isToSell) this.status = WatchDogStatus.TO_SELL;
    const coinData = [
      moment(prev.timestamp).format('HH:mm'),
      moment(curr.timestamp).format('HH:mm'),
      moment(curr.timestamp).diff(prev.timestamp, 'minutes')
    ]
    const data = {
      date,
      values,
      isToSell,
      coinData,
      status
    };
    this.history.push(data);
    return this.saveHistory();
  }

  async run(curr: VOMCAgregated, base: VOMCAgregated): Promise<string> {
    ApisPrivateService.instance.getExchangeApi(this.exchange).tickRefreshBalance();
    const status = this.status;
    const date = moment().format('HH:mm');
    console.log(date, this.wdId, this.status);
    switch (this.status) {
      case WatchDogStatus.WAITING:
        await this.runWaiting(curr, base);
        break;
      case WatchDogStatus.TO_SELL:
        await this.runSellingStart(curr, base);
        break;
    }
    return this.wdId + ' ' + this.status;
  }

  static isMovingDown2(prev: VOMovingAvg, curr: VOMovingAvg): boolean {
    ;
    return (
      (100 * ((curr.price2h - prev.price2h) / prev.price2h) < -0.11)

    );
  }

  private setMessage(message: string) {
    this.message = message;
    if (!this.history) this.history = [];
    this.history.push(message);
    if (this.history.length > 100) this.history.shift();
    this.setCurrentDate();
  }

  destroy() {
    if (this.sellCoinFill) this.sellCoinFill.dectroy();
    if (this.sub1) this.sub1.unsubscribe();
    this.sub1 = null;
    if (this.sub2) this.sub2.unsubscribe();
    this.sub2 = null;
    if (this.sub3) this.sub3.unsubscribe();
    this.sub3 = null;
    this.sellCoinFill = null;
    this.baseMC = null;
    this.coinMC = null;
    this.history = null;
    StorageService.instance.remove(this.wdId + '-errors');
    StorageService.instance.remove(this.wdId + '-history');

  }

  private setCurrentDate() {
    this.date = moment().format('MM-DD, h:mm');
  }


  toJSON(): VOWatchdog {
    return {
      id: this.id,
      orderID: this.orderID,
      exchange: this.exchange,
      base: this.base,
      coin: this.coin,
      orderType: this.orderType,
      name: this.name,
      isActive: this.isActive,
      results: this.results,
      sellScripts: this.sellScripts,
      buyScripts: this.buyScripts,
      amount: this.amount,
      _status: this._status
    }

  }

}
