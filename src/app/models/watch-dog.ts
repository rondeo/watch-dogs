import {VOMarketCap, VOWATCHDOG, VOWatchdog} from './app-models';
import {VOMCAgregated} from './api-models';
import {MovingAverage} from '../com/moving-average';
import {ɵAnimationStyleNormalizer} from '@angular/animations/browser';
import * as moment from 'moment';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';

export interface RunResults {
  actiin: string;
  isTrigger: boolean;
  reason: string;
  date: string;
}

export enum WatchDogStatus{
  WAITING='WAITING',
  SELLING ='SELLING',
  SELLING_START = ' SELLING_START',
  SELLING_GOT_ORDER = 'SELLING_GOT_ORDER',
  SELLING_ORDER_CLOSED = 'SELLING_ORDER_CLOSED',
  SOLD_OUT='SOLD_OUT',
  SOLD = 'SOLD'
}
export class WatchDog extends VOWatchdog {

  static _statusChangedSub: Subject<WatchDog> = new Subject<WatchDog>();
  static statusChanges$():Observable<WatchDog>{
    return WatchDog._statusChangedSub.asObservable();
  }
  date: string;
  baseUS: number;
  coinUS: number;
  coinMC: VOMCAgregated;
  baseMC: VOMCAgregated;
  private _status:WatchDogStatus;
  message: string;
  history: string[];
  balanceBase: number;
  balanceCoin: number
  static isTest: boolean;

  get status(): WatchDogStatus{
    return this._status;
  }
  set status(val: WatchDogStatus){
    if(this.status === val) return
    this._status = val;
    WatchDog._statusChangedSub.next(this);
  }
  constructor(public wd: VOWatchdog) {
    super(wd);
    this._status = WatchDogStatus.WAITING;
    this.message = 'initialized';
  }

  addMCValues(MC: { [symbol: string]: VOMCAgregated }) {
    this.baseMC = MC[this.base];
    this.coinMC = MC[this.coin];
    this.baseUS = +(this.baseMC.price_usd * this.balanceBase).toFixed(2);
    this.coinUS = +(this.coinMC.price_usd * this.balanceCoin).toFixed(2);
  }

  sellCoin(reason:string){
    this.status = WatchDogStatus.SELLING;
    this.setMessage(reason);
  }

  setWaitingMessage(message: string){
    this.status = WatchDogStatus.WAITING;
    this.setMessage(message)
  }
   private setMessage(message: string) {
    this.message = message;
    if(!this.history) this.history = [];
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
      isEmail: this.isEmail,
      results: this.results,
      sellScripts: this.sellScripts,
      buyScripts: this.buyScripts,
      amount: this.amount
    }

  }

}
