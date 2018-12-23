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
import {MarketOrders, OrdersState} from './market-orders';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';


export enum MCState {
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
  // rankSate: RankState = null;
  mcState$: BehaviorSubject<MCState> = new BehaviorSubject(MCState.NONE);
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


  get priceBase() {
    return this.mcBase.price_usd;
  }

  get priceCoin() {
    return this.mcCoin.price_usd;
  }

  //macdSate: BuySellState;
  //usdtbtcState: MarketState;

  async sellCoinInstant(qty: number) {

    if (this.balance.balanceUS > 10) await this.orders.cancelAllOrders();
    if (!qty) qty = this.balance.balance;

    try {
      const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
      const rate = UtilsBooks.getRateForAmountCoin(books.buy, qty);
      this.log({action: 'SELL_INSTANT', reason: 'qty ' + qty + ' rate ' + rate});
      const sellResult = await this.apiPrivate.sellLimit2(this.market, qty, rate);
      console.log(sellResult);
      this.log({action: 'RESULT SELL_INSTANT ', reason: sellResult.amountCoin + '  ' + sellResult.rate});

    } catch (e) {
      this.log({action: 'ERROR SELL_INSTANT', reason: e.toString()});
    }
    // this.state$.next(BotState.SOLD);
  }

  get amountCoin() {
    if (!this.mcCoin) {
      console.warn(' no MC data');
      return 0;
    }

    let amount = (this.amountCoinUS / this.mcCoin.price_usd);
    if (amount > 10) {
      amount = Math.round(amount);
      if(this.balance.balance > 0 && this.balance.balance < 1){
        const add =  1 - this.balance.balance;
        amount += add;
      }
    }
    else amount = +amount.toFixed(2);


    return amount
  }

  async buyCoinInstant(qty: number) {
    if (!qty) qty = this.amountCoin;

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
    const qty = this.amountCoin;
    this.log({action: 'BUY_ORDER', reason: ' qty ' + qty + ' rate ' + rate});
    if (!this.isLive) return Promise.resolve();
    return new Promise(async (resolve, reject) => {
      try {
        const order = await this.apiPrivate.buyLimit2(this.market, qty, rate);
        console.log('BUY ORDER RESULT ', order);
        this.log({action: 'BUY_ORDER_RESULT', reason: order.amountCoin + '  ' + order.rate + ' ' + order.isOpen});
        this.apiPrivate.refreshAllOpenOrders();
      } catch (e) {
        this.log({action: 'ERROR BUY_ORDER_RESULT', reason: e.toString()});
        reject();
      }
      setTimeout(() => resolve(), 2000);
    });
  }

  async setSellOrder(rate: number) {
    const qty = this.balance.balance;
    this.log({action: 'SELL_ORDER', reason: 'qty ' + qty + 'rate ' + rate + ' live:' + this.isLive});
    if (!this.isLive) return Promise.resolve();

    if (!qty) {
      Promise.resolve(' amount too low ' + this.balance.balanceUS);
      return;
    }

    const cancelResult:VOOrder[] = await this.orders.cancelSellOrders();
    this.log({action: 'cancel orders res ',reason: cancelResult.map(function (item) {
        return item.action + ' ' +item.uuid;
      }).toString()});

    const order = await this.apiPrivate.sellLimit2(this.market, qty, rate);
    this.log({action: 'SELL_LIMIT ', reason: 'rate ' +order.rate + ' qty ' + order.amountCoin +' open ' + order.isOpen});

    this.apiPrivate.refreshAllOpenOrders();
    return order;
  }

