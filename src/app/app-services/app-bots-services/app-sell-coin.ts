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

export class AppSellCoin {
  private sellCoins: VOWatchdog[];
  private sellCoinsSub: BehaviorSubjectMy<VOWatchdog[]> = new BehaviorSubjectMy(null);
  private _isSellRunning: BehaviorSubject<boolean>;
  private interval;
  constructor(
    private storage: StorageService,
    private apiPrivate: ApisPrivateService,
    private apiPublic: ApisPublicService,
    private watchDogsSub: BehaviorSubjectMy<VOWatchdog[]>,
    private marketCap: ApiMarketCapService
  ) {

    const isRunning = !!JSON.parse(localStorage.getItem('isSellRunning'));
    this._isSellRunning = new BehaviorSubject<boolean>(isRunning);

   setTimeout(()=>this.init(), 1);
  }

  init(){
    if(this._isSellRunning.getValue()) this.start();
    this.watchDogsSub.asObservable().subscribe(wds => {
      this.sellCoins = _.filter(wds, {action: 'SELL'});
      this.sellCoinsSub.next(this.sellCoins);
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

  sellCoins$() {
    return this.sellCoinsSub.asObservable();
  }

  sellCoinsNumber():Observable<number>{
    return this.sellCoins$().map(wds => wds.length);
  }
  async run() {
    if(!this.sellCoins) return;
    if(!this._isSellRunning.getValue()) return;
    console.log('running bots ' + this.sellCoins.length);
    const MC = await this.marketCap.getData();
    this.sellCoins.forEach(function (wd: VOWatchdog) {
     /* const sellScripts = wd.sellScripts || [];
      const mc: VOMCAgregated = MC[wd.coin];
      const results = sellScripts.map(function (script) {
        return RunScript.runScriptSell( mc, script)
      });
      console.log(results);*/

    })
    console.log(this.sellCoins);
  }

  async dryRun() {
   const MC = await this.marketCap.getAgregated().toPromise();
   //console.log(MC);
    console.log('dry run bots ' + this.sellCoins.length);
    this.sellCoins.forEach(function (wd: VOWatchdog) {
      const aggr = MC[wd.coin];
      if(!aggr) console.error(wd, MC);
      else {
        const ma = MovingAverage.map(aggr);
        console.log(ma);
        const trigger = MovingAverage.isMovingDown(ma);
        console.log(trigger);
      }
    });
  }
}
