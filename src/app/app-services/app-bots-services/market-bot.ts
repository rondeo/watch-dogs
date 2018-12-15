import {StorageService} from '../../services/app-storage.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import * as _ from 'lodash';
import {VOBalance, VOMarketCap, VOOrder} from '../../models/app-models';
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
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';


export enum RankState {
  NONE = 'NONE',
  GREEN = 'GREEN',
  RED = 'RED'
}

export enum BotState{
  NONE = 'NONE',
  BUYING = 'BUYING',
  SELING = 'SELLING',
  BOUGHT = 'BOUGHT',
  SOLD = 'SOLD',
  TO_USDT = 'TO_USDT',
  NO_BASE = 'NO_BASE',
  INTERRUPTED_BY_BTC = 'INTERRUPTED_BY_BTC'
}


export class MarketBot {
  resistanceSupport: ResistanceSupportController;

  rankSate: RankState = null;

  state$: BehaviorSubject<BotState> = new BehaviorSubject(BotState.NONE);

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
    this.id = 'bot-' + market;
    this.init().then(() => {
      this.start();
    });

    //  this.stopLossOrder = new StopLossOrder(market, apiPrivate);
  }

  base: string;
  coin: string;
  balanceBase: VOBalance;
  balanceCoin: VOBalance;
  mcCoin: VOMarketCap;
  mcBase: VOMarketCap;

  logs: any[] = [];
  id: string;
  private stopLossOrder: StopLossOrder;


  prevAction: string;
  patterns: any[] = [];
  lastOrder: { stamp: number, action: string, price: number };
  prevPrice: number;
  interval;
  sub1;
  sub2;
  private activeOrders: VOOrder[];
  timeout;
  macdSignal: MacdSignal = new MacdSignal();
  //macdSate: BuySellState;
  //usdtbtcState: MarketState;

  async sellCoinInstant(reason: string = null) {
    if (reason) this.log({action: 'SELL', reason});
    const qty = this.getAmountCoin();
    // console.log('%c !!!!! SELL COIN ' + this.market, 'color:red');
    //  console.log(this.balanceCoin);

    /* if (!this.balanceCoin || this.balanceCoin.available === 0 ) {
       this.log('SELL no Balance');
       return;
     }*/

    try {
      const books = await this.apiPublic.downloadBooks2(this.market).toPromise();
      const rate = UtilsBooks.getRateForAmountCoin(books.buy, qty);
      this.log({action: 'SOLD', reason: ' rate' + rate});
      // const sellOrder = this.apiPrivate.sellLimit2(this.market,qty,rate);

    } catch (e) {
      this.log({action: 'ERROR', reason: 'download books and buy coin  ' + e.toString()});
    }
    this.state$.next(BotState.SOLD);
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

  private async cancelOrder(uuid: string) {
    this.log({action: 'CANCEL_ORDER', reason: uuid});
    const ar = this.market.split('_');
    return this.apiPrivate.cancelOrder(uuid, ar[0], ar[1]).toPromise();
  }

  async cancelOrders(uuids: string[]) {
    return new Promise(async (resolve, reject) => {
      Promise.all(uuids.map((uuid) => {
        return this.cancelOrder(uuid)
      })).then(result => {
        setTimeout(() => {
          this.apiPrivate.refreshAllOpenOrders();
          setTimeout(() => resolve(result), 5000);
        }, 2000);

      }, reject);
    })
  }


  async cancelBuyOrder(){
    console.warn('cancelBuyOrder');
    const buyOrders = this.activeOrders.filter(function (item) {
      return item.action === 'BUY';
    });
    if(buyOrders.length) return this.cancelOrders(_.map(buyOrders, 'uuid'));
    else return Promise.resolve()
  }

  async cancelSellOrder(){

    console.warn('cancelSellOrder')
  }

  async buyCoin(rate: number) {
    return new Promise(async (resolve, reject) => {
      const qty = (this.amountCoinUS / this.mcCoin.price_usd);
      const order = await this.apiPrivate.buyLimit2(this.market, qty, rate);
      const sub1 = this.apiPrivate.allOpenOrders$().subscribe(openOrders => {

      })

    })

  }


  log(log: { action: string, reason: string }) {
    // if (typeof message !== 'string') out = UTILS.toString(message);
    // else out = message;
    const time = moment().format('DD HH:mm');
    const market = this.market;
    const out = Object.assign({time, market}, log);
    //  console.log(out);
    this.logs.push(out);
  }


  async tick() {

    setTimeout(() => this.save(), 5000);

    const btcusdtState = this.btcusdt.state$.getValue();

    if(btcusdtState === MarketState.DROPPING){
      const botState = this.state$.getValue();

      if( botState === BotState.SOLD) {
        console.log(this.market + ' SOLD');
        return;
      }

      if(botState === BotState.BUYING) return this.cancelBuyOrder();

      if(botState === BotState.SELING) return this.cancelSellOrder();

      if(botState === BotState.BOUGHT) return this.sellCoinInstant('USDT-BTC dropping');

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
    const signal = this.macdSignal.tick(closes, _.last(candles15m).time);
    const last15m = _.last(candles15m);
    const mas = CandlesAnalys1.mas(candles15m);
    const macdState = this.macdSignal.state$.getValue();


    if (macdState === BuySellState.BUY_NOW) {
      if(this.btcusdt.state$.getValue() === MarketState.DROPPING) {
        this.log({action: 'CANCEL_BUY', reason:'USDT_BTC DROPPING'})
        return;
      }

      const buyPrice = ((last15m.close + last15m.open) / 2).toFixed(8);
      const vols = CandlesAnalys1.volumes(candles15m);
      const Vd = MATH.percent(last15m.Volume, MATH.median(vols));

      this.log({action: 'BUY NOW', reason: this.macdSignal.reason});
      this.log({action: 'MAS', reason: 'MA25-99 ' + MATH.percent(mas.ma25, mas.ma99)});
      this.log({action: 'MC', reason: ' r6 ' + this.mcCoin.r6 + ' r24 ' + this.mcCoin.r24});
      this.log({action: 'USDT_BTC', reason: btcusdtState});
      this.buyCoinInstant(' P ' + buyPrice + ' Vd ' + Vd);
    }

    else if (macdState === BuySellState.SELL_NOW) {
      const midPrice = ((last15m.close + last15m.open) / 2).toFixed(8);
      const vols = CandlesAnalys1.volumes(candles15m);
      const Vd = MATH.percent(last15m.Volume, MATH.median(vols));
      this.log({action: 'SELL NOW', reason: this.macdSignal.reason});
      this.log({action: 'MAS', reason: 'MA25-99' + MATH.percent(mas.ma25, mas.ma99)});
      this.log({action: 'MC', reason: ' r6 ' + this.mcCoin.r6 + ' r24 ' + this.mcCoin.r24});
      this.log({action: 'USDT_BTC', reason: btcusdtState});
      this.sellCoinInstant(' P ' + midPrice + ' Vd ' + Vd);
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
    this.patterns = (await this.storage.select(this.id + '-patterns')) || [];
    this.boughtOrder = await this.storage.select(this.id + '-bought-order');

    this.initMarketCap();

    /*this.macdSignal.state$.subscribe(state => {
      console.log('%c ' + this.market + '  ' + state, 'color:red');
      this.macdSate = state
    });



    this.btcusdt.state$.subscribe(state => {
      this.usdtbtcState = state
    });*/

    //  this.resistanceSupport = new ResistanceSupportController(this.market, '15m', this.apiPublic, this.storage);
    // await this.resistanceSupport.init();

    this.stopLossOrder = new StopLossOrder(this.market, this.apiPrivate);

    this.sub1 = this.apiPrivate.balances$().subscribe(balances => {
      if (!balances) return;
      const bb = _.find(balances, {symbol: this.base});
      const bc = _.find(balances, {symbol: this.coin});
      this.balanceBase = bb;
      this.balanceCoin = bc;

      if(bc.available * this.mcCoin.price_usd > 10 && bc.pending * this.mcCoin.price_usd > 10) this.cancelSellOrder();
     if((bc.pending * this.mcCoin.price_usd) > 10) this.state$.next(BotState.SELING);
      if((bc.available * this.mcCoin.price_usd) > 10) this.state$.next(BotState.BOUGHT);
    });

    this.sub2 = this.apiPrivate.allOpenOrders$().subscribe(orders => {
      if (!orders) return;
      const myOrders: VOOrder[] = <VOOrder[]>_.filter(orders, {coin: this.coin});
      //  console.log(this.market + ' my order ', myOrder);
      this.activeOrders = myOrders;
    })
  }


  boughtOrder: VOOrder;

  async findBoughtOrder() {
    /* this.boughtOrder = await this.storage.select(this.id + '-bought-order');
     if (this.boughtOrder) return Promise.resolve();*/
    const market = this.market;
    const allOrders = await this.apiPrivate.getAllOrders(
      this.base, this.coin,
      moment().subtract(23, 'hours').valueOf(),
      moment().valueOf()
    ).toPromise();
    // console.log(allOrders);
    const buyOrders = _.filter(allOrders, {base: this.base, coin: this.coin, action: 'BUY'});
    if (buyOrders.length) {
      let rate = 0;
      let fees = 0;
      let amountCoin = 0;
      const date = moment(_.last(buyOrders).timestamp).format('DD HH:mm');

      buyOrders.forEach(function (o) {
        rate += +o.rate;
        fees += +o.fee;
        amountCoin += o.amountCoin;
      });
      rate = rate / buyOrders.length;
      const initOrder = {
        uuid: '',
        isOpen: false,
        market,
        rate,
        fees,
        amountCoin,
        date
      };

      this.boughtOrder = initOrder;

    } else this.boughtOrder = {
      uuid: '',
      isOpen: false,
      market,
      rate: 0,
      fee: 0,
      amountCoin: 0,
      date: ''
    }


    // console.warn(buyOrders);
    console.log('BOUGHT ORDER ', this.boughtOrder);
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
    this.patterns = [];
    this.logs = [];
  }

  async save() {
    if (this.patterns.length) {
      const patterns = _.take(this.patterns, 500);
      this.storage.upsert(this.id + '-patterns', patterns);
    }

    if (this.boughtOrder) this.storage.upsert(this.id + '-bought-order', this.boughtOrder);
    //  this.storage.upsert(this.id + '-orders', this.orders);
    if (!this.logs.length) return;
    const logs = await this.getLogs();
    this.logs = [];
    this.storage.upsert(this.id + '-logs', _.takeRight(logs, 500));
  }

  destroy() {
    this.log({action: 'destroy', reason: ''});
    this.storage.remove(this.id);
    this.deleteHistory();
    this.stop();
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.resistanceSupport) this.resistanceSupport.destroy();
    if (this.stopLossOrder) this.stopLossOrder.destroy();
  }


}
