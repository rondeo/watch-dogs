import {Injectable} from '@angular/core';
import {StorageService} from '../../services/app-storage.service';
import {OrderType, VOWatchdog} from '../../models/app-models';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {DatabaseService} from '../../services/database.service';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubjectMy} from '../../com/behavior-subject-my';
import * as _ from 'lodash';
import * as moment from 'moment';
import {GRAPHS} from '../../com/grpahs';
import {VOMCAgregated, VOMCObj} from '../../models/api-models';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {WatchDog, WatchDogStatus} from '../../models/watch-dog';
import {SellCoinFilling} from './sell-coin-filling';
import {MovingAverage} from '../../com/moving-average';
import {clearInterval} from 'timers';
import {Subject} from 'rxjs/Subject';


@Injectable()
export class AppBotsService {

  private allWatchDogsSub: BehaviorSubjectMy<WatchDog[]> = new BehaviorSubjectMy(null);
  //  private sellCoinsCtr: AppSellCoin;
  private _isSellRunningSub: BehaviorSubject<boolean>;
  private _isBuyRunningSub: BehaviorSubject<boolean>;
  private sellInterval;
  private buyInterval;
  private MC: VOMCObj;

  private selling: SellCoinFilling[] = [];

  constructor(
    private storage: StorageService,
    private apiPrivates: ApisPrivateService,
    private apiPublics: ApisPublicService,
    private marketCap: ApiMarketCapService
  ) {
    const isRunning = !!JSON.parse(localStorage.getItem('isSellRunning'));
    this._isSellRunningSub = new BehaviorSubject<boolean>(isRunning);
    const isRunning2 = !!JSON.parse(localStorage.getItem('isBuyRunning'));
    this._isBuyRunningSub = new BehaviorSubject<boolean>(isRunning2);

    this.isBuyRunning$().subscribe(running => {
      localStorage.setItem('isBuyRunning', JSON.stringify(running))
    })
    this.isSellRunning$().subscribe(running => {
      localStorage.setItem('isSellRunning', JSON.stringify(running))
    })

    this.storage.getWatchDogs().then(wd => this.allWatchDogsSub.next(wd.map(o => new WatchDog(o))));
    // this.sellCoinsCtr = new AppSellCoin(storage, apiPrivates, apiPublics, this.allWatchDogsSub, marketCap);
    this.addListeners();
    this.start();
  }

  statusChangesTimeout;

  private addListeners() {
    WatchDog.statusChanges$().subscribe(watchDog => {
      clearTimeout(this.statusChangesTimeout);

      this.statusChangesTimeout = setTimeout(() => {
        this.dispatchChange();
        this.save();
      }, 1000);
    });
  }

  private dispatchChange() {
    const wds = this.allWatchDogsSub.getValue();
    this.allWatchDogsSub.next(wds);
  }

  resetAllWaitingState() {
    const wds = this.allWatchDogsSub.getValue();
    wds.forEach(function (item) {
      item.status = WatchDogStatus.WAITING;
    })
  }

  async dryRun(action: string) {
    if (action === 'SELL') {
      WatchDog.isTest = true;
      const wds = this.getAllSellBots();

      const prevMC = await this.marketCap.getAgregated(1).toPromise();
      console.log(prevMC);

      wds.forEach(function (item: WatchDog) {
        item.setDataMC(prevMC[item.coin], prevMC[item.base]);
      });

      const MC = await this.marketCap.getData();

      const wdsTosell = wds.filter(function (item: WatchDog) {
        return item.runIsToSell(MC[item.coin], MC[item.base])
      });

      console.log(' test ', wdsTosell);

      WatchDog.isTest = false;
    }
  }


  allWatchDogs$(): Observable<WatchDog[]> {
    return this.allWatchDogsSub.asObservable();
  }

  save() {
    console.log('%c saving dogs ' + moment().format('mm:ss'), 'color:green')
    const wds: WatchDog[] = this.allWatchDogsSub.getValue();
    const wdsData: VOWatchdog[] = wds.map(function (item) {
      return item.toJSON();
    });
    this.storage.saveWatchDogs(wdsData);
  }

  deleteWatchDog(wd: VOWatchdog) {
    let allDogs = this.allWatchDogsSub.getValue();
    allDogs = allDogs.filter(function (item) {
      return item.id && item.id !== wd.id;
    });
    this.allWatchDogsSub.next(allDogs)
    this.save();

    // this.storage.saveWatchDogs(allDogs).then(res => this.allWatchDogsSub.next(allDogs));
  }

