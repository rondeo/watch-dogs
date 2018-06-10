import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {VOWatchdog} from '../../models/app-models';
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
  private watchDogs: WatchDog[];
  private watchDogsSub: BehaviorSubjectMy<VOWatchdog[]> = new BehaviorSubjectMy(null);
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

   setTimeout(()=>this.init(), 1);
  }

  init(){
    if(this._isSellRunning.getValue()) this.start();
    this.allWatchDogsSub.asObservable().subscribe(wds => {
      this.watchDogs = _.filter(wds, {action: 'SELL'})
      this.watchDogs.forEach(function (item) {
        item.message = 'INIT';
      })
      this.watchDogsSub.next(this.watchDogs);
    });
  }

  isRunning$() {
    return this._isSellRunning.asObservable();
  }

  start(){
    if(!this.interval){
      localStorage.setItem('isSellRunning', 'true');
      this.interval = setInterval(() => this.run(), 60 * 1000);
      this._isSellRunning.next(true);
    }
  }

  stop(){
    clearInterval(this.interval);
    this.interval = 0;
    this._isSellRunning.next(false);
    localStorage.setItem('isSellRunning', 'false');
  }

  watchDogs$() {
    return this.watchDogsSub.asObservable();
  }

  sellCoinsNumber():Observable<number>{
    return this.watchDogs$().map(wds => wds.length);
  }
  async run() {
    if(!this.watchDogs) return;
    if(!this._isSellRunning.getValue()) return;
    console.log('running bots ' + this.watchDogs.length);
    const MC = await this.marketCap.getData();
    this.watchDogs.forEach(function (wd: WatchDog) {
     /* const sellScripts = wd.sellScripts || [];
      const mc: VOMCAgregated = MC[wd.coin];
      const results = sellScripts.map(function (script) {
        return RunScript.runScriptSell( mc, script)
      });
      console.log(results);*/

    })
    console.log(this.watchDogs);
  }

  async dryRun() {

   const MC = await this.marketCap.getAgregated().toPromise();
   //console.log(MC);
    console.log('dry run bots ' + this.watchDogs.length);
    this.watchDogs.forEach(function (wd: WatchDog) {
      const aggr = MC[wd.coin];
      if(!aggr) console.error(wd, MC);
      else {
        const ma = MovingAverage.map(aggr);
        const isTrigger = MovingAverage.isMovingDown(ma);
        console.log(isTrigger, ma);
        const msg = isTrigger?'selling coin':'avarage price not going down';
       // wd.message = 'avarage price onot going down';
        wd.dryRunResults('SELL',false, msg, moment().format());
      }
    });
    this.watchDogsSub.next(this.watchDogs);

  }
}
