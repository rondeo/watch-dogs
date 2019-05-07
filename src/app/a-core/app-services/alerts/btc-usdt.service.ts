import {Injectable} from '@angular/core';
import * as moment from 'moment';

import {VOCandle} from '../../../amodels/api-models';

import {VOOrder} from '../../../amodels/app-models';
import * as _ from 'lodash';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {StorageService} from '../../services/app-storage.service';

import {MATH} from '../../../acom/math';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Subject} from 'rxjs/internal/Subject';

import {MarketBalance} from '../app-bots-services/market-balance';
import {MarketOrders, OrdersState} from '../app-bots-services/market-orders';
import {StopLossOrder} from '../app-bots-services/stop-loss-order';
import {UTILS} from '../../../acom/utils';


export enum MarketState {
  STAY = 'STAY',
  GOING_DOWN = 'GOING_DOWN',
  GOING_UP = ' GOING_UP',
  DROPPING = 'DROPPING',
  CRASHING = 'CRASHING',
  JUMPING = 'JUMPING',
  RECOVERING = 'RECOVERING'
}


@Injectable()
export class BtcUsdtService {
  state$: BehaviorSubject<MarketState> = new BehaviorSubject(MarketState.STAY);

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService
  ) {

    this.start().then(() => {
      this.candlesSub$.subscribe(candles => {
        this.tick(candles);
      })
    });
  }

  alertSub$: Subject<{ P: number, PD: number, VD: number, trades: any[] }> = new Subject();
  candlesSub$: BehaviorSubject<VOCandle[]> = new BehaviorSubject(null);
  count = 0;
  trades: VOOrder[] = [];
  private sub1;
  lastPrice: number;
  reason: string;
  interval;

  async start() {
    if (this.interval) throw new Error('double call');
    let candles = await this.getCandles();
    this.candlesSub$.next(candles);
    this.interval = setInterval(() => {
      this.updateCandles();
    }, 5 * 60000);
  }


  updateCandles() {
    const oldCandle = _.last(this.candlesSub$.getValue());
    this.getCandles().then(newCandles => {
      const newCandle = _.last(newCandles);
      if (oldCandle.to < newCandle.to) this.candlesSub$.next(newCandles);
      else setTimeout(() => this.updateCandles(), 6e4);
    })
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  get state() {
    return this.state$.getValue();
  }

  stop() {
    clearInterval(this.interval);
  }

  async tick(candles: VOCandle[]) {

    const P = Math.round(_.last(candles).close);
    if (this.lastPrice === P) return ' SAME price';
    this.lastPrice = P;

    const last: VOCandle = _.last(candles);
    const volumes = _.map(candles, 'Volume');
    const medV = MATH.median(volumes);
    const closes = CandlesAnalys1.closes(candles);

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

    const PD = MATH.percent(last.close, last.open);

    this.reason = ' ' + state + ' 5m OC: ' + PD + ' ma3_25 ' + diff + '  ma25_99 ' + ma25_99;
    const VD = MATH.percent(last.Volume, medV);

    if (Math.abs(PD) > 0.3 || VD > 1000) {
      const trades = await this.getTopTrades();
      this.alert({P, PD, VD, trades})
    }
    console.log('%c ' + this.reason, 'color:green');
    return this.reason;
  }

  async alert(data) {
    this.alertSub$.next(data);
    const alerts: any[] = (await this.storage.select('USDT_BTC-alerts')) || [];
    if (alerts.length > 100) alerts.pop();
    const date = moment().format('DD HH:mm');
    alerts.unshift(Object.assign({date}, data));
    this.storage.upsert('USDT_BTC-alerts', alerts);
  }

  async getTopTrades() {
    const trades: VOOrder[] = await this.downloadTrades();
    const sorted = _.orderBy(trades, 'amountCoin').reverse();
    return _.take(sorted, 5).map(function (o) {
      return o.orderType + ':' + Math.round(o.amountCoin);
    }).join(', ');
  }

  async downloadTrades() {
    const trades: VOOrder[] = await this.apisPublic.getExchangeApi('bitfinex')
      .downloadMarketHistory('USDT', 'BTC').toPromise();
    /* const from = trades[0].timestamp;
     const oldTrades = this.trades.filter(function (o) {
       return o.timestamp < from;
     });
     this.trades = _.takeRight(oldTrades.concat(trades), 500);*/
    return trades;
  }

  async getCandles() {
    this.count++;
    let candles: VOCandle[];
    let oldCandles: VOCandle[] = (await this.storage.select('USDT_BTC-candles'));

    let limit = 100;
    if (oldCandles) {
      let diff = moment().diff(_.last(oldCandles).to, 'minutes');
      if (diff < 5) return oldCandles;
      limit = Math.ceil(diff / 5);
      limit++;
      if (limit > 100) limit = 100;

      candles = await this.apisPublic.getExchangeApi('bitfinex')
        .downloadCandles('USDT_BTC', '5m', limit);

      const t = candles[0].to;
      oldCandles = oldCandles.filter(function (o) {
        return o.to < t;
      });
      candles = oldCandles.concat(candles);
    } else {
      candles = await this.apisPublic.getExchangeApi('bitfinex')
        .downloadCandles('USDT_BTC', '5m', limit);
    }

    console.log(' usdt-btc downloaded ' + limit + ' last ' + moment(_.last(candles).to).format('HH:mm'));
    await this.storage.upsert('USDT_BTC-candles', _.takeRight(candles, 120));
    return candles;
  }
}
