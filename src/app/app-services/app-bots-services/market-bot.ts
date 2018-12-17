import {StorageService} from '../../services/app-storage.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import * as _ from 'lodash';
import {VOMarketCap, VOOrder} from '../../models/app-models';
import {CandlesService} from '../candles/candles.service';
import {MATH} from '../../com/math';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import * as moment from 'moment';
import {UtilsBooks} from '../../com/utils-books';
import {StopLossOrder} from './stop-loss-order';
import {ResistanceSupportController} from './resistance-support-controller';
import {noop} from 'rxjs/internal-compatibility';
import {map} from 'rxjs/operators';
import {BuySellState, MacdSignal} from './macd-signal';
import {BtcUsdtService, MarketState} from '../alerts/btc-usdt.service';
import {BalanceState, MarketBalance} from './market-balance';
import {MarketOrders} from './market-orders';


export enum RankState {
  NONE = 'NONE',
  GREEN = 'GREEN',
  RED = 'RED'
}

/*
export enum BotState {
  NONE = 'NONE',
  BUYING = 'BUYING',
  SELLING = 'SELLING',
  BOUGHT = 'BOUGHT',
  SOLD = 'SOLD',
  TO_USDT = 'TO_USDT',
  NO_BASE = 'NO_BASE',
  BALANCE_2 = 'BALANCE_2',
  BUYING_SELLING = 'BUYING_SELLING',
  IN_STOP_LOSS = 'IN_STOP_LOSS'
}
*/


export class MarketBot {
  resistanceSupport: ResistanceSupportController;
  rankSate: RankState = null;
  ordersHistory: VOOrder[];

  // state$: BehaviorSubject<BotState> = new BehaviorSubject(BotState.NONE);

  constructor(
    public exchange: string,
    public market: string,
    public reason: string,
    public amountCoinUS: number,
    public isLive: boolean,
    private storage: StorageService,
    private apiPrivate: ApiPrivateAbstaract,
    private apiPublic: ApiPublicAbstract,
    private candlesService: CandlesService,
    private marketCap: ApiMarketCapService,
    private btcusdt: BtcUsdtService
  ) {
    this.id = 'bot-' + exchange + market;
    this.init().then(() => {
      this.start();
    });

    //  this.stopLossOrder = new StopLossOrder(market, apiPrivate);
  }

  base: string;
  coin: string;
  balance: MarketBalance;
  orders: MarketOrders;
  macdSignal: MacdSignal;

  mcCoin: VOMarketCap;
  mcBase: VOMarketCap;

  logs: any[] = [];
  id: string;
  private stopLossOrder: StopLossOrder;

  patterns: any[] = [];
  lastOrder: { stamp: number, action: string, price: number };
  prevPrice: number;
  interval;
  sub1;
  sub2;
  timeout;


  //macdSate: BuySellState;
  //usdtbtcState: MarketState;

  async sellCoinInstant(reason: string = null) {
    if (reason) this.log({action: 'SELL', reason});

    if (this.balance.balanceUS > 10) await this.orders.cancelAllOrders();

    const qty = this.balance.balance;

    try {
      const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
      const rate = UtilsBooks.getRateForAmountCoin(books.buy, qty);
      this.log({action: 'SELLING', reason: ' rate' + rate});
      const sellResult = await this.apiPrivate.sellLimit2(this.market, qty, rate);
      this.log({action: 'SELL ORDER INSTANT ', reason: JSON.stringify(sellResult)});

    } catch (e) {
      this.log({action: 'ERROR', reason: 'download books and buy coin  ' + e.toString()});
    }
    // this.state$.next(BotState.SOLD);
  }

  getAmountCoin() {
    if (!this.mcCoin) {
      console.warn(' no MC data');
      return 0;
    }
    return +(this.amountCoinUS / this.mcCoin.price_usd).toFixed(2);
  }

  async buyCoinInstant(reason: string = null) {
    if (reason) this.log({action: 'BUY', reason})
    const qty = this.getAmountCoin();
    if (!qty) {
      console.warn(' no QTY');
      return null;
    }
    try {
      const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
      const rate = UtilsBooks.getRateForAmountCoin(books.sell, qty);
      this.log({action: 'BOUGHT', reason: ' rate ' + rate});
    } catch (e) {
      this.log({action: 'ERROR', reason: 'buy coin ' + e.toString()});
    }
    return {uuid: 'test'};
  }

  async setBuyOrder(rate: number) {
    this.log({action: 'BUY_ORDER', reason: 'rate ' + rate});
    if (!this.isLive) return Promise.resolve();
    return new Promise(async (resolve, reject) => {
      const qty = (this.amountCoinUS / this.mcCoin.price_usd);
      const order = await this.apiPrivate.buyLimit2(this.market, qty, rate);
      resolve(order);
    });
  }

