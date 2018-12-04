import {Injectable} from '@angular/core';
import * as moment from 'moment';

import {VOCandle, VOMCObj} from '../../models/api-models';

import {VOAlert, VOBalance, VOBooks, VOMarketCap, VOOrder} from '../../models/app-models';
import * as _ from 'lodash';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {StorageService} from '../../services/app-storage.service';

import {MATH} from '../../com/math';
import {ApisPrivateService} from '../../apis/api-private/apis-private.service';
import {CandlesService} from '../candles/candles.service';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import {FollowOpenOrder} from '../../apis/open-orders/follow-open-order';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Subject} from 'rxjs/internal/Subject';
import {Observable} from 'rxjs/internal/Observable';
import {UsdtBtcBot} from '../app-bots-services/usdt-btc-bot';

@Injectable()
export class BtcUsdtService {

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService,
    private apisPrivate: ApisPrivateService,
    private candlesService: CandlesService
  ) {

    this.bot = new UsdtBtcBot(marketCap, apisPrivate.getExchangeApi('binance'), candlesService);
    this.bot.start();
  }

  alertSub: Subject<{P:number, PD: number, VD: number, trades: any[] }> = new Subject();


  candlesSub: BehaviorSubject<VOCandle[]>;
  btcMC$: BehaviorSubject<VOMarketCap> = new BehaviorSubject(new VOMarketCap());
  usdtMC$: BehaviorSubject<VOMarketCap> = new BehaviorSubject(new VOMarketCap());

  //  startTime = '2018-10-10T19:30';
  count = 0;
  candlesStats: any[] = [];
  tradesStats: any[] = [];

  trades: VOOrder[] = [];
  coin = 'BTC';
  base = 'USDT';
  market = 'USDT_BTC';

  exchange = 'binance';
  priceCounUS: number;
  percentStopLoss = -2;

  private sub1;

  releaseAmountUS = 120;

  bot: UsdtBtcBot;

  interval;

  lastcandlesStats: any;


  async start() {
    this.init();
    this.interval = setInterval(() => {
      this.next();
    }, 60000);
    console.log('START USDT_BTC');

  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  init() {
    this.marketCap.ticker$().subscribe(MC => {
      if (!MC) return;
      MC['BTC']['time'] = moment(MC['BTC'].last_updated * 1000).format('LT');
      this.btcMC$.next(MC['BTC']);
      this.usdtMC$.next(MC['USDT']);
    });

    this.storage.select('trades-stats-bitfinex-usdt_btc').then(stats => {
      this.tradesStats = stats || [];
    });
  }

  stop() {
    console.warn(this.market + ' STOP');
    clearInterval(this.interval);
  }

  lastPrice: number;
  async next() {
    let candles: VOCandle[] = await this.getCandles();
    const P = Math.round(_.last(candles).close);
    if (this.lastPrice === P) return;
    this.lastPrice = P;
    const lasts: VOCandle[] = _.takeRight(candles, 2);
    const volumes = _.map(candles, 'Volume');
    const medV = MATH.median(volumes);
    const lastV = lasts[0].Volume > lasts[1].Volume ? lasts[0].Volume : lasts[1].Volume;
    const VD = MATH.percent(lastV, medV);
    const startPrice = lasts[0].open;
    const endPrice = lasts[1].close;
    const PD = MATH.percent(endPrice, startPrice);
    if (PD < -0.3 || VD > 1000) {
      const trades = await this.getTopTrades();
      this.alert({P, PD, VD, trades})
    }

  }

  async alert(data) {
    this.alertSub.next(data);
    const alerts: any[] = (await this.storage.select('USDT_BTC-alerts')) || [];
    if (alerts.length > 100) alerts.pop();
    const date = moment().format('DD HH:mm');
    alerts.unshift(Object.assign({date}, data));
    this.storage.upsert('USDT_BTC-alerts', alerts);
  }

  async getTopTrades() {
    const trades: VOOrder[] = await this.downlaodTrades();
    const sorted = _.orderBy(trades, 'amountCoin').reverse();
    return _.take(sorted, 5).map(function (o) {
      return o.action + ':' + Math.round(o.amountCoin);
    }).join(', ');
  }

  async downlaodTrades() {
    const trades: VOOrder[] = await this.apisPublic.getExchangeApi('bitfinex')
      .downloadMarketHistory('USDT', 'BTC').toPromise();
    /* const from = trades[0].timestamp;
     const oldTrades = this.trades.filter(function (o) {
       return o.timestamp < from;
     });
     this.trades = _.takeRight(oldTrades.concat(trades), 500);*/
    return trades;
  }

  async getMinuteCandles(): Promise<VOCandle[]> {
    return Promise.resolve(this.candlesSub.getValue());
  }


  async getCandles() {
    this.count++;
    let candles;
    let oldcandles: VOCandle[] = (await this.storage.select('USDT_BTC-candles'));
    if (oldcandles) {
      const newcandles: VOCandle[] = await this.apisPublic.getExchangeApi('bitfinex')
        .downloadCandles('USDT_BTC', '5m', 5);

      newcandles.forEach(function (o) {
        o.time = moment(o.to).format('HH:mm');
      });
      const t = newcandles[0].to;
      oldcandles = oldcandles.filter(function (o) {
        return o.to < t;
      });

      candles = _.takeRight(oldcandles.concat(newcandles), 100);

    } else {
      candles = await this.apisPublic.getExchangeApi('bitfinex')
        .downloadCandles('USDT_BTC', '5m', 100);
    }
    // console.log(candles.length);
    await this.storage.upsert('USDT_BTC-candles', candles);
    return candles;
  }


  stopFollow() {
    this.bot.stopFollow();
  }
}
