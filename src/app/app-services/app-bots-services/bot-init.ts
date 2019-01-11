import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {BalanceState, MarketBalance} from './market-balance';
import {MarketOrders} from './market-orders';
import {MacdSignal} from './macd-signal';
import {StopLossOrder} from './stop-loss-order';
import {BotState, MCState} from './market-bot';
import {StorageService} from '../../services/app-storage.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {map} from 'rxjs/operators';
import * as moment from 'moment';
import {noop} from 'rxjs/internal-compatibility';
import {VOMarketCap, VOOrder} from '../../models/app-models';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {CandlesService} from '../candles/candles.service';
import * as _ from 'lodash';
import {UtilsBooks} from '../../com/utils-books';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {Subscription} from 'rxjs/internal/Subscription';
import {SellOnJump} from './sell-on-jump';
import {BuySellState} from './models';

export class BotInit {
  state$: BehaviorSubject<BotState>;
  mcState$: BehaviorSubject<MCState> = new BehaviorSubject(MCState.NONE);
  base: string;
  coin: string;
  mcCoin: VOMarketCap;
  mcBase: VOMarketCap;
  isLive: boolean;

  balance: MarketBalance;
  orders: MarketOrders;
  macdSignal: MacdSignal;
  stopLossOrder: StopLossOrder;
  sellOnJump: SellOnJump;

  patterns: any[];
  logs: any[] = [];
  id: string;


  sub1: Subscription;
  sub2: Subscription;

  interval;

  constructor(
    public exchange: string,
    public market: string,
    public amountCoinUS: number,
    public apiPrivate: ApiPrivateAbstaract,
    public apiPublic: ApiPublicAbstract,
    public candlesService: CandlesService,
    public storage: StorageService,
    public marketCap: ApiMarketCapService
  ) {
    this.id = 'bot-' + exchange + market;
  }


  buyNow(){

  }

