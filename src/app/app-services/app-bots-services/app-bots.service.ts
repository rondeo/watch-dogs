import {Injectable} from '@angular/core';
import {StorageService} from '../../services/app-storage.service';
import {OrderType, VOWatchdog} from '../../models/app-models';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {AppSellCoin} from './app-sell-coin';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {DatabaseService} from '../../services/database.service';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubjectMy} from '../../com/behavior-subject-my';
import * as _ from 'lodash';
import {GRAPHS} from '../../com/grpahs';
import {VOMCObj} from '../../models/api-models';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {WatchDog, WatchDogStatus} from '../../models/watch-dog';
import {SellCoinFilling} from './sell-coin-filling';
import {MovingAverage} from '../../com/moving-average';
import {clearInterval} from 'timers';


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

    this.storage.getWatchDogs().then(wd => this.allWatchDogsSub.next(wd.map(o => new WatchDog(o))));
    // this.sellCoinsCtr = new AppSellCoin(storage, apiPrivates, apiPublics, this.allWatchDogsSub, marketCap);
    this.addListeners();
  }

  async checkBotsToSell(sellDogs: WatchDog[]): Promise<number> {
    if (!sellDogs.length) return Promise.resolve(0);
    console.log('running bots ' + sellDogs.length);
    const MC = await this.marketCap.getData();
    sellDogs.forEach((wd: WatchDog) => {
      const aggr = MC[wd.coin];
      if (!aggr) console.error(wd, MC);
      else {
        const ma = MovingAverage.map(aggr);
        const isTrigger = MovingAverage.isMovingDown(ma);
        const msg = isTrigger ? wd.sellCoin('selling coin') : wd.setWaitingMessage('avarage price not going down');
        if (isTrigger) {
          this.addSellingBot(wd);
        }
      }
    });
    return this.selling.length;
  }

  addSellingBot(wd: WatchDog) {
    if (WatchDog.isTest) return;
    const exists = _.find(this.selling, {is: wd.id});
    if (!exists) {
      this.selling.push(new SellCoinFilling(wd, this.apiPrivates, this.apiPublics));
    }
  }

  statusChangesTimeout;
  private addListeners() {
    WatchDog.statusChanges$().subscribe(watchDog => {
      clearTimeout(this.statusChangesTimeout);
      this.statusChangesTimeout = setTimeout(() => this.dispatchChange(), 3000);
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
      const num = await this.checkBotsToSell(wds);
      WatchDog.isTest = false;
    }
  }

  isSellRunning$(): Observable<boolean> {
   return this._isSellRunningSub.asObservable()
  }

  isBuyRunning$(): Observable<boolean> {
    return this._isBuyRunningSub.asObservable()
  }

  startSellBots() {
    this._isSellRunningSub.next(true);
    this.runBots();
    this.start();
  }

  stopSellBots() {
    this._isSellRunningSub.next(false);
  }

  allWatchDogs$(): Observable<WatchDog[]> {
    return this.allWatchDogsSub.asObservable();
  }

  save() {
    const wds:WatchDog[] = this.allWatchDogsSub.getValue();
    const wdsData: VOWatchdog[] = wds.map(function (item) {
      return item.toJSON();
    });
    this.storage.saveWatchDogs(wdsData);
    this.allWatchDogsSub.next(wds);
  }

  deleteWatchDog(wd: VOWatchdog) {
    let allDogs = this.allWatchDogsSub.getValue();

    allDogs = allDogs.filter(function (item) {
      return item.id && item.id !== wd.id;
    });
    this.storage.saveWatchDogs(allDogs).then(res => this.allWatchDogsSub.next(allDogs));
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
    await this.storage.saveWatchDogs(wds.map(function (item: WatchDog) {
      return item.toJSON();
    }))
    this.allWatchDogsSub.next(wds);
  }

  getActiveSellBotsWaiting() {
    return this.getActiveSellBots().filter(function (item) {
      item.status === WatchDogStatus.WAITING;
    })
  }

  getActiveSellBots() {
    return this.getAllSellBots().filter(function (item) {
      return item.isActive;
    })
  }

  getAllSellBots(): WatchDog[] {
    const allWD = this.allWatchDogsSub.getValue();
    if (!allWD) return [];
    return allWD.filter(function (wd: WatchDog) {
      return wd.orderType === OrderType.SELL;
    })
  }

  getActiveBuyBots(): WatchDog[]{
    return this.getAllBuyBots().filter(function (item) {
      return item.isActive;
    })
  }

  getAllBuyBots(): WatchDog[]{
    const allWD = this.allWatchDogsSub.getValue();
    if (!allWD) return [];
    return allWD.filter(function (wd: WatchDog) {
      return wd.orderType === OrderType.BUY;
    })
  }

  private runInterval
  start(){
    if(!this.runInterval){
      this.runInterval = setInterval(()=> this.runBots(), 30000);
    }
  }
  stop(){
    clearInterval(this.runInterval);
    this.runInterval = 0;
  }

  checkStatusSelling(){
    const selleind: SellCoinFilling[] = this.selling;

  }
  runBots(){
    console.log(' SELL ' + this._isSellRunningSub.getValue());
    if(this._isSellRunningSub.getValue()){
      const wds =  this.getActiveSellBotsWaiting();
      this.checkBotsToSell(wds).then(num =>{
        if(num) this.checkStatusSelling()
      })
    }

  }

}
