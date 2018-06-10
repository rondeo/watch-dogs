import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {OrderType, VOWatchdog} from '../../models/app-models';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import * as _ from 'lodash';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubjectMy} from '../../com/behavior-subject-my';

import {RunScript} from '../../com/run-script';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {MovingAverage} from '../../com/moving-average';
import {WatchDog} from '../../models/watch-dog';
import * as moment from 'moment';

export class AppSellCoin {
 // private watchDogs: WatchDog[];
  ///private watchDogsSub: BehaviorSubjectMy<VOWatchdog[]> = new BehaviorSubjectMy(null);
  private _isSellRunning: BehaviorSubject<boolean>;
  private interval;

  constructor(
    private storage: StorageService,
    private apiPrivate: ApisPrivateService,
    private apiPublic: ApisPublicService,
    private allWatchDogsSub: BehaviorSubjectMy<WatchDog[]>,
    private marketCap: ApiMarketCapService
  ) {

    const isRunning = !!JSON.parse(localStorage.getItem('isSellRunning'));
    this._isSellRunning = new BehaviorSubject<boolean>(isRunning);

    setTimeout(() => this.init(), 1);
  }

  sellCoins(watchDog: WatchDog[]) {

  }

  init() {
    if (this._isSellRunning.getValue()) this.start();
    this.allWatchDogsSub.asObservable().subscribe(wds => {

    /*  this.watchDogs = wds.filter(function (item) {
        return item.orderType === OrderType.SELL;
      });
      this.watchDogs.forEach(function (item) {

      });
      this.watchDogsSub.next(this.watchDogs);*/
    });
  }

  isRunning$() {
    return this._isSellRunning.asObservable();
  }

  start() {
    if (!this.interval) {
      localStorage.setItem('isSellRunning', 'true');
      this.interval = setInterval(() => this.run(), 60 * 1000);
      this._isSellRunning.next(true);
    }
  }

  stop() {
    clearInterval(this.interval);
    this.interval = 0;
    this._isSellRunning.next(false);
    localStorage.setItem('isSellRunning', 'false');
  }

  /*watchDogs$() {
    return this.watchDogsSub.asObservable();
  }*/

/*  sellCoinsNumber(): Observable<number> {
    return this.watchDogs$().map(wds => wds.length);
  }*/

  getAllSellBots(): WatchDog[]{
    const allWD = this.allWatchDogsSub.getValue();
    if (!allWD) return[];
    return WatchDog.isTest? allWD.filter(function (wd: WatchDog) {
      return wd.orderType === OrderType.SELL;
    }) :  allWD.filter(function (wd: WatchDog) {
      return wd.isActive && wd.orderType === OrderType.SELL;
    })
  }

  async run() {
    const sellDogs = this.getAllSellBots();
    if (!sellDogs.length) return;
    console.log('running bots ' + sellDogs.length);
    const MC = await this.marketCap.getData();

    sellDogs.forEach(function (wd: WatchDog) {
      const aggr = MC[wd.coin];
      if (!aggr) console.error(wd, MC);
      else {
        const ma = MovingAverage.map(aggr);
        const isTrigger = MovingAverage.isMovingDown(ma);
        const msg = isTrigger ?  wd.sellCoin('selling coin') : wd.setMessage('avarage price not going down');

      }
    });
    console.log(sellDogs);
  }

  async dryRun() {
    WatchDog.isTest = true;
    await this.run();
    WatchDog.isTest = false;
  }

}
