import {Injectable} from '@angular/core';
import {StorageService} from '../a-core/services/app-storage.service';
import {VOWatchdog, WDType} from '../amodels/app-models';
import {ApisPrivateService} from '../a-core/apis/api-private/apis-private.service';
import {ApisPublicService} from '../a-core/apis/api-public/apis-public.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import {VOMCObj} from '../amodels/api-models';
import {ApiMarketCapService} from '../a-core/apis/api-market-cap.service';

import {CandlesService} from '../a-core/app-services/candles/candles.service';
import {BehaviorSubject} from 'rxjs';
import {UsdtBtcMarket} from './usdt-btc-market';
import {BtcUsdtService} from '../a-core/app-services/alerts/btc-usdt.service';
import {BotBase, BotState} from './bot-base';
import {Subject} from 'rxjs/internal/Subject';
import {createSelector, select, Store} from '@ngrx/store';
import {AppState} from '../app-store/reducers';
import {AppBotsDownloadBalances, AppBotsLoaded, LoadAppBots} from './actions/app-bots.actions';
import {connectableObservableDescriptor} from 'rxjs/internal/observable/ConnectableObservable';


@Injectable()
export class AppBotsService {


  errors$: Subject<string> = new Subject();
  MC: VOMCObj;

  get orders$() {
    return this.bots$;
  }

  get usdtbtc$(): BehaviorSubject<UsdtBtcMarket[]> {
    return this.usdtbtcSub;
  }


  private usdtbtcSub: BehaviorSubject<UsdtBtcMarket[]>;
  private bots$: BehaviorSubject<BotBase[]> = new BehaviorSubject(null);
  private runInterval;

  constructor(
    private store: Store<AppState>,
    private storage: StorageService,
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private candlesService: CandlesService,
    private btcusdt: BtcUsdtService
  ) {

    marketCap.getTicker().then(MC => {
      if (!MC) return;
      this.MC = MC;
      this.initBots();

      /* this.store.pipe(select((viewState) => {
         console.warn(viewState);
         return viewState;
       })).subscribe(console.log);
 */
    });

    const exchanges = apisPrivate.exchanges$.getValue();
    const usdts: UsdtBtcMarket[] = exchanges.map(function (item) {
      return new UsdtBtcMarket(item, apisPublic, apisPrivate, marketCap);
    });
    this.usdtbtcSub = new BehaviorSubject(usdts);

    /*
       const sub = this.bots$.subscribe(bots =>{
         if(bots) {
           this.store.dispatch(new AppBotsLoaded(bots));
           sub.unsubscribe();
          //  this.store.dispatch(new AppBotsDownloadBalances());

         }
       })*/
  }


  private initBots() {
    const MC = this.MC;
    const potSizeUS = BotBase.potSizeUS;

    this.storage.select('bots')
      .then(wd => this.bots$.next(wd.map((o: VOWatchdog) => {
        const coin = o.market.split('_')[1];
        o.potSize = potSizeUS / MC[coin].price_usd;
        const bot = new BotBase(
          new VOWatchdog(o),
          this.apisPrivate.getExchangeApi(o.exchange),
          this.apisPublic.getExchangeApi(o.exchange),
          this.store,
          this.candlesService,
          this.storage,
          this.marketCap,
          this.btcusdt
        );
        bot.error$.subscribe(err => this.errors$.next(err));
        return bot;
      })));
  }

  createBot(exchange: string, market: string): BotBase {
    const bots: BotBase[] = this.bots$.getValue();

    let bot: BotBase = bots.find(function (item) {
      return item.config.exchange === exchange && item.config.market === market;
    });

    if (!bot) {
      const MC = this.MC;
      const potSizeUS = BotBase.potSizeUS;
      const coin = market.split('_')[1];
      const potSize = potSizeUS / MC[coin].price_usd;
      const wd = new VOWatchdog({exchange, market, potSize});
      bot = new BotBase(
        wd,
        this.apisPrivate.getExchangeApi(exchange),
        this.apisPublic.getExchangeApi(exchange),
        this.store,
        this.candlesService,
        this.storage,
        this.marketCap,
        this.btcusdt
      );
      bot.error$.subscribe(error => {
        this.errors$.next(error);
      });
      bots.push(bot);
      this.save();
    }
    return bot;
  }

  /*saveBots() {
    const bots: MarketBot[] = this.botsSub.getValue();
    const botsIds = bots.map(function (o) {
      return {
        exchange: o.exchange,
        market: o.market
    };
    });
    this.storage.upsert('my-bots', botsIds);
  }*/

  /* private addListeners() {
     MarketOrderModel.statusChanges$().subscribe(watchDog => {
       const msg = moment().format('HH:mm') + ' status changed ' + watchDog.wdId + '  ' + watchDog.status;
       console.warn(msg);
       clearTimeout(this.statusChangesTimeout);

       this.statusChangesTimeout = setTimeout(() => {
         this.dispatchChange();
         this.save();
       }, 1000);
     });
   }*/

  /*
    private dispatchChange(wds?: MarketOrderModel[]) {
      if (!wds) wds = this.allWatchDogsSub.getValue();
      this.allWatchDogsSub.next(wds);
    }
  */


  /* allWatchDogs$(): Observable<MarketOrderModel[]> {
     return this.allWatchDogsSub.asObservable();
   }
 */
  save() {
    console.log('%c saving dogs ' + moment().format('mm:ss'), 'color:green');
    const wds: BotBase[] = this.getBots();
    const wdsData: VOWatchdog[] = wds.map(function (item) {
      return item.config;
    });
    this.storage.upsert('bots', wdsData)
  }

  deleteOrderModelId(id: string) {
    let allDogs = this.getBots();
    const wd = _.find(allDogs, {id: id});
    if (wd) wd.destroy();
    allDogs = _.reject(allDogs, {id: id});
    this.bots$.next(allDogs);
    this.save();
  }

  getBotById(id: string): BotBase {
    const wds: BotBase[] = this.getBots();
    return wds.find(function (item) {
      return item.id === id;
    })
  }

  private getBots() {
    return this.bots$.getValue();
  }

  start() {

  }

  stop() {
    clearInterval(this.runInterval);
    this.runInterval = 0;
  }

  deleteBot(bot: BotBase) {
    let bots = this.getBots().filter(function (item) {
      return item.id !== bot.id
    });
    bot.destroy();
    this.bots$.next(bots);
    this.save();
  }


}
