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
  SELLING_START = ' SELLING_START',
  SELLING_GOT_ORDER = 'SELLING_GOT_ORDER',
  SELLING_ORDER_CLOSED = 'SELLING_ORDER_CLOSED',
  SOLD_OUT = 'SOLD_OUT',
  SOLD = 'SOLD',
  NO_BALANCE = 'NO_BALANCE',
  NO_BALANCE_BASE = 'NO_BALANCE_BASE'
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
  wdId: string;

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
    this.wdId = this.exchange + ' '+ this.base + ' ' + this.coin;
    this.subscribeForBalances();
  }

  subscribeForBalances() {
    ApiMarketCapService.instance.getData().then(MC => {
      this.coinMC = MC[this.coin];
      this.baseMC = MC[this.base];
      const api: ApiPrivateAbstaract = ApisPrivateService.instance.getExchangeApi(this.exchange);
      this.message = 'initialized';
      api.balance$(this.coin).subscribe(balance => {
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

      api.balance$(this.base).subscribe(balance => {
        console.log(this.wdId, balance);
        if (balance) {
          this.balanceBase = balance.balance;
          this.baseUS = Math.round(this.balanceBase * this.baseMC.price_usd);
          if (!this.coinUS) this.status = WatchDogStatus.NO_BALANCE_BASE;
        } else {
          this.status = WatchDogStatus.NO_BALANCE_BASE;
          console.warn(' no balance for ' + this.base);
        }
      })
    })

  }


  setDataMC(curr: VOMCAgregated, base: VOMCAgregated) {
    this.coinMC = curr;
    this.baseMC = base;
  }

  runIsToSell(curr: VOMCAgregated, base: VOMCAgregated): boolean {
    const prev = this.coinMC;
    this.coinMC = curr;
    this.baseMC = base;

    ApisPrivateService.instance.getExchangeApi(this.exchange).tickRefreshBalance();

    const date = moment().format('HH:mm');
    if (!prev) return false;

    console.log(prev.price_btc, curr.price_btc, prev.last20, curr.last20);

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
