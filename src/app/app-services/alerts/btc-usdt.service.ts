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

@Injectable()
export class BtcUsdtService {

  alertSub: Subject<string> = new Subject();


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

  balanceCoin: VOBalance;
  balanceBase: VOBalance;
  priceCounUS: number;
  percentStopLoss = -2;

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService,
    private apisPrivate: ApisPrivateService,
    private candlesService: CandlesService
  ) {

  }

  async start() {
    this.init();
    await this.candles$();
    this.interval = setInterval(() => {
      this.next()
    }, 5 * 60000);

    //console.log('SATART')
    this.subscribeForBalances();
    this.startFollow();
  }

  private sub1;

  async subscribeForBalances() {
    // return new Promise((resolve, reject) =>{
    const MC: VOMCObj = await this.marketCap.getTicker();
    this.priceCounUS = MC[this.coin] ? MC[this.coin].price_usd : 1;
    const apiPrivate = this.apisPrivate.getExchangeApi(this.exchange);
    this.sub1 = apiPrivate.balances$().subscribe(balances => {
      if (!balances) return;
      this.balanceBase = _.find(balances, {symbol: this.base});
      this.balanceCoin = _.find(balances, {symbol: this.coin});
    });

  }

  async cancelOrder(order: VOOrder) {
    if (!order) {
      console.warn(' no order to cancel ' + this.market);
      return
    }
    const uuid = order.uuid;
    console.log(' canceling order ', order);
    const apiPrivate = this.apisPrivate.getExchangeApi(this.exchange);
    let result;
    try {
      result = await apiPrivate.cancelOrder(uuid, this.base, this.coin).toPromise();
    } catch (e) {
      console.log(this);
      console.error(e);
    }
  }

  releaseAmountUS = 120;
  async releaseAmount(amountUS: number) {
    this.releaseAmountUS = amountUS;
    const available = this.balanceCoin.available * this.priceCounUS;
    if (available < amountUS) this.cancelOrder(this.stopLossOrder);

  }

  lastCheck;
  async tick() {
    if (!this.balanceCoin || !this.balanceBase) {
      console.log('balances not ready ' + this.market)
      return;
    }
    const now = Date.now();
    if (now - this.lastCheck < 500) {
      console.log(' TOO FAST tick ' + this.market);
      return
    }
    this.lastCheck = now;

    if (!this.stopLossOrder) {
      await this.setStopLoss();
      return;
    }

    const availableUS = this.balanceCoin.available * this.priceCounUS;
    const diff = availableUS - this.releaseAmountUS;
    // console.log(diff);
    if(diff < -20 || diff > 20){
      this.lastMessage = this.market + ' CANCELING STOP LOSS BECAUSE DIFF  '+ diff;
      console.log(this.lastMessage);
      this.cancelOrder(this.stopLossOrder);
      this.stopLossOrder = null;
      return;
    }

    const candles = await this.getCandles();
    const lasts = _.takeRight(candles, 24);
    const meds = CandlesAnalys1.meds(lasts);
    const currentPrice = MATH.median(meds);
    const diffPrice = MATH.percent(this.stopLossOrder.stopPrice, currentPrice);
    this.lastMessage = this.market + '  ' + diffPrice;
    FollowOpenOrder.status.next(this.lastMessage);

  }

  checkInterval;

  startFollow() {
    if (this.checkInterval) return;
    this.lastMessage = ' Start following ' + this.market;
    FollowOpenOrder.status.next(this.lastMessage);
    this.checkInterval = setInterval(() => this.tick(), moment.duration(1, 'minutes'));
  }

  getMeanPrice(candles: VOCandle[]) {
    const last5 = _.takeRight(candles, 25);
    const lasts = _.map(last5, 'close');
    return _.mean(lasts);
  }

  async getCandles() {
    return this.candlesService.getCandles(this.market);
  }

  lastQuery;
  stopLossOrder: VOOrder;
  lastMessage: string;

  async setStopLoss() {
    if (Date.now() - this.lastQuery < 10000) {
      throw new Error(' query fast ' + (Date.now() - this.lastQuery));
    }
    this.lastQuery = Date.now();

    const openOrders = this.apisPrivate.getExchangeApi(this.exchange).getAllOpenOrders();

    if (!Array.isArray(openOrders)) {
      console.warn(' open orders not ready ');
      return
    }
    if (openOrders) {
      const myOrder = _.find(openOrders, {coin: this.coin});
      if (myOrder) {
        if (myOrder.action === 'BUY') {

        } else if (myOrder.action === 'SELL') {
          if (myOrder.stopPrice) this.stopLossOrder = myOrder;
        }
        console.log(' ORDER IN PROGRESS ', myOrder);
        return;
      }
    }

    const candles = await this.getCandles();
    const currentPrice = _.last(candles).close;
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const market = this.market;

    const balanceUS = this.balanceCoin.available * this.priceCounUS;
    const availableUS = balanceUS - this.releaseAmountUS;

    console.log('balanceUS, availableUS', balanceUS, availableUS);

    if (availableUS < 20) {
      console.log(' nothing to stop LOSS ' + availableUS)
      return;
    }

    const qty = availableUS / this.priceCounUS;
    const stopPrice = currentPrice + (currentPrice * this.percentStopLoss / 100);
    const sellPrice = stopPrice + (stopPrice * -0.001);

    this.lastMessage = 'SETTING new Order ' + this.market + ' ' + stopPrice + '  ' + qty;

    console.log(' SET STOP LOSS ' + market, currentPrice, stopPrice, sellPrice);

    try {
      const order = await api.stopLoss(market, qty, stopPrice, sellPrice);
      console.log('result STOP LOSS order', order);
      if (order && order.uuid) setTimeout(() => {
         api.refreshBalances();
         api.refreshAllOpenOrders();
        if (order.stopPrice) this.stopLossOrder = order;
      }, 5e3);

    } catch (e) {
      if (e.error.msg.indexOf('immediately') !== -1) {
        this.percentStopLoss *= 2;
        //const sellPrice = currentPrice + (currentPrice * this.percentStopLoss / 100);
        //  this.sellCoin(100, sellPrice);
      }
      console.error(e);
      if (e.toString().indexOf('no formatter') !== -1) {
        const books: VOBooks = await this.apisPublic.getExchangeApi(this.exchange).downloadBooks(this.base, this.coin).toPromise();
      }
      console.error(e);
    }

  }







  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  init() {
    this.marketCap.ticker$().subscribe(MC => {
      MC['BTC']['time'] = moment(MC['BTC'].last_updated * 1000).format('LT')
      this.btcMC$.next(MC['BTC']);
      this.usdtMC$.next(MC['USDT']);
    });

    this.storage.select('trades-stats-bitfinex-usdt_btc').then(stats => {
      this.tradesStats = stats || [];
    });
  }

  stop() {
    clearInterval(this.interval);
  }

  interval;

  async candles$(): Promise<Observable<VOCandle[]>> {
    if (this.candlesSub) return this.candlesSub;
    const candles = await this.apisPublic
      .getExchangeApi('bitfinex').downloadCandles('USDT_BTC', '5m', 100);//, moment().valueOf());
    this.candlesSub = new BehaviorSubject(candles);
    return this.candlesSub;
  }

  lastcandlesStats: any;

  async next() {
    //const trades: VOOrder[] = await this.downlaodTrades();
    let candles: VOCandle[] = await this.downloadNewCandles();
    if (_.last(candles).Volume < candles[candles.length - 2].Volume)
      candles = candles.slice(0, -1);
    const last3: VOCandle[] = _.takeRight(candles, 3);

    const volumes = _.map(candles, 'Volume');
    const medV = MATH.median(volumes);

    const lastV = (last3[0].Volume + last3[1].Volume + last3[2].Volume) / 3;

    const PV3 = MATH.percent(lastV, medV);

    if (this.lastcandlesStats === PV3) return;
    this.lastcandlesStats = PV3;
    const startPrice = last3[0].open;
    const endPrice = last3[2].close;
    const PD3 = MATH.percent(endPrice, startPrice);

    if (PD3 < -0.3) {
      this.alertSub.next(' BTC ' + PD3 + '% ' + 'V: ' + PV3 + '% ' + await this.getTopTrades());
    }
    else if (PV3 > 1000) {
      this.alertSub.next(' BTC ' + PD3 + '% ' + 'V: ' + PV3 + '% ' + await this.getTopTrades());
    }

    this.candlesStats.push({PV3, PD3});
    if (this.candlesStats.length > 200) this.candlesStats.shift();
    this.storage.upsert('candlesStats', this.candlesStats);

    if (this.tradesStats.length > 200) this.tradesStats.shift();
    this.storage.upsert('test-trades', this.tradesStats);

    //  console.log('PD3 ' + PD3 + ' PV3  ' + PV3);


    //console.log(trades, candles);
  }

  async getTopTrades() {
    const trades: VOOrder[] = await this.downlaodTrades();
    const sorted = _.orderBy(trades, 'amountCoin').reverse();
    return _.take(sorted, 5).map(function (o) {
      return o.action + ':' + Math.round(o.amountCoin)
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
    return Promise.resolve(this.candlesSub.getValue())
  }

  async downloadNewCandles() {
    this.count++;
    let oldcandles: VOCandle[] = await this.getMinuteCandles();
    const newcandles: VOCandle[] = await this.apisPublic.getExchangeApi('bitfinex')
      .downloadCandles('USDT_BTC', '5m', 5);//, moment(this.startTime).add(this.count, 'minutes').valueOf());

    //console.log(newcandles);
    newcandles.forEach(function (o) {
      o.time = moment(o.to).format('HH:mm');
    });
    const t = newcandles[0].to;
    // console.log(oldcandles.length);
    oldcandles = oldcandles.filter(function (o) {
      return o.to < t;
    });
    //  console.log(oldcandles.length);

    const candles = _.takeRight(oldcandles.concat(newcandles), 100);
    // console.log(candles.length);
    this.candlesSub.next(candles);
    return candles;
  }


}
