import {OrderType, VOBalance, VOMarketCap, VOWATCHDOG, VOWatchdog} from './app-models';
import {VOMCAgregated} from './api-models';
import {MovingAverage, VOMovingAvg} from '../com/moving-average';
import {ɵAnimationStyleNormalizer} from '@angular/animations/browser';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';

import {ApiPublicAbstract} from '../apis/api-public/api-public-abstract';
import {ApisPublicService} from '../apis/apis-public.service';
import {ApiPrivateAbstaract} from '../apis/api-private/api-private-abstaract';
import {ApisPrivateService} from '../apis/apis-private.service';
import {ApiMarketCapService} from '../apis/api-market-cap.service';
import {StorageService} from '../services/app-storage.service';
import {SellCoinFilling} from '../app-services/app-bots-services/sell-coin-filling';
import {Subscription} from 'rxjs/Subscription';
import {WatchDogShared} from '../app-services/app-bots-services/watch-dog-shared';
import {WatchDogStatus} from '../app-services/app-bots-services/watch-dog-status';

export interface RunResults {
  actiin: string;
  isTrigger: boolean;
  reason: string;
  date: string;
}

export class WatchDog {


  static _statusChangedSub: Subject<WatchDog> = new Subject<WatchDog>();

  static statusChanges$(): Observable<WatchDog> {
    return WatchDog._statusChangedSub.asObservable();
  }

  private sellCoinFill: SellCoinFilling;

  sub3: Subscription;
  //  isToSell: boolean;

  static isTest: boolean;

  get name(): string {
    return this.shared.name;
  }

  set orderType(ot: OrderType) {

    this.shared.orderType = ot;
  }

  get orderType(): OrderType {
    return this.shared.orderType;
  }

  get wdId(): string {
    return this.shared.wdId
  }

  get exchange(): string {
    return this.shared.exchange;
  }

  get base(): string {
    return this.shared.base;
  }

  get isActive() {
    return this.shared.isActive;
  }

  set isActive(a: boolean) {
    this.shared.isActive = a;
  }

  get coin(): string {
    return this.shared.coin;
  }

  get id(): string {
    return this.shared.id;
  }

  get status(): WatchDogStatus {
    return this.shared._status;
  }

  set status(val: WatchDogStatus) {
    if (this.status === val) return
    this.shared._status = val;
    WatchDog._statusChangedSub.next(this);
  }

  shared: WatchDogShared;

  constructor(public wd: VOWatchdog) {
    this.shared = new WatchDogShared(wd)
  }

  setDataMC(curr: VOMCAgregated, base: VOMCAgregated) {
    this.shared.coinMC = curr;
    this.shared.baseMC = base;
  }

  createSellCoin() {
    this.sellCoinFill = new SellCoinFilling(this.shared);
    this.sub3 = this.sellCoinFill.statusChanged$().subscribe(status => {
      this.status = status.status;
      this.shared.addHistory(status.message);
      switch (status.status) {
        case WatchDogStatus.SELLING_ORDER_CLOSED:
          ApisPrivateService.instance.getExchangeApi(this.shared.exchange).refreshBalances();
          this.sellCoinFill.dectroy();
          this.sub3.unsubscribe();
          this.sellCoinFill = null;
          break;
        case WatchDogStatus.ERROR_SELLING:
          this.shared.onError(status.message);
          break;
      }
    })
  }

  async runSellingStart(curr: VOMCAgregated, base: VOMCAgregated) {
    console.log(this.shared.wdId + ' runSellingStart');
    //  const history = await this.getHistory();
    if (!this.sellCoinFill) {
      this.createSellCoin();
      this.sellCoinFill.sell();
    } else this.shared.onError('selling excists ')

  }

  async runWaiting(curr: VOMCAgregated, base: VOMCAgregated) {
    const date = moment().format('HH:mm');
    const history = await this.shared.getHistory();
    const status = this.shared.status;
    const prev = this.shared.coinMC;
    if (prev.timestamp === curr.timestamp) {
      console.log('%c same timestamp ' + this.shared.wdId + ' ' + moment(prev.timestamp).format('DD-MM HH:mm a'), 'color:pink');
      return;
    }

    this.shared.coinMC = _.clone(curr);
    this.shared.baseMC = _.clone(base);
    if (!prev) return this.shared.status;

    const prices_bts: number[] = [prev.price_btc, curr.price_btc, prev.last20, curr.last20, -0.11];

    const percentChange2h = 100 * ((curr.last20 - prev.last20) / prev.last20);

    prices_bts.push(percentChange2h);
    const isToSell = percentChange2h < -0.11;
    if (isToSell) this.status = WatchDogStatus.TO_SELL;
    const timestamps = [
      moment(prev.timestamp).format('HH:mm'),
      moment(curr.timestamp).format('HH:mm'),
      moment(curr.timestamp).diff(prev.timestamp, 'minutes')
    ]
    const data = {
      date,
      prices_bts,
      isToSell,
      timestamps,
      status
    };
    console.log(data);
    this.shared.history.push(data);
    return this.shared.saveHistory();
  }

  async run(curr: VOMCAgregated, base: VOMCAgregated): Promise<string> {
    ApisPrivateService.instance.getExchangeApi(this.shared.exchange).tickRefreshBalance();
    const status = this.status;
    const date = moment().format('HH:mm');
    //  console.log(date, this.wdId, this.status);
    switch (this.status) {
      case WatchDogStatus.WAITING:
        await this.runWaiting(curr, base);
        break;
      case WatchDogStatus.TO_SELL:
        await this.runSellingStart(curr, base);
        break;
    }
    return this.shared.wdId + ' ' + this.status;
  }

  static isMovingDown2(prev: VOMovingAvg, curr: VOMovingAvg): boolean {
    ;
    return (
      (100 * ((curr.price2h - prev.price2h) / prev.price2h) < -0.11)

    );
  }

  /*private setMessage(message: string) {
    this.message = message;
    if (!this.history) this.history = [];
    this.history.push(message);
    if (this.history.length > 100) this.history.shift();
    this.setCurrentDate();
  }*/

  destroy() {
    if (this.sellCoinFill) this.sellCoinFill.dectroy();

    if (this.sub3) this.sub3.unsubscribe();
    this.sub3 = null;
    this.sellCoinFill = null;


  }


  toJSON(): VOWatchdog {
    return this.shared.toJSON();

  }

}