  async setSellOrder(rate: number) {
    this.log({action: 'SELL_ORDER', reason: 'rate ' + rate});
    if (!this.isLive) return Promise.resolve();
    return new Promise(async (resolve, reject) => {

      if (this.balance.balanceUS < 10) {
        reject(' amount too low ' + this.balance.balanceUS);
      }

      await this.orders.cancelSellOrders();
      const qty = this.balance.balance;
      const order = await this.apiPrivate.sellLimit2(this.market, qty, rate);
      resolve(order);
    });

  }


  async tick() {
    setTimeout(() => this.save(), 5000);

    if (this.isLive) console.log(this.market + ' ' + this.balance.state + ' ' + this.orders.state);

    const btcusdtState = this.btcusdt.state;

    if (btcusdtState === MarketState.DROPPING) {
      console.log(this.market + ' USDT_BTC DROPPING');
      //const botState = this.state$.getValue();

      if (this.balance.state === BalanceState.SOLD) {
        console.log(this.market + ' SOLD');
        return;
      }
      await this.orders.cancelAllOrders();
      this.sellCoinInstant('USDT_BTC DROPPING');
      return
    }

    const candles = await this.candlesService.getCandles(this.market);
    const lastCandle = _.last(candles);
    const lastPrice = lastCandle.close;
    if (this.prevPrice === lastPrice) return;
    this.prevPrice = lastCandle.close;



    if (!this.mcCoin) {
      console.log('%c ' + this.market + ' NO MarketCap DATA', 'color:red');
      return;
    }

    const candles15m = await this.candlesService.getCandles2(this.exchange, this.market, '15m');
    const closes = CandlesAnalys1.closes(candles15m);

    const signal = this.macdSignal.tick(closes);
    const last15m = _.last(candles15m);
    const mas = CandlesAnalys1.mas(candles15m);
    let macdState = this.macdSignal.state$.getValue();
    if (this.isLive) console.log(this.market + ' macd ' + macdState + ' ' + this.macdSignal.reason);



    if (macdState === BuySellState.BUY_NOW) {

      this.log({action: 'BUY NOW', reason: this.macdSignal.reason});
      console.log('%c ' + this.market + ' ' + BuySellState.BUY_NOW, 'color:red');

      if (this.balance.state !== BalanceState.SOLD) {
        this.log({action: 'CANCEL_BUY', reason: 'NOT SOLD'});
        return;
      }

      const buyPrice = +((last15m.close + last15m.open) / 2).toFixed(8);
      const lastCandle = moment(last15m.to).format('HH:mm') + ' O ' + last15m.open + ' C ' + last15m.close;
      this.log({action: 'Last Candle', reason: lastCandle});
      const vols = CandlesAnalys1.volumes(candles15m);
      const Vd = MATH.percent(last15m.Volume, MATH.median(vols));

      this.log({action: 'MAS ', reason: 'MA25-99 ' + MATH.percent(mas.ma25, mas.ma99) + ' Vd ' + Vd});

      this.log({action: 'MC', reason: ' r6 ' + this.mcCoin.r6 + ' r24 ' + this.mcCoin.r24});
      this.log({action: 'USDT_BTC', reason: btcusdtState});
      if (this.mcCoin.r6 >= 0) this.setBuyOrder(buyPrice);
      else this.log({action: 'NOT BUY', reason: this.mcCoin.r6 + ' < 0'})
      //  this.buyCoinInstant(' P ' + buyPrice + ' Vd ' + Vd);
    }

    else if (macdState === BuySellState.SELL_NOW) {
      this.log({action: 'SELL NOW', reason: this.macdSignal.reason});

      if (this.balance.state === BalanceState.BOUGHT) {
        console.log('%c ' + this.market + ' ' + BuySellState.SELL_NOW, 'color:red');
        const midPrice = +((last15m.close + last15m.open) / 2).toFixed(8);
        const vols = CandlesAnalys1.volumes(candles15m);
        const Vd = MATH.percent(last15m.Volume, MATH.median(vols));

        this.log({action: 'MAS', reason: 'MA25-99' + MATH.percent(mas.ma25, mas.ma99)});
        this.log({action: 'MC', reason: ' r6 ' + this.mcCoin.r6 + ' r24 ' + this.mcCoin.r24});
        this.log({action: 'USDT_BTC', reason: btcusdtState});

        this.setSellOrder(midPrice);
      }

    }


    // console.log(this.market + ' TICK');

    /*   const mas = CandlesAnalys1.mas(candles);
       const vols = CandlesAnalys1.vols(candles);


       const toSell = CandlesAnalys1.isToSell(mas, vols);

       if (toSell.action && toSell.action === 'SELL') {
         this.log(toSell);
         this.sellCoinInstant();
         return;
       }

       const result = await CandlesAnalys1.createState(mas, vols, candles);
       this.patterns = CandlesAnalys1.groupPatterns(this.patterns, result);*/

    //  await this.stopLossOrder.checkStopLoss(candles, this.balanceCoin);


    /*

    const support = this.resistanceSupport.getSupportLevel(result.ma3);
   /!* if(support.length) {
     // console.log(this.market, support);
      const supResults = support.map(function (item) {
        return item.i + '  ' +item.v_D + ' ' + item.date;
      });
      result.sup = supResults.join( '; ');
    }
*!/

    const action = CandlesAnalys1.createAction(this.market, this.patterns, this.lastOrder, support);*/
    /*  if (action) {
        this.log(action);
        if (action.action === 'BUY') this.buyCoinInstant();
        else if (action.action === 'SELL') this.sellCoinInstant();
      }*/

    //  const newPrice = CandlesAnalys1.getVolumePrice(this.patterns);


    // this.log(' sellPrices ' + sellPrices.toString() + ' buyPrices ' + buyPrices.toString())
    // if(soldD > 90) this.sellCoin(last.rate);
  }


