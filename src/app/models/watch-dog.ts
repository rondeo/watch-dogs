import {VOMarketCap, VOWATCHDOG, VOWatchdog} from './app-models';
import {VOMCAgregated} from './api-models';
import {MovingAverage} from '../com/moving-average';
import {ɵAnimationStyleNormalizer} from '@angular/animations/browser';
import * as moment from 'moment';

export interface RunResults {
  actiin: string;
  isTrigger: boolean;
  reason: string;
  date: string;
}

export enum BotStatus{
  WAITING='WAITING',
  SELLING ='SELLING'
}
export class WatchDog extends VOWatchdog {
  date: string;
  baseUS: number;
  coinUS: number;
  mcCoin: VOMCAgregated;
  mcBase: VOMCAgregated;
  status:BotStatus;
  message: string;
  history: string[];
  balanceBase: number;
  balanceCoin: number
  static isTest: boolean;

  constructor(public wd: VOWatchdog) {
    super(wd);
    this.status = BotStatus.WAITING;
    this.message = 'initialized';
  }

  addMCValues(MC: { [symbol: string]: VOMCAgregated }) {
    this.mcBase = MC[this.base];
    this.mcCoin = MC[this.coin];

    this.baseUS = +(this.mcBase.price_usd * this.balanceBase).toFixed(2);
    this.coinUS = +(this.mcCoin.price_usd * this.balanceCoin).toFixed(2);
  }

  sellCoin(reason:string){
    this.status = BotStatus.SELLING;
    this.setMessage(reason);
  }

   setMessage(message: string) {
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