  async getWatchDogById(id: string): Promise<WatchDog> {
    return new Promise<WatchDog>((resolve, reject) => {
      this.allWatchDogs$().subscribe(wds => {
        //  console.warn(wds);
        resolve(_.find(wds, {id: id}));
      }, reject)
    })

  }

  async saveWatchDog(watchDog: WatchDog) {
    const wds = this.allWatchDogsSub.getValue() || [];
    if (!await this.getWatchDogById(watchDog.id)) {
      wds.push(watchDog);
    }
    const wdData = wds.map(function (item: WatchDog) {
      return item.toJSON();
    });
    await this.storage.saveWatchDogs(wdData);
    this.allWatchDogsSub.next(wds);
  }

  getActiveSellBotsWaiting() {
    return this.getActiveSellBots().filter(function (item) {
      return item.status === WatchDogStatus.WAITING;
    });
  }

  getActiveSellBots() {
    return this.getAllSellBots().filter(function (item) {
      return item.isActive;
    });
  }

  getAllSellBots(): WatchDog[] {
    const allWD = this.allWatchDogsSub.getValue();
    if (!allWD) return [];
    return allWD.filter(function (wd: WatchDog) {
      return wd.orderType === OrderType.SELL;
    });
  }

  getActiveBuyBots(): WatchDog[] {
    return this.getAllBuyBots().filter(function (item) {
      return item.isActive;
    });
  }

  getAllBuyBots(): WatchDog[] {
    const allWD = this.allWatchDogsSub.getValue();
    if (!allWD) return [];
    return allWD.filter(function (wd: WatchDog) {
      return wd.orderType === OrderType.BUY;
    })
  }

  removeFromSellingById(id: string) {
    this.selling = _.reject(this.selling, {id: id});
  }

  //TODO make one sell per exchange at the time

  checkStatusSelling() {
    const selleing = this.selling.filter(function (item) {
      return item.watchDog.status === WatchDogStatus.TO_SELL;
    });

    selleing.forEach((item) => {
      item.sell().then(status => {
        if (status === WatchDogStatus.SOLD && WatchDogStatus.SOLD_OUT)
          this.removeFromSellingById(item.id);
      })
    });
    console.log('TO_SELL', selleing);
  }


  //////////////// start stop bots ////////////////////////
  async runBots() {

    const wds = this.getActiveSellBotsWaiting();
    console.log(' RUN SELL ', wds);
    const MC = await this.marketCap.getData();

    const wdsTosell = wds.filter(function (item: WatchDog) {
      const aggr: VOMCAgregated = MC[item.coin];
      return item.runIsToSell(MC[item.coin], MC[item.base])
    });
    console.log(' run sell results ', wdsTosell);
    if (wdsTosell.length) this.addBotsToSell(wdsTosell);
  }


  private addBotsToSell(wds: WatchDog[]) {
    const selling = this.selling;

    const exists = _.intersectionBy(selling, wds, 'id');

    if (exists.length) {
      console.warn(' camt sell wds', exists);
      wds = _.pullAllBy(wds, selling, 'id');
    }

    const newSelling = wds.map((item) => {
      return new SellCoinFilling(item, this.apiPrivates, this.apiPublics);
    });

    this.selling = this.selling.concat(newSelling);
    this.dispatchChange();

    this.checkStatusSelling();
  }

  private seconds = 30;
  private seconsLeftSub: BehaviorSubject<number> = new BehaviorSubject<number>(30);

  secondsLeft$() {
    return this.seconsLeftSub.asObservable();
  }

  private runInterval;

  start() {
    if (!this.runInterval) {
      this.runInterval = setInterval(() => {
        if (!this._isSellRunningSub.getValue() && !this._isBuyRunningSub.getValue()) {
          this.seconsLeftSub.next(this.seconds);
          return;
        }
        ;
        let secondsLef = this.seconsLeftSub.getValue();
        secondsLef--;
        if (secondsLef < 0) {
          this.runBots();
          secondsLef = this.seconds;
        }
        this.seconsLeftSub.next(secondsLef);

      }, 1000);
    }
  }

  stop() {
    clearInterval(this.runInterval);
    this.runInterval = 0;
  }

  startSellBots() {
    this._isSellRunningSub.next(true);
    this.runBots();
  }

  stopSellBots() {
    this._isSellRunningSub.next(false);
  }

  startBuyBots() {
    this._isBuyRunningSub.next(true);
    this.runBots();
  }

  stopBuyBots() {
    this._isBuyRunningSub.next(false);
  }

  isSellRunning$(): Observable<boolean> {
    return this._isSellRunningSub.asObservable()
  }

  isBuyRunning$(): Observable<boolean> {
    return this._isBuyRunningSub.asObservable()
  }


}
