import {Injectable} from '@angular/core';
import {StorageService} from '../../services/app-storage.service';
import {OrderType, VOWatchdog} from '../../../models/app-models';
import {ApisPrivateService} from '../../apis/api-private/apis-private.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {DatabaseService} from '../../services/database.service';
import {BehaviorSubjectMy} from '../../com/behavior-subject-my';
import * as _ from 'lodash';
import * as moment from 'moment';
import {GRAPHS} from '../../com/grpahs';
import {VOMCObj} from '../../../models/api-models';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {WatchDog} from '../../../models/watch-dog';
import {SellCoinFilling} from './sell-coin-filling';
import {MovingAverage} from '../../com/moving-average';
import {WatchDogStatus} from './watch-dog-status';
import {MarketBot} from './market-bot';
import {CandlesService} from '../candles/candles.service';
import {BehaviorSubject, Observable} from 'rxjs';


@Injectable()
export class AppBotsService {

  // private selling: SellCoinFilling[] = [];

  constructor(
    private storage: StorageService,
    private apiPrivates: ApisPrivateService,
    private apiPublics: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private candlesService: CandlesService
  ) {
    const isRunning = !!JSON.parse(localStorage.getItem('isSellRunning'));
    this._isSellRunningSub = new BehaviorSubject<boolean>(isRunning);
    const isRunning2 = !!JSON.parse(localStorage.getItem('isBuyRunning'));
    this._isBuyRunningSub = new BehaviorSubject<boolean>(isRunning2);

    this.isBuyRunning$().subscribe(running => {
      localStorage.setItem('isBuyRunning', JSON.stringify(running));
    });
    this.isSellRunning$().subscribe(running => {
      localStorage.setItem('isSellRunning', JSON.stringify(running));
    });

    this.storage.getWatchDogs().then(wd => this.allWatchDogsSub.next(wd.map(o => new WatchDog(o))));
    // this.sellCoinsCtr = new AppSellCoin(storage, apiPrivates, apiPublics, this.allWatchDogsSub, marketCap);
    // this.addListeners();
    // this.start();
  }

  private allWatchDogsSub: BehaviorSubjectMy<WatchDog[]> = new BehaviorSubjectMy();
  private botsSub: BehaviorSubject<MarketBot[]> = new BehaviorSubject(null);
  //  private sellCoinsCtr: AppSellCoin;
  id = 'AppBotsService';
  private _isSellRunningSub: BehaviorSubject<boolean>;
  private _isBuyRunningSub: BehaviorSubject<boolean>;
  private sellInterval;
  private buyInterval;
  private MC: VOMCObj;
  private _history: any[];

  statusChangesTimeout;


  /* private addBotsToSell(wds: WatchDog[]) {
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
   }*/

  private seconds = 30;
  private seconsLeftSub: BehaviorSubject<number> = new BehaviorSubject<number>(30);

  private runInterval;

  async init() {
  /*  const botsIds: any[] = await this.storage.select('my-bots') || [];
    const bots = botsIds.map((o) => {
      return new MarketBot(
        o.exchange,
        o.market,
        100,
        this.storage,
        this.apiPrivates.getExchangeApi(o.exchange),
        this.apiPublics.getExchangeApi(o.exchange),
        this.candlesService
      );
    });

    this.botsSub.next(bots);
    bots.forEach(function (item) {
      item.start();
    });
    setInterval(() => this.saveBots(), 6e4);*/
  }

  addBot(exchange: string, market: string): MarketBot {
    const bots: MarketBot[] = this.botsSub.getValue();
    const excists = _.find(bots, {exchnge: exchange, market: market});
    if (excists) {
      console.warn(excists);
      return null;
    }
   /* const bot =  new MarketBot(
      exchange,
      market,
      100,
      this.storage,
      this.apiPrivates.getExchangeApi(exchange),
      this.apiPublics.getExchangeApi(exchange),
      this.candlesService
    );
    bots.push(bot);
    this.botsSub.next(bots);
    this.saveBots();
    return bot;
    */
  }

  saveBots() {
    const bots: MarketBot[] = this.botsSub.getValue();
    const botsIds = bots.map(function (o) {
      return {
        exchange: o.exchange,
        market: o.market
    };
    });
    this.storage.upsert('my-bots', botsIds);
  }

  async getHistory() {
    if (this._history) return Promise.resolve(this._history);
    return StorageService.instance.select(this.id + '-history').then(res => {
      if (!Array.isArray(res)) res = [];
      this._history = res;
      return this._history;
    });
  }

