import {Injectable} from '@angular/core';
import {StorageService} from '../../services/app-storage.service';
import {VOWatchdog} from '../../models/app-models';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {AppSellCoin} from './app-sell-coin';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {DatabaseService} from '../../services/database.service';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubjectMy} from '../../com/behavior-subject-my';
import * as _ from 'lodash';

@Injectable()
export class AppBuySellService {

  private watchDogsDataSub: BehaviorSubjectMy<VOWatchdog[]> = new BehaviorSubjectMy(null);
  private sellCoinsCtr: AppSellCoin;
  private _isSellRunning: BehaviorSubject<boolean>;
  private _isBuyRunning: BehaviorSubject<boolean>;
  private sellInterval;
  private buyInterval;

  constructor(
    private storage: StorageService,
    private apiPrivate: ApisPrivateService,
    private apiPublic: ApisPublicService
  ) {
    this.storage.getWatchDogs().then(wd => this.watchDogsDataSub.next(wd))
    this.sellCoinsCtr = new AppSellCoin(this.storage, this.apiPrivate, this.apiPublic, this.watchDogsDataSub);
    this.init();
  }

  init() {
    this.isSellRunning$().subscribe(isRunning => {
      console.log('BOTS running ' + isRunning);
      if (isRunning) {
        if (!this.sellInterval) {
          this.sellInterval = setInterval(() => this.runSellBots(), 60 * 1000);
          const sub = this.sellCoinsCtr.sellCoins$().subscribe(wds => {
            this.runSellBots();
            setTimeout(() =>sub.unsubscribe(), 100);
          });
        } else this.runSellBots();
      } else {
        clearInterval(this.sellInterval);
        this.sellInterval = 0;
      }
    });
  }

  isSellRunning$(): Observable<boolean> {
    if (!this._isSellRunning) {
      const isRunning = !!JSON.parse(localStorage.getItem('isSellRunning'));
      this._isSellRunning = new BehaviorSubject<boolean>(isRunning);
    }
    return this._isSellRunning.asObservable();
  }

  isBuyRunning$(): Observable<boolean> {
    if (!this._isBuyRunning) {
      const isRunning = !!JSON.parse(localStorage.getItem('isBuyRunning'));
      this._isBuyRunning = new BehaviorSubject<boolean>(isRunning);
    }
    return this._isBuyRunning.asObservable();
  }

  startSellBots() {
    localStorage.setItem('isSellRunning', 'true');
    this._isSellRunning.next(true);
  }

  stopSellBots() {
    localStorage.setItem('isSellRunning', 'false');
    this._isSellRunning.next(false);
  }

  runSellBots() {
    console.log('running bots');
    this.sellCoinsCtr.run();

  }

  sellCoins$(): Observable<VOWatchdog[]> {
    return this.sellCoinsCtr.sellCoins$()
  }

  buyCoins$(): Observable<VOWatchdog[]> {
    return this.watchdogsData$().map(wds => _.filter(wds, {action: 'BUY'}))
  }

  watchdogsData$() {
    return this.watchDogsDataSub.asObservable();
  }

  save(wds?: VOWatchdog[]) {
    this.storage.saveWatchDogs(wds);
  }

  deleteWatchDog(wd: VOWatchdog) {

    let allDogs = this.watchDogsDataSub.getValue();

    allDogs = allDogs.filter(function (item) {
      return item.id && item.id !== wd.id;
    });

    this.storage.saveWatchDogs(allDogs).then(res => this.watchDogsDataSub.next(allDogs));

  }

  async getWatchDogById(id: string): Promise<VOWatchdog> {
    return new Promise<VOWatchdog>((resolve, reject) => {
      this.watchdogsData$().subscribe(wds => {
        //  console.warn(wds);
        resolve(_.find(wds, {id: id}));
      }, reject)

    })

  }

  async saveWatchDog(watchDog: VOWatchdog) {
    const wds = this.watchDogsDataSub.getValue() || [];
    if (!this.getWatchDogById(watchDog.id)) {
      wds.push(watchDog);
    }
    await this.storage.saveWatchDogs(wds)
    this.watchDogsDataSub.next(wds);
  }
}
