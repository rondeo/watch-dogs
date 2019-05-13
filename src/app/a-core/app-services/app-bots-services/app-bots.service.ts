import {Injectable} from '@angular/core';
import {StorageService} from '../../services/app-storage.service';
import {VOWatchdog, WDType} from '../../../amodels/app-models';
import {ApisPrivateService} from '../../apis/api-private/apis-private.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import {VOMCObj} from '../../../amodels/api-models';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {MarketBot} from './market-bot';
import {CandlesService} from '../candles/candles.service';
import {BehaviorSubject} from 'rxjs';
import {UsdtBtcMarket} from './usdt-btc-market';
import {BtcUsdtService} from '../alerts/btc-usdt.service';
import {BotBase} from './bot-base';
import {Subject} from 'rxjs/internal/Subject';


@Injectable()
export class AppBotsService {


  errors$: Subject<string> = new Subject()
  MC: VOMCObj;
  get orders$() {
    return this.bots$;
  }

  get usdtbtc$(): BehaviorSubject<UsdtBtcMarket[]> {
    return this.usdtbtcSub;
  }


  private usdtbtcSub: BehaviorSubject<UsdtBtcMarket[]>;
  private bots$: BehaviorSubject<MarketBot[]> = new BehaviorSubject(null);
  private runInterval;

  constructor(
    private storage: StorageService,
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private candlesService: CandlesService,
    private btcusdt: BtcUsdtService
  ) {

    marketCap.getTicker().then(MC => {
      if(!MC) return;
      this.MC = MC;
      this.initBots();
    });

   const exchanges = apisPrivate.getAllAvailable();
   const usdts: UsdtBtcMarket[] = exchanges.map(function (item) {
     return new UsdtBtcMarket(item, apisPublic, apisPrivate, marketCap);
   });
   this.usdtbtcSub = new BehaviorSubject(usdts);
  }


  private initBots() {
    const MC = this.MC;
    const potSizeUS = BotBase.potSizeUS;

    this.storage.select('bots')
      .then(wd => this.bots$.next(wd.map((o: VOWatchdog )=> {
        const coin = o.market.split('_')[1];
        const potSize = potSizeUS / MC[coin].price_usd;
        const bot = new MarketBot(
          o.exchange,
          o.market,
          potSize,
          this.storage,
          this.apisPrivate.getExchangeApi(o.exchange),
          this.apisPublic.getExchangeApi(o.exchange),
          this.candlesService,
          this.marketCap,
          this.btcusdt
        );
        bot.error$.subscribe(err => this.errors$.next(err));
        return bot;
      })));
  }

  getBot(exchange: string, market: string): MarketBot {
    const bots: MarketBot[] = this.bots$.getValue();

    let bot: MarketBot = bots.find(function (item) {
      return item.exchange === exchange && item.market === market;
    });
    if (!bot) {
      const MC = this.MC;
      const potSizeUS = BotBase.potSizeUS;
      const coin = market.split('_')[1];
      const potSize = potSizeUS / MC[coin].price_usd;
      bot = new MarketBot(
        exchange,
        market,
        potSize,
        this.storage,
        this.apisPrivate.getExchangeApi(exchange),
        this.apisPublic.getExchangeApi(exchange),
        this.candlesService,
        this.marketCap,
        this.btcusdt
        );
      bot.error$.subscribe(error => {
        this.errors$.next(error);
      })
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
    const wds: MarketBot[] = this.getBots();
    const wdsData: VOWatchdog[] = wds.map(function (item) {
      return item.toJSON();
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

  getBotById(id: string): MarketBot{
    const wds: MarketBot[] = this.getBots();
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

  deleteBot(bot: MarketBot) {
    let bots = this.getBots().filter(function (item) {
      return item.id !== bot.id
    });
    bot.destroy();
    this.bots$.next(bots);
    this.save();
  }
}