  async saveHistory(h?: any[]) {
    if (h) this._history = h;
    StorageService.instance.upsert(this.id + '-history', this._history);
  }

  async addHistoryMessage(msg: string) {
    const h = await this.getHistory();
    h.push({
      time: moment().format('HH:mm'),
      timestamp: moment().format(),
      message: msg
    });
    await this.saveHistory();
  }

 /* private addListeners() {
    WatchDog.statusChanges$().subscribe(watchDog => {
      const msg = moment().format('HH:mm') + ' status changed ' + watchDog.wdId + '  ' + watchDog.status;
      console.warn(msg);
      clearTimeout(this.statusChangesTimeout);

      this.statusChangesTimeout = setTimeout(() => {
        this.dispatchChange();
        this.save();
      }, 1000);
    });
  }*/

  private dispatchChange(wds?: WatchDog[]) {
    if (!wds) wds = this.allWatchDogsSub.getValue();
    this.allWatchDogsSub.next(wds);
  }

  resetAllWaitingState() {
    const wds = this.getAllBots();
    wds.forEach(function (item) {
      item.status = WatchDogStatus.WAITING;
    });
    this.dispatchChange();
  }

  async dryRun(action: string) {
    if (action === 'SELL') {
      WatchDog.isTest = true;
      const wds = this.getAllSellBots();
      /* const coinsDay = await this.marketCap.getCoinsDay();
       const promises = wds.map(function (item: WatchDog) {
         return item.run2(coinsDay);
       });*/

      WatchDog.isTest = false;
    }
  }

  allWatchDogs$(): Observable<WatchDog[]> {
    return this.allWatchDogsSub.asObservable();
  }

  save() {
    console.log('%c saving dogs ' + moment().format('mm:ss'), 'color:green');
    const wds: WatchDog[] = this.getAllBots();

    const wdsData: VOWatchdog[] = wds.map(function (item) {
      return item.toJSON();
    });
    this.storage.saveWatchDogs(wdsData);
  }

  deleteWatchDogById(id: string) {
    let allDogs = this.getAllBots();
    const wd = _.find(allDogs, {id: id});
    if (wd) wd.destroy();
    allDogs = _.reject(allDogs, {id: id});
    this.dispatchChange(allDogs);
    this.save();
  }

  async getWatchDogById(id: string): Promise<WatchDog> {
    const wds: WatchDog[] = this.getAllBots();
    return _.find(wds, {id: id});
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

  getAllBots() {
    return this.allWatchDogsSub.getValue();
  }

  getActiveSellBots() {
    return this.getAllSellBots().filter(function (item) {
      return item.isActive;
    });
  }

  getAllSellBots(): WatchDog[] {
    return this.getAllBots().filter(function (wd: WatchDog) {
      return wd.orderType === OrderType.SELL;
    });
  }

  getActiveBuyBots(): WatchDog[] {
    return this.getAllBuyBots().filter(function (item) {
      return item.isActive;
    });
  }

  getAllBuyBots(): WatchDog[] {
    return this.getAllBots().filter(function (wd: WatchDog) {
      return wd.orderType === OrderType.BUY;
    });
  }

  removeById(id: string) {
    const all = _.reject(this.getAllBots(), {id: id});
    this.allWatchDogsSub.next(all);
  }

  // TODO make one sell per exchange at the time

  /* checkStatusSelling() {
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
 */

  //////////////// start stop bots ////////////////////////
  async runBots() {
    const wds = this.allWatchDogsSub.getValue();
    console.log(' ALL ', wds);
    //  const MC = await this.marketCap.getTicker();

    // const coinsDay = await this.marketCap.getCoinsDay();

    /*
        const promises = wds.map(function (item: WatchDog) {
          return item.run2(coinsDay);
        });

      /!*  const promises = wds.map(function (item: WatchDog) {
          return item.run(MC[item.coin], MC[item.base]);
        });*!/
       const results = await Promise.all(promises);*/
    // console.log(results);
  }

  secondsLeft$() {
    return this.seconsLeftSub.asObservable();
  }

  start() {
    if (!this.runInterval) {
      this.runInterval = setInterval(() => {
        if (!this._isSellRunningSub.getValue() && !this._isBuyRunningSub.getValue()) {
          this.seconsLeftSub.next(this.seconds);
          return;
        }
        
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
    return this._isSellRunningSub.asObservable();
  }

  isBuyRunning$(): Observable<boolean> {
    return this._isBuyRunningSub.asObservable();
  }


}
