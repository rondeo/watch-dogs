import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {StorageService} from '../../services/app-storage.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPrivateService} from '../../apis/api-private/apis-private.service';
import {VOMarketCap, VOWatchdog} from '../../../amodels/app-models';
import * as moment from 'moment';
import * as _ from 'lodash';
import {WatchDogStatus} from './watch-dog-status';

export class WatchDogShared extends VOWatchdog {

  sub1
  sub2
  status: WatchDogStatus;
  wdId: string
  history: any[];

  date: string;
  baseUS: number;
  coinUS: number;
  coinMC: VOMarketCap;
  baseMC: VOMarketCap;
  message: string;

  balanceBase: number;
  balanceCoin: number;

  constructor(public wd: VOWatchdog) {
    super(wd);
    this.wdId = wd.exchange + '-' + wd.base + '-' + wd.coin;
    this.subscribeForBalances();
  }

  subscribeForBalances() {
    

 //    if (!this.wd.exchange || !this.wd.base || !this.wd.coin) return;
   /* ApiMarketCapService.instance.getTicker().then(MC => {
      this.coinMC = MC[this.wd.coin];
      this.baseMC = MC[this.wd.base];
      const api: ApiPrivateAbstaract = ApisPrivateService.instance.getExchangeApi(this.wd.exchange);
      this.message = 'initialized';
      this.sub1 = api.balance$(this.wd.coin).subscribe(balance => {
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

      this.sub2 = api.balance$(this.wd.base).subscribe(balance => {
        //  console.log(this.wdId, balance);
        if (balance) {
          this.balanceBase = balance.balance    ;
          this.baseUS = Math.round(this.balanceBase * this.baseMC.price_usd);
          //  if (!this.baseUS) this.status = WatchDogStatus.NO_BALANCE_BASE;
        } else {
          // this.status = WatchDogStatus.NO_BALANCE_BASE;
          console.warn(' no balance for ' + this.wd.base);
        }
      })
    })*/

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

  destroy() {
    if (this.sub1) this.sub1.unsubscribe();
    this.sub1 = null;
    if (this.sub2) this.sub2.unsubscribe();
    this.sub2 = null;
    StorageService.instance.remove(this.wdId + '-errors');
    StorageService.instance.remove(this.wdId + '-history');
  }

  toJSON() {
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
