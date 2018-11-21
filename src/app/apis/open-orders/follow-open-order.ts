import {VOBalance, VOBooks, VOOrder} from '../../models/app-models';
import {ApisPrivateService} from '../api-private/apis-private.service';
import {ApisPublicService} from '../api-public/apis-public.service';
import {ApiMarketCapService} from '../api-market-cap.service';
import * as _ from 'lodash';
import {CandlesService} from '../../app-services/candles/candles.service';
import {Observable} from 'rxjs/Observable';
import {VOCandle, VOMCObj} from '../../models/api-models';
import {MATH} from '../../com/math';
import * as moment from 'moment';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import {StorageService} from '../../services/app-storage.service';
import {CandlesAnalys1} from '../../app-services/scanner/candles-analys1';
import {SellOnJump} from '../../app-services/app-bots-services/sell-on-jump';
import {StopLossOrder} from '../../app-services/app-bots-services/stop-loss-order';
import {ApiPrivateAbstaract} from '../api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../api-public/api-public-abstract';
import {UtilsBooks} from '../../com/utils-books';

export class FollowOpenOrder {
  static status: Subject<string> = new Subject<string>();
  base: string;
  coin: string;
  initOrder: { rate: number, fees: number, amountCoin: number, date: string };

  balanceBase: VOBalance;
  balanceCoin: VOBalance;

  apiPrivate: ApiPrivateAbstaract;
  apiPublic: ApiPublicAbstract;

  sellOnJump: SellOnJump;
  stopLossOrder: StopLossOrder;

  priceCounUS: number;
  candles: VOCandle[];
  id: string;

  logs: string[] = [];
  constructor(
    public exchange: string,
    public market: string,
    private amountCoin: number,
    public percentStopLoss: number,
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private storage: StorageService,
    private candlesService: CandlesService
  ) {

    this.id = 'follow-order-'+market;
    const ar = market.split('_');
    this.base = ar[0];
    this.coin = ar[1];
    this.init();
    // console.log(this);

    // this.percentStopLoss = -1;
  }

  getCandles() {
    return this.candlesService.getCandles(this.market)
  }

  isTooFast() {
    const now = Date.now();
    if (now - this.lastCheck < 5e4) {
      console.warn(' TOO FAST ' + this.market);
      return true
    }
    this.lastCheck = now;
    return false;
  }

  async tick() {
    if (this.isTooFast()) return;

    setTimeout(() => this.saveLogs(), 5000);
    if (!this.balanceBase) {
      this.log('NO BALANCE base');
      return;
    }
    this.candles = await this.getCandles();

    //  console.log(moment().format('HH:mm')+ ' ctr ' + this.market);



    if(this.balanceCoin.available + this.balanceCoin.pending > this.amountCoin * 0.1){
      const OK = await this.stopLossOrder.checkStopLoss(this.candles, this.balanceCoin);
      if(!OK) return;
      const  isJump = await this.sellOnJump.isJump(this.candles);
      if(isJump) {
        return;
      }

    }



   /* const candles = this.candles;
    const closes = CandlesAnalys1.closes(candles);
    const ma3 = _.mean(_.takeRight(closes, 3));
    const ma7 = _.mean(_.takeRight(closes, 7));
    const ma12 = _.min(_.takeRight(closes, 12));
    const ma3_ma12 = MATH.percent(ma3, ma12);
    const ma3_ma7 = MATH.percent(ma3, ma7);
    const progress = CandlesAnalys1.progress(candles);
    const goingUp = CandlesAnalys1.goingUp(candles);
*/
   /* if (this.sellOnJump.isJump(candles)) {
      return;
    }*/

  }

  async sellCoinInstant() {
    this.log(' SELL INSTANT ');
    const result1 = await this.stopLossOrder.cancelOrder(this.stopLossOrder.order);
    this.log(' CANCEL ORDER RESULT ' + JSON.stringify(result1));
   setTimeout(()=>{
     this.log(' Downloading books ');
     this.apisPublic.getExchangeApi(this.exchange).downloadBooks2(this.market).toPromise().then(books => {
       const qty =  this.balanceCoin.available + this.balanceCoin.pending;
       const rate = UtilsBooks.getRateForAmountCoin(books.buy, this.balanceCoin.available);
       this.log(' SELL COIN by biooks price ' + qty + ' rate ' + rate);
       const result2 = this.apiPrivate.sellLimit2(this.market, qty, rate);
       this.log(' SELL COIN RESULT ' + JSON.stringify(result2));
     })
   }, 2000)


  }

