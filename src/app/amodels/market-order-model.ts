import {OrderType, VOWatchdog, WDType} from './app-models';
import {VOCoinDayValue} from './api-models';
import {MovingAverage, VOMovingAvg} from '../acom/moving-average';
import * as moment from 'moment';
import * as _ from 'lodash';
import {ApiPrivateAbstaract} from '../a-core/apis/api-private/api-private-abstaract';
import {ApisPrivateService} from '../a-core/apis/api-private/apis-private.service';
import {StorageService} from '../a-core/services/app-storage.service';
import {SellCoinFilling} from '../a-core/app-services/app-bots-services/sell-coin-filling';
import {Observable, Subject, Subscription} from 'rxjs';

export interface RunResults {
  actiin: string;
  isTrigger: boolean;
  reason: string;
  date: string;
}

export class MarketOrderModel extends VOWatchdog {

  id: string;
  base: string;
  coin: string;

  static statusChanges$(): Observable<MarketOrderModel> {
    return MarketOrderModel._statusChangedSub.asObservable();
  }

  constructor(wd: VOWatchdog) {
    super(wd);
    if(!wd.market)
    this.id = this.exchange + '-' + this.market;
    const ar = wd.market.split('_');
    this.coin = ar[1];
    this.base = ar[0];
    // this.subscribeForBalances();
  }

  static _statusChangedSub: Subject<MarketOrderModel> = new Subject<MarketOrderModel>();
  //  isToSell: boolean;

  static isTest: boolean;

  date: string;
  baseUS: number;
  coinUS: number;
  coinMC: VOCoinDayValue;
  baseMC: VOCoinDayValue;
  message: string;
  balanceBase: number;
  balanceCoin: number;
  wdId: string;
  sellCoinFill: SellCoinFilling;
  sub1;
  sub2;
  sub3: Subscription;

  errors: any[];
  warns: any[];
  logs: any[];

  setOrder(amount: number, orderType: OrderType, isActive: boolean) {



  }
 /* async runWaiting(curr: VOMCAgregated, base: VOMCAgregated) {
    const date = moment().format('HH:mm');


    const status = this.status;
    const prev = this.mcCoin;
    if (prev.timestamp === curr.timestamp) {
      console.log(this.wdId + ' sane timestamp ');
      return;
    }

    this.mcCoin = curr;
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
  }*/

 /* async run(curr: VOMCAgregated, base: VOMCAgregated): Promise<string> {
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
  }*/

  static isMovingDown2(prev: VOMovingAvg, curr: VOMovingAvg): boolean {
    
    return (
      (100 * ((curr.price2h - prev.price2h) / prev.price2h) < -0.11)

    );
  }

  subscribeForBalances() {


      // this.mcCoin = MC[this.coin];
      const api: ApiPrivateAbstaract = ApisPrivateService.instance.getExchangeApi(this.exchange);
      this.message = 'initialized';
      this.sub1 = api.balance$(this.coin).subscribe(balance => {
        if (!this.coinMC) return;
        console.log(this.wdId, balance);
        if (balance) {
          this.balanceCoin = balance.available;
          this.coinUS = Math.round(this.balanceCoin * this.coinMC.price_usd);
          // if (!this.coinUS) this.status = WatchDogStatus.SOLD;
        } else {
          this.balanceCoin = 0;
          this.coinUS = 0;
          // this.status = WatchDogStatus.NO_BALANCE;
        }
      });

      this.sub2 = api.balance$(this.base).subscribe(balance => {
        //  console.log(this.wdId, balance);
        if (!this.baseMC) return;
        if (balance) {
          this.balanceBase = balance.available;
          this.baseUS = Math.round(this.balanceBase * this.baseMC.price_usd);
          //  if (!this.baseUS) this.status = WatchDogStatus.NO_BALANCE_BASE;
        } else {
          // this.status = WatchDogStatus.NO_BALANCE_BASE;
          console.warn(' no balance for ' + this.base);
        }
      });
  }

  setDataMC(curr: any, base: any) {
    this.coinMC = curr;
    this.baseMC = base;
  }

 /* createSellCoin() {
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
    });
  }*/

/*  async runSellingStart(curr: any, base: any) {
    console.log(this.wdId + ' runSellingStart');

    if (!this.sellCoinFill) {
      this.createSellCoin();
      this.sellCoinFill.sell();
    } else this.warn('selling excists ');

  }*/

  async runWaiting2(coinValues: VOCoinDayValue[], coin: string) {
    const date = moment().format('HH:mm');
    const sumBy = _.sumBy;
    const MA: {
      symbol: string;
      price03hD: number;
      price1hD: number;
      price2hD: number;
      price4hD: number;
      price24hD: number;
      rank24hD: number;
    } = MovingAverage.movingAverageSnapFromCoinDay(coinValues, sumBy, coin);
    // console.log(MA);




  /*  const status = this.status;
    const prev = this.mcCoin;
    if (prev.timestamp === curr.timestamp) {
      console.log(this.wdId + ' sane timestamp ');
      return;
    }

    this.mcCoin = curr;
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
    this.log(data.toString())*/
  }

 /* async run2(coinsDay: VOCoinsDayData): Promise<string> {
    const coinValues = coinsDay[this.coin];
    const baseValues = coinsDay[this.base];
    const coinLast = _.last(coinValues);
    const baseLast = _.last(baseValues);
    const price_btc = _.last(coinsDay['BTC']).price_btc;
    coinLast.price_usd = coinLast.price_btc * price_btc;
    if (this.base !== 'BTC') baseLast.price_usd = baseLast.price_btc * price_btc;
    else baseLast.price_usd = baseLast.price_btc;
    this.coinMC = coinLast;
    this.baseMC = baseLast;

    // ApisPrivateService.instance.getExchangeApi(this.exchange).tickRefreshBalance();
    const status = this.status;
    const date = moment().format('HH:mm');
    console.log(date, this.wdId, this.status);
    switch (this.status) {
      case WatchDogStatus.WAITING:
        await this.runWaiting2(coinValues, this.coin);
        break;
      case WatchDogStatus.TO_SELL:
        // await this.runSellingStart(curr, base);
        break;
    }
    return this.wdId + ' ' + this.status;
  }*/


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
      orderID: this.orderID,
      exchange: this.exchange,
      market: this.market,
      wdType: WDType.OFF,
      results: this.results,
      sellScripts: this.sellScripts,
      buyScripts: this.buyScripts,
      pots: 0
    };

  }

  async onError(msg: string) {
    if (!this.errors) this.errors = await StorageService.instance.select(this.wdId + '-errors') || [];
    console.error(this.wdId, msg);
    this.errors.push({
      timestamp: moment().format(),
      message: msg,
    });
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
      message: msg
      // status: this.status
    });
    await StorageService.instance.upsert(this.wdId + '-logs', this.logs);

  }

}