  async tick() {
    setTimeout(() => this.save(), 5000);
    if (this.isLive) console.log(this.market + ' ' + this.balance.state + ' ' + this.orders.state);

    const candles = await this.candlesService.getCandles(this.market);
    const lastCandle = _.last(candles);
    const lastPrice = lastCandle.close;
    if (this.prevPrice === lastPrice) return;

    const candles15m = await this.candlesService.getCandles2(this.exchange, this.market, '15m');
    const btcusdtState = this.btcusdt.state;

    if (btcusdtState === MarketState.DROPPING) {
      console.log(this.market + ' USDT_BTC DROPPING');

      if (this.balance.state === BalanceState.SOLD) {
        console.log(this.market + ' SOLD');
        return;
      }

      this.log({action: 'SELL_INSTANT',reason: 'USDT_BTC DROPPING'});

      const cancelResults = await this.orders.cancelAllOrders();

      this.log({action: 'CANCEL ALL ORDERS',reason: _.map(_.flatten(cancelResults), 'uuid').toString()});
      this.sellCoinInstant(0);
      return;
    }


    this.prevPrice = lastCandle.close;

    if (!this.mcCoin) {
      console.log('%c ' + this.market + ' NO MarketCap DATA', 'color:red');
      return;
    }


    const closes = CandlesAnalys1.closes(candles15m);

    const last15m = _.last(candles15m);
    const signal = this.macdSignal.tick(closes, last15m);

    const mas = CandlesAnalys1.mas(candles15m);
    let macdState = this.macdSignal.state$.getValue();

    if (this.isLive) console.log(this.market + ' macd ' + macdState + ' ' + this.macdSignal.reason);


    if (macdState === BuySellState.BUY_NOW) {
      this.log({action: 'BUY NOW', reason: this.macdSignal.reason});
      console.log('%c ' + this.market + ' ' + BuySellState.BUY_NOW, 'color:red');


      if (this.balance.state === BalanceState.BOUGHT) {
        this.log({action: 'STOP BUY', reason: 'balance BOUGHT orders ' + this.orders.state});
        return;
      }

      if (this.orders.state === OrdersState.BUYING) {
        this.log({action: 'STOP BUY', reason: this.orders.state});
        return;
      }

      const balanceBaseUS = this.balance.baseBalance * this.priceBase;
      if (balanceBaseUS < this.amountCoinUS) {
        this.log({action: 'STOP BUY', reason: 'NO amount base'});
        return
      }

      this.log({action: 'MC', reason: ' r6 ' + this.mcCoin.r6 + ' r24 ' + this.mcCoin.r24});
      if (this.mcCoin.r6 < 0) {
        this.log({action: 'STOP BUY', reason: 'r6 ' + this.mcCoin.r6});
        return;
      }

      const ma3_7 = MATH.percent(mas.ma3, mas.ma7);

      const buyPrice = +((last15m.close + last15m.open) / 2).toFixed(8);
      this.log({action: 'Candle  ', reason: 'C ' + last15m.close + ' O ' + last15m.open + ' ' + moment(last15m.to).format('HH:mm')});

      const vols = CandlesAnalys1.volumes(candles15m);
      const Vd = MATH.percent(last15m.Volume, MATH.median(vols));

      this.log({action: 'MAS ', reason: 'ma3_7 ' + ma3_7 + 'ma25-99 ' + MATH.percent(mas.ma25, mas.ma99) + ' Vd ' + Vd});

      this.log({action: 'USDT_BTC', reason: btcusdtState});
      this.setBuyOrder(buyPrice);

      //  this.buyCoinInstant(' P ' + buyPrice + ' Vd ' + Vd);
    }

    else if (macdState === BuySellState.SELL_NOW) {
      this.log({action: 'SELL NOW', reason: this.macdSignal.reason});

      if (this.balance.state !== BalanceState.BOUGHT) {
        this.log({action: 'STOP SELL', reason: this.balance.state});
        return;
      }

      if (this.orders.state === OrdersState.SELLING) {
        this.log({action: 'STOP SELL', reason: this.orders.state});
        return;
      }

      console.log('%c ' + this.market + ' ' + BuySellState.SELL_NOW, 'color:red');
      const midPrice = this.macdSignal.price;
      const vols = CandlesAnalys1.volumes(candles15m);
      const Vd = MATH.percent(last15m.Volume, MATH.median(vols));

      this.log({action: 'MAS', reason: 'MA25-99' + MATH.percent(mas.ma25, mas.ma99)});
      this.log({action: 'MC', reason: ' r6 ' + this.mcCoin.r6 + ' r24 ' + this.mcCoin.r24});
      this.log({action: 'USDT_BTC', reason: btcusdtState});
      this.setSellOrder(midPrice);

    } else {

      let stopLossPrice = mas.ma25;
      if (this.orders.state === OrdersState.STOP_LOSS) {
        this.stopLossOrder.checkStopLoss(stopLossPrice, this.balance.balance);
      } else if (this.orders.state === OrdersState.NONE && this.balance.state === BalanceState.BOUGHT) {

        if(last15m.close < stopLossPrice) {

          this.log({action: 'ATTENTION', reason:' SL  ma25 '+ mas.ma25.toFixed(8) + ' close '+ last15m.close});
          stopLossPrice = last15m.close;
        }

        this.stopLossOrder.setStopLoss(stopLossPrice, this.balance.balance)
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
        this.mcBase = obj[this.base];

        const prevSate = this.mcState$.getValue();
        let newState = MCState.NONE;

         if (this.mcCoin.r6 < 0) newState = MCState.RED;
         else if (this.mcCoin.r6 >= 0) newState =MCState.GREEN;
         if (prevSate !== newState) {

            if(prevSate !== MCState.NONE) this.log({
              action:  prevSate + '->' + newState,
              reason: this.mcCoin.rank + ' r6 ' + this.mcCoin.r6 + ' r24 ' +
               this.mcCoin.r24 + ' ' + moment(this.mcCoin.last_updated * 1000).format('DD HH:mm')
           });
           this.mcState$.next(newState);
         }
      })
    ).subscribe(noop);

  }

  async init() {
    const ar = this.market.split('_');
    this.base = ar[0];
    this.coin = ar[1];

    await this.initMarketCap();
   //  console.log(this.market + ' init ' + this.isLive + ' $' + this.amountCoinUS);
    this.patterns = (await this.storage.select(this.id + '-patterns')) || [];
    const MC = await this.marketCap.ticker();
    const priceUS = MC[this.coin].price_usd;
    this.balance = new MarketBalance(this.market, this.apiPrivate, this.storage, this.marketCap);
    this.orders = new MarketOrders(this.market, this.apiPrivate, this.storage, priceUS);
    await this.orders.init();
    // console.log(this.market + ' ORDERS init DONE ');
    this.macdSignal = new MacdSignal();
    await this.balance.init();

    if(!this.isLive) console.log('%c ' + this.market + ' NOT LIVE ', 'color:red');
    console.log(this.market + ' BALANCE  init DONE $' + this.balance.balanceUS);
    this.balance.balance$.subscribe(balance => {
      if (balance.change) {
        this.log({action:'BAL_CHANGE', reason: ' ' + balance.change})
        this.apiPrivate.refreshAllOpenOrders();
        console.warn(this.market + ' balance changed ' + balance.change)
      }
    });

    this.balance.state$.subscribe(state =>{
      this.log({action: 'BAL_STATE', reason:state});
    });

    this.stopLossOrder = new StopLossOrder(this.market, this.apiPrivate);
    this.stopLossOrder.log = this.log.bind(this);

   const sub =  this.candlesService.candles15min$(this.market);

   sub.subscribe(candles =>{
     console.log(_.map(_.takeRight(candles, 10),'time'));
   })
  }

  stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = 0;
    this.log({action: 'STOP', reason: 'tick'});
  }

  async start() {
    if (this.interval) return;
    const sec = Math.round(60 + (Math.random() * 20));

    console.log(this.market + ' start refresh rate ' + sec);
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
    if (this.balance.balance) {
      this.orders.cancelAllOrders().then(res => {
        this.sellCoinInstant(0);
      });
      console.log(' SELLING COIN');
      return;
    }

    this.log({action: 'destroy', reason: ''});
    this.storage.remove(this.id);
    this.deleteHistory();
    this.balance.destroy();
    this.stopLossOrder.destroy();
    this.stop();
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.resistanceSupport) this.resistanceSupport.destroy();

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
