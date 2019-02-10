import {Injectable} from '@angular/core';
import * as moment from 'moment';

import {VOCandle} from '../../../models/api-models';

import {VOOrder} from '../../../models/app-models';
import * as _ from 'lodash';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {StorageService} from '../../services/app-storage.service';

import {MATH} from '../../com/math';
import {ApisPrivateService} from '../../apis/api-private/apis-private.service';
import {CandlesService} from '../candles/candles.service';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Subject} from 'rxjs/internal/Subject';
import {UsdtBtcBot} from '../app-bots-services/usdt-btc-bot';
import {MarketBalance} from '../app-bots-services/market-balance';
import {MarketOrders, OrdersState} from '../app-bots-services/market-orders';
import {StopLossOrder} from '../app-bots-services/stop-loss-order';
import {UTILS} from '../../com/utils';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';

export enum MarketState {
  STAY = 'STAY',
  GOING_DOWN = 'GOING_DOWN',
  GOING_UP = ' GOING_UP',
  DROPPING = 'DROPPING',
  JUMPING = 'JUMPING',
  RECOVERING = 'RECOVERING'
}


@Injectable()
export class BtcUsdtService {
  state$: BehaviorSubject<MarketState> = new BehaviorSubject(MarketState.STAY);
  apiPrivate: ApiPrivateAbstaract;

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService,
    private apisPrivate: ApisPrivateService,
    private candlesService: CandlesService
  ) {

    //this.bot = new UsdtBtcBot(marketCap, apisPrivate.getExchangeApi('binance'), candlesService);

    this.init().then(() => {
      this.start();
    });

  }

  alertSub: Subject<{ P: number, PD: number, VD: number, trades: any[] }> = new Subject();


  candlesSub: BehaviorSubject<VOCandle[]>;
  //  startTime = '2018-10-10T19:30';
  count = 0;
  candlesStats: any[] = [];


  trades: VOOrder[] = [];
  coin = 'BTC';
  base = 'USDT';
  market = 'USDT_BTC';

  exchange = 'binance';
  priceCoinUS: number;
  percentStopLoss = -2;

  private sub1;

  releaseAmountUS = 120;

  // bot: UsdtBtcBot;




  interval;

  lastcandlesStats: any;

  async start() {
    if(this.interval) throw new Error('double call');
    this.tick();
    this.interval = setInterval(() => {
      this.tick();
    }, 3 * 60000);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  get state() {
    return this.state$.getValue();
  }

  async init() {
    this.apiPrivate = this.apisPrivate.getExchangeApi(this.exchange);

    const MC = await this.marketCap.getTicker();
    const priceUS = MC['BTC'].price_usd;
    this.priceCoinUS = priceUS;
   /* this.balances = new MarketBalance(this.market, this.apisPrivate.getExchangeApi(this.exchange), this.storage, this.marketCap);
    await this.balances.init();
    this.marketOrders = new MarketOrders(this.market, this.apisPrivate.getExchangeApi(this.exchange), this.storage, priceUS);
    await this.marketOrders.init();
    this.stopLoss = new StopLossOrder(this.market, this.apisPrivate.getExchangeApi(this.exchange));
*/
    this.marketCap.ticker$().subscribe(MC => {
      if (!MC) return;
      this.priceCoinUS = MC['BTC'].price_usd;
    })

  }

  stop() {
    console.warn(this.market + ' STOP');
    clearInterval(this.interval);
  }

  lastPrice: number;
  reason: string;

  async tick() {

    let candles: VOCandle[] = await this.getCandles();

    const P = Math.round(_.last(candles).close);
    if (this.lastPrice === P) return;
    this.lastPrice = P;

    const last: VOCandle = _.last(candles);
    const volumes = _.map(candles, 'Volume');
    const medV = MATH.median(volumes);
    // const lastV = lasts[0].Volume > lasts[1].Volume ? lasts[0].Volume : lasts[1].Volume

    const mas = CandlesAnalys1.mas(candles);
    let state: MarketState = MarketState.STAY;
      const ma25_99 = MATH.percent(mas.ma25, mas.ma99);
    const ma3_25 = MATH.percent(mas.ma3, mas.ma25);
    const diff = ma3_25;

    if (diff > 0.5) {
      state = MarketState.JUMPING
    } else if (diff < -0.6) {
      state = MarketState.DROPPING
    } else if (diff > 0.2) {
      state = MarketState.GOING_UP
    } else if (diff < -0.3) {
      state = MarketState.GOING_DOWN
    }

    const prevState = this.state$.getValue();

    if (state !== prevState) {

      this.state$.next(state);
    }

    this.reason = moment().format('HH:mm') + ' ma3_25 ' + diff + '  ma25_99 ' +  ma25_99;
    console.log('%c ' + this.reason + ' ' + state, 'color:green');
    const VD = MATH.percent(last.Volume, medV);
    const PD = MATH.percent(last.close, last.open);
    if (Math.abs(PD) > 0.3 || VD > 1000) {
      const trades = await this.getTopTrades();
      this.alert({P, PD, VD, trades})
    }

   // const BTC_US = this.balances.balanceUS;
   // const BTC_US_avai = this.balances.availableUS;
   // const extraUS = BTC_US_avai - this.releaseAmountUS;

   // if (extraUS > 10) {

     // console.log('extra ' + extraUS);

   /*   if (this.marketOrders.state === OrdersState.STOP_LOSS) {
        const canselResult = await this.marketOrders.cancelSellOrders();
        this.apiPrivate.refreshAllOpenOrders();
        await UTILS.wait(10);
      }
      let lastPrice = last.close < mas.ma25 ? last.close : mas.ma25;
      let qty = +((BTC_US - this.releaseAmountUS) / this.priceCoinUS).toFixed(8);
      console.warn(lastPrice, qty);
*/
     // this.stopLoss.setStopLoss(lastPrice, qty)

   // }
   // console.log('BTC US ' + BTC_US);


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
    console.log('GET CANDLES ');
    this.count++;
    let candles;
    let oldcandles: VOCandle[] = (await this.storage.select('USDT_BTC-candles'));
    if (oldcandles) {
      let diff = moment().diff(_.last(oldcandles).to, 'minutes');
      if (diff > 15) {
        candles = await this.apisPublic.getExchangeApi('bitfinex')
          .downloadCandles('USDT_BTC', '5m', 100);
      } else {

        const newcandles: VOCandle[] = await this.apisPublic.getExchangeApi('bitfinex')
          .downloadCandles('USDT_BTC', '5m', 3);
        newcandles.forEach(function (o) {
          o.time = moment(o.to).format('HH:mm');
        });

        const t = newcandles[0].to;
        oldcandles = oldcandles.filter(function (o) {
          return o.to < t;
        });
        candles = _.takeRight(oldcandles.concat(newcandles), 100);
      }

    } else {
      candles = await this.apisPublic.getExchangeApi('bitfinex')
        .downloadCandles('USDT_BTC', '5m', 100);
    }
    // console.log(candles.length);
    await this.storage.upsert('USDT_BTC-candles', candles);
    return candles;
  }


  stopFollow() {

    //this.bot.stopFollow();
  }
}
