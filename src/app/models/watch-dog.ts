import {VOMarketCap, VOWATCHDOG, VOWatchdog} from './app-models';
import {VOMCAgregated} from './api-models';
import {MovingAverage, VOMovingAvg} from '../com/moving-average';
import {ɵAnimationStyleNormalizer} from '@angular/animations/browser';
import * as moment from 'moment';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {b} from '@angular/core/src/render3';

export interface RunResults {
  actiin: string;
  isTrigger: boolean;
  reason: string;
  date: string;
}

export enum WatchDogStatus {
  WAITING = 'WAITING',
  TO_SELL = 'TO_SELL',
  SELLING_START = ' SELLING_START',
  SELLING_GOT_ORDER = 'SELLING_GOT_ORDER',
  SELLING_ORDER_CLOSED = 'SELLING_ORDER_CLOSED',
  SOLD_OUT = 'SOLD_OUT',
  SOLD = 'SOLD'
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
  history: string[];
  balanceBase: number;
  balanceCoin: number;

  isToSell: boolean;

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
    this.message = 'initialized';
  }

  setDataMC(curr: VOMCAgregated, base: VOMCAgregated) {
    this.coinMC = curr;
    this.baseMC = base;
    this.baseUS = +(this.baseMC.price_usd * this.balanceBase).toFixed(2);
    this.coinUS = +(this.coinMC.price_usd * this.balanceCoin).toFixed(2);

  }

  runIsToSell(curr: VOMCAgregated, base: VOMCAgregated): boolean {
    const prev = this.coinMC;
    this.coinMC = curr;
    this.baseMC = base;
    this.baseUS = +(this.baseMC.price_usd * this.balanceBase).toFixed(2);
    this.coinUS = +(this.coinMC.price_usd * this.balanceCoin).toFixed(2);

    const date = moment().format('HH:mm');
    if (!prev) return false;

    console.log(prev.price_btc, curr.price_btc,  prev.last20, curr.last20);

    const percentChange2h = 100 * ((curr.last20 - prev.last20) / prev.last20);

    this.isToSell = percentChange2h < -0.11;

    console.log(
      moment(prev.timestamp).format('HH:mm') + ' - '
      + moment(curr.timestamp).format('HH:mm') + '  '
      + ' = ' + moment(curr.timestamp).diff(prev.timestamp, 'minutes')
    );
    console.log(date, this.exchange, this.base, this.coin, percentChange2h, this.isToSell);

    return this.isToSell;
  }

  static isMovingDown2(prev: VOMovingAvg, curr: VOMovingAvg): boolean {
    ;
    return (
      (100 * ((curr.price2h - prev.price2h) / prev.price2h) < -0.11)

    );
  }

  setWaitingMessage(message: string) {
    this.status = WatchDogStatus.WAITING;
    this.setMessage(message)
  }

  private setMessage(message: string) {
    this.message = message;
    if (!this.history) this.history = [];
    this.history.push(message);
    if (this.history.length > 100) this.history.shift();
    this.setCurrentDate();
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