  private initMarketCap() {

    this.marketCap.ticker$().pipe(
      map(obj => {
        if (!obj) return;
        this.mcCoin = obj[this.coin];
        const prevSate = this.rankSate;
        let newSate = RankState.NONE;

        if (this.mcCoin.r6 < 0) newSate = RankState.RED;
        else if (this.mcCoin.r6 > 0) newSate = RankState.GREEN;
        if (this.rankSate && this.rankSate !== newSate) {
          this.log({
            action: prevSate + '->' + newSate, reason: this.mcCoin.rank + ' r6 ' + this.mcCoin.r6 + ' r24 ' +
              this.mcCoin.r24 + ' ' + moment(this.mcCoin.last_updated * 1000).format('DD HH:mm')
          });
        }
        this.rankSate = newSate;

        this.mcBase = obj[this.base];
      })
    ).subscribe(noop);

  }

  async init() {
    const ar = this.market.split('_');
    this.base = ar[0];
    this.coin = ar[1];
    await this.initMarketCap();
    this.patterns = (await this.storage.select(this.id + '-patterns')) || [];

    const MC = await this.marketCap.ticker$().toPromise();
    const priceUS = MC[this.coin].price_usd;

    this.balance = new MarketBalance(this.market, this.apiPrivate, this.storage, priceUS);
    this.orders = new MarketOrders(this.market, this.apiPrivate, this.storage, priceUS);
    this.macdSignal = new MacdSignal();
    await this.balance.init();

    this.balance.balance$.subscribe(balance =>{
      if(balance.change){
        console.warn(this.market + ' balanec changed ' + balance.change)
      }
    });

    this.stopLossOrder = new StopLossOrder(this.market, this.apiPrivate);
  }

  stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = 0;
    this.log({action: 'STOP', reason: 'tick'});
  }

  async start() {
    if (this.interval) return;
    const sec = (60 + (Math.random() * 10));

    this.interval = setInterval(() => this.tick(), sec * 1000);
  }


  async getLogs() {
    let history: any[] = (await this.storage.select(this.id + '-logs')) || [];
    return history.concat(this.logs);
  }

  getPatterns() {
    return this.patterns;
  }

  async deleteHistory() {
    await this.storage.remove(this.id + '-logs');
    await this.storage.remove(this.id + '-patterns');
    await this.storage.remove(this.id + '-bought-order');
    this.patterns = [];
    this.logs = [];
  }

  async save() {
    if (this.patterns.length) {
      const patterns = _.take(this.patterns, 500);
      this.storage.upsert(this.id + '-patterns', patterns);
    }

    //  this.storage.upsert(this.id + '-orders', this.orders);
    if (!this.logs.length) return;
    const logs = await this.getLogs();
    this.logs = [];
    this.storage.upsert(this.id + '-logs', _.takeRight(logs, 500));
  }

  destroy() {
    if(this.balance.balance){
      this.orders.cancelAllOrders().then(res =>{
        this.sellCoinInstant('destroy')
      });
      console.log(' SELLING COIN');
      return;
    }


    this.log({action: 'destroy', reason: ''});
    this.storage.remove(this.id);
    this.deleteHistory();
    this.balance.destroy();
    this.stop();
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.resistanceSupport) this.resistanceSupport.destroy();
    if (this.stopLossOrder) this.stopLossOrder.destroy();
    return true;
  }

  log(log: { action: string, reason: string }) {
    // if (typeof message !== 'string') out = UTILS.toString(message);
    // else out = message;
    const time = moment().format('DD HH:mm');
    const market = this.market;
    const out = Object.assign({time, market}, log);
    //  console.log(out);
    if (this.isLive) console.log(log.action + ' ' + log.reason);
    this.logs.push(out);
  }


}