  async buyCoinInstant(qty: number) {
    if (!qty) qty = this.amountCoin;

    if (!qty) {
      console.warn(' no QTY');
      this.log({action: 'STOP BUY', reason: ' no QTY'});
      return null;
    }
    try {
      const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
      const rate = UtilsBooks.getRateForAmountCoin(books.sell, qty);
      this.log({action: 'BUY_INSTANT', reason: ' rate ' + rate});
      const order = await this.apiPrivate.buyLimit2(this.market, qty, rate);
      console.log('BUY ORDER RESULT ', order);
      this.log({action: 'BUY_ORDER_RESULT', reason: order.amountCoin + '  ' + order.rate + ' ' + order.isOpen});
      this.apiPrivate.refreshAllOpenOrders();
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

    const cancelResult: VOOrder[] = await this.orders.cancelSellOrders();
    this.log({
      action: 'cancel orders res ', reason: cancelResult.map(function (item) {
        return item.action + ' ' + item.uuid;
      }).toString()
    });

    const order = await this.apiPrivate.sellLimit2(this.market, qty, rate);
    this.log({action: 'SELL_LIMIT ', reason: 'rate ' + order.rate + ' qty ' + order.amountCoin + ' open ' + order.isOpen});

    this.apiPrivate.refreshAllOpenOrders();
    return order;
  }


  async sellCoinInstant(qty: number) {

    if(this.balance.state !== BalanceState.BOUGHT){
      this.log({action: 'CANCEL SELL INSTANT', reason: ' balance state is not BOUGHT ' + this.balance.state});
      return;
    }

    await this.orders.cancelAllOrders();
    if (!qty) qty = this.balance.balance;

    try {
      const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
      const rate = UtilsBooks.getRateForAmountCoin(books.buy, qty);
      this.log({action: 'SELL_INSTANT', reason: 'qty ' + qty + ' rate ' + rate});
      const sellResult = await this.apiPrivate.sellLimit2(this.market, qty, rate);
      console.log(sellResult);
      this.log({action: 'RESULT SELL_INSTANT ', reason: sellResult.amountCoin + '  ' + sellResult.rate});

    } catch (e) {
      this.log({action: 'ERROR SELL_INSTANT', reason: JSON.stringify(e)});
    }
    // this.state$.next(BotState.SOLD);
  }


  async botInit() {
    const ar = this.market.split('_');
    this.base = ar[0];
    this.coin = ar[1];

    this.state$ = new BehaviorSubject<BotState>((await this.storage.select('state-' + this.exchange + this.market)) || BotState.NONE);

    await this.initMarketCap();
    //  console.log(this.market + ' init ' + this.isLive + ' $' + this.amountCoinUS);
    this.patterns = (await this.storage.select(this.id + '-patterns')) || [];
    const MC = await this.marketCap.ticker();
    const priceUS = MC[this.coin].price_usd;
    this.balance = new MarketBalance(this.market, this.apiPrivate, this.storage, this.marketCap);
    this.orders = new MarketOrders(this.market, this.apiPrivate, this.storage, priceUS);
    await this.orders.init();
    // console.log(this.market + ' ORDERS init DONE ');
    this.macdSignal = new MacdSignal(this.market, this.candlesService);
    await this.balance.init();


    this.sellOnJump = new SellOnJump(this.market, this.candlesService);
    this.sellOnJump.state$.subscribe(state => {
      if(state === BuySellState.SELL_ON_JUMP && this.balance.state === BalanceState.BOUGHT) {

        this.log({action: 'SELL_ON_JUMP', reason: this.sellOnJump.reason});

         this.sellCoinInstant(0);
      }
      console.log(this.market + ' sellOnJump ' + state + ' ' + this.sellOnJump.reason);
    });

    this.macdSignal.state$.subscribe(res => {
      this.log({action: 'MACD ' + res, reason: this.macdSignal.reason});
     /* if (res === BuySellState.BUY_NOW) {
        this.log({action: 'BUY_BY_MACD', reason: this.macdSignal.reason});
      } else if (res === BuySellState.SELL_NOW) {
        this.log({action: 'SELL_BY_MACD', reason: this.macdSignal.reason})
      }*/
    });

    if (!this.isLive) console.log('%c ' + this.market + ' NOT LIVE ', 'color:red');
    console.log(this.market + ' BALANCE  init DONE $' + this.balance.balanceUS);
    this.balance.balance$.subscribe(balance => {
      if (balance.change) {
        this.log({action: 'BALANCE', reason: ' ' + balance.change});
        this.apiPrivate.refreshAllOpenOrders();
        console.warn(this.market + ' balance changed ' + balance.change)
      }
    });

    this.balance.state$.subscribe(state => {
      this.log({action: 'BALANCE', reason: state});
    });

    this.stopLossOrder = new StopLossOrder(this.market, this.apiPrivate);
    this.stopLossOrder.log = this.log.bind(this);

    const sub = this.candlesService.candles15min$(this.market);

    sub.subscribe(candles => {
      //  console.log(_.map(_.takeRight(candles, 10),'time'));
    })
  }


  initMarketCap() {
    this.marketCap.ticker$().pipe(
      map(obj => {
        if (!obj) return;

        this.mcCoin = obj[this.coin];
        this.mcBase = obj[this.base];

        if(!this.mcCoin) {
          console.log(this.coin, obj);
          return
        }
        const prevSate = this.mcState$.getValue();
        let newState = MCState.NONE;

        if (this.mcCoin.r6 < 0) newState = MCState.RED;
        else if (this.mcCoin.r6 >= 0) newState = MCState.GREEN;
        if (prevSate !== newState) {

          if (prevSate !== MCState.NONE) this.log({
            action: prevSate + '->' + newState,
            reason: this.mcCoin.rank + ' r6 ' + this.mcCoin.r6 + ' r24 ' +
              this.mcCoin.r24 + ' 1w ' + this.mcCoin.percent_change_7d + ' 1d ' + this.mcCoin.percent_change_24h
          });
          this.mcState$.next(newState);
        }
      })
    ).subscribe(noop);
  }


  log(log: { action: string, reason: string }) {
    // if (typeof message !== 'string') out = UTILS.toString(message);
    // else out = message;
    const time = moment().format('DD HH:mm');
    const market = this.market;
    const out = Object.assign({time, market}, log);
    //  console.log(out);
    if (this.isLive) console.log(this.market + ' ' +log.action + ' ' + log.reason);
    this.logs.push(out);
  }

  get amountCoin() {
    if (!this.mcCoin) {
      console.warn(' no MC data');
      return 0;
    }

    let amount = (this.amountCoinUS / this.mcCoin.price_usd);
    if (amount > 10) {
      amount = Math.round(amount);
      if (this.balance.balance > 0 ) {
        amount  = amount - this.balance.balance;
      }
    }
    else amount = +amount.toFixed(2);
    return amount
  }

  get state() {
    return this.state$.getValue();
  }

  set state(state: BotState) {
    this.state$.next(state);
    this.storage.upsert('state-' + this.exchange + this.market, state);
  }

  get priceBase() {
    return this.mcBase.price_usd;
  }

  get priceCoin() {
    return this.mcCoin.price_usd;
  }

  destroy() {
    if (this.balance.balance) {
      this.orders.cancelAllOrders().then(res => {
        this.sellCoinInstant(0);
      });
      console.log(' SELLING COIN');
      return;
    }


    this.stop();
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.  sub2.unsubscribe();

    this.log({action: 'destroy', reason: ''});
    this.storage.remove(this.id);
    this.candlesService.deleteCandles(this.market);
    this.deleteHistory();
    this.balance.destroy();
    this.stopLossOrder.destroy();

    // if (this.resistanceSupport) this.resistanceSupport.destroy();

    return true;
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


  async getLogs() {
    let history: any[] = (await this.storage.select(this.id + '-logs')) || [];
    return history.concat(this.logs);
  }

  getPatterns() {
    return this.patterns;
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


  tick() {

  }


}