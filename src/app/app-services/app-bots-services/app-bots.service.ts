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
import {WatchDog} from '../../models/watch-dog';


@Injectable()
export class AppBotsService {

  private allWatchDogsSub: BehaviorSubjectMy<WatchDog[]> = new BehaviorSubjectMy(null);
  private sellCoinsCtr: AppSellCoin;
  private _isSellRunning: BehaviorSubject<boolean>;
  private _isBuyRunning: BehaviorSubject<boolean>;
  private sellInterval;
  private buyInterval;
  private MC:VOMCObj;

  constructor(
    private storage: StorageService,
    private apiPrivate: ApisPrivateService,
    private apiPublic: ApisPublicService,
    private marketCap: ApiMarketCapService
  ) {
    this.storage.getWatchDogs().then(wd => this.allWatchDogsSub.next(wd.map(o=>new WatchDog(o))));
    this.sellCoinsCtr = new AppSellCoin(storage, apiPrivate, apiPublic, this.allWatchDogsSub, marketCap);
    this.init();
  }

  init() {
    this.marketCap.agregated$().subscribe(newValues => {
      this.MC = newValues;
      this.sellCoinsCtr.run();
    })
  }

  dryRun(action: string){
    if(action === 'SELL'){
      this.sellCoinsCtr.dryRun().then(res =>{
        const wds = this.allWatchDogsSub.getValue();
        console.log(wds)
        this.allWatchDogsSub.next(wds);
      })
    }
  }

  isSellRunning$(): Observable<boolean> {
   return this.sellCoinsCtr.isRunning$();
  }

  isBuyRunning$(): Observable<boolean> {
   return null
  }

  startSellBots() {
    this.sellCoinsCtr.start();
  }

  stopSellBots() {
    this.sellCoinsCtr.stop();
  }

  runSellBots() {
   this.sellCoinsCtr.run();
  }

  allWatchDogs$(): Observable<WatchDog[]> {
    return this.allWatchDogsSub.asObservable();
  }

  save(wds: VOWatchdog[]) {
    this.storage.saveWatchDogs(wds);
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
}
