import {VOBalance, VOMarketCap, VOWATCHDOG, VOWatchdog} from './app-models';
import {VOMCAgregated} from './api-models';
import {MovingAverage, VOMovingAvg} from '../com/moving-average';
import {ɵAnimationStyleNormalizer} from '@angular/animations/browser';
import * as moment from 'moment';
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
import {IWatchDog, WatchDogStatus} from '../app-services/app-bots-services/watch-dog-status';

export interface RunResults {
  actiin: string;
  isTrigger: boolean;
  reason: string;
  date: string;
}

export class WatchDog extends VOWatchdog implements IWatchDog {

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
  balanceBase: number;
  balanceCoin: number;
  wdId: string;
  sellCoinFill: SellCoinFilling;
  sub1
  sub2
  sub3: Subscription;

  errors: any[];
  warns: any[];
  logs: any[];
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
    });
  }

  setDataMC(curr: VOMCAgregated, base: VOMCAgregated) {
    this.coinMC = curr;
    this.baseMC = base;
  }

  createSellCoin() {
    this.sellCoinFill = new SellCoinFilling(this as IWatchDog);
    this.sub3 = this.sellCoinFill.statusChanged$().subscribe(status => {
      this.status = status.status;
      this.log(status.message);
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

    if (!this.sellCoinFill) {
      this.createSellCoin();
      this.sellCoinFill.sell();
    } else this.warn('selling excists ')

  }

  async runWaiting(curr: VOMCAgregated, base: VOMCAgregated) {
    const date = moment().format('HH:mm');

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
    const data = [
      date,
      values,
      isToSell,
      coinData,
      status
    ];
    this.log(data.toString())
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
    this.warns = null;
    this.logs = null;
    StorageService.instance.remove(this.wdId + '-logs');
    StorageService.instance.remove(this.wdId + '-errors');
    StorageService.instance.remove(this.wdId + '-warns');

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

  async onError(msg: string) {
    if (!this.errors) this.errors = await StorageService.instance.select(this.wdId + '-errors') || [];
    console.error(this.wdId, msg);
    this.errors.push({
      timestamp: moment().format(),
      message: msg,
    })
    return await StorageService.instance.upsert(this.wdId + '-errors', this.errors);
  }

  async warn(msg, obj?: any) {
    if (!this.warns) this.warns = await StorageService.instance.select(this.wdId + '-warns') || [];
    console.warn(this.wdId, msg, obj);
    this.warns.push({
      timestamp: moment().format(),
      message: msg,
      data: obj
    });
    return await StorageService.instance.upsert(this.wdId + '-warns', this.warns);

  }

  async log(msg: string) {
    if (!this.logs) this.logs = await StorageService.instance.select(this.wdId + '-logs') || [];
    console.log(this.wdId, msg);
    this.logs.push({
      time: moment().format('HH:mm'),
      timestamp: moment().format(),
      message: msg,
      status: this.status
    });
    await StorageService.instance.upsert(this.wdId + '-logs', this.logs);

  }

}