  async sellCoin(rate: number) {
    const result1 = await this.stopLossOrder.cancelOrder(this.stopLossOrder.order);
    this.log(' CANCEL ORDER RESULT ' + JSON.stringify(result1));
    const qty = this.balanceCoin.available;
    if (qty * this.priceCounUS < 20) {
      this.log(' nothing to sell ');

      setTimeout(() => this.sellCoin(rate), 10000);
      return;
    }
    if (!rate) {
      const last = _.last(this.candles);
      rate = last.close;
    }

    this.log(' SELL COIN ' + qty + ' rate ' + rate);
    const result2 = this.apiPrivate.sellLimit2(this.market, qty, rate);

  }


  async saveLogs() {
    let logs = (await this.storage.select(this.id)) || [];
    logs = logs.concat(this.logs);
    this.logs = [];
    await this.storage.upsert(this.id, _.takeRight(logs, 500));
  }

  log(message: string, save = true) {
    message = moment().format('DD-HH:mm') + ' ' + this.market + '  ' + message;
    FollowOpenOrder.status.next(message);
    if (save) this.logs.push(message);
  }

  async init() {
    this.apiPrivate = this.apisPrivate.getExchangeApi(this.exchange);
    this.apiPublic = this.apisPublic.getExchangeApi(this.exchange);

    await this.subscribeForBalances();

    this.sellOnJump = new SellOnJump(this.market, this.candlesService,  this.apiPublic);
    this.sellOnJump.log = msg => {
     //  console.log(msg);
      this.log(msg, true);
    };

    this.sellOnJump.sellCoin = () => {
      this.log(' SELL COIN by sellOnJump ', true);
      setTimeout(()=>{
        this.sellCoinInstant();
      }, 2000);

      // this.sellCoin(rate);
    };

    this.stopLossOrder = new StopLossOrder(this.market, this.amountCoin, this.apiPrivate);
    this.stopLossOrder.log = (msg) => {
      this.log(msg, true);
    };
    this.start();
  }

  async onNoBalance() {
    this.log(' NO BALANCE ', true);
    const last: any = _.last(this.candles) || {};
    last.timestamp = Date.now();
    return this.storage.upsert('no-balance' + this.exchange + this.market, last);
    // throw new Error('no balance');
  }

  sub1: Subscription;

  async subscribeForBalances() {
    // return new Promise((resolve, reject) =>{
    const MC: VOMCObj = await this.marketCap.getTicker();
    this.priceCounUS = MC[this.coin] ? MC[this.coin].price_usd : 1;

    const apiPrivate = this.apisPrivate.getExchangeApi(this.exchange);
    this.sub1 = apiPrivate.balances$().subscribe(balances => {
      if (!balances) return;

      this.balanceBase = _.find(balances, {symbol: this.base});
      const balanceCoin = _.find(balances, {symbol: this.coin});

      if (this.balanceCoin && this.balanceCoin.available !== balanceCoin.available) {
        // console.log(balanceCoin);
        this.log(' balance changed  ' + balanceCoin.symbol + ' ' + this.balanceCoin.available + ' to ' + balanceCoin.available);
      }
      this.balanceCoin = balanceCoin;
    });

  }

  async findInitOrder() {
    const market = this.market;
    const allOrders = await this.apisPrivate.getExchangeApi(this.exchange).getAllOrders(
      this.base, this.coin,
      moment().subtract(23, 'hours').valueOf(),
      moment().valueOf()
    ).toPromise();
    console.log(allOrders);
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
        market,
        rate,
        fees,
        amountCoin,
        date
      };

      this.initOrder = initOrder;

    } else this.initOrder = {rate: 0, fees: 0, amountCoin: 0, date: ''};

    this.storage.upsert('init-order' + this.exchange + market, this.initOrder);
    //console.warn(buyOrders);
    console.log(this.initOrder);
  }

  // lastQuery: number = 0;
  lastCheck: number;
  async destroy() {
   console.log('%c destroy '+ this.market, 'color:red');
    this.storage.remove(this.id);
    this.stop();
    if (this.sub1) this.sub1.unsubscribe();
    this.onEnd();
  }

  onEnd() {

  }

  checkInterval;

  async start() {
    if (this.checkInterval) return;
    this.initOrder = await this.storage.select('init-order' + this.exchange + this.market);
    if (!this.initOrder) {
      await this.findInitOrder();
      this.log(' FIRST START no init order');
      this.tick();
    }
    FollowOpenOrder.status.next(' Start following ' + this.market);
    this.checkInterval = setInterval(() => this.tick(), moment.duration(1, 'minutes'));

  }

  stop() {
    this.log(' STOPPING FOLLOW ');
    clearInterval(this.checkInterval);
    this.checkInterval = null;

  }
}
