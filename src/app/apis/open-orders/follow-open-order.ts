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

export class FollowOpenOrder {
  static status: Subject<string> = new Subject<string>();
  base: string;
  coin: string;
  initOrder: { rate: number, fees: number, amountCoin: number, timestamp:number};

  balanceBase: VOBalance;
  balanceCoin: VOBalance;

  apiPrivate: ApiPrivateAbstaract;
  apiPublic: ApiPublicAbstract;

  private sellOnJump:SellOnJump;
  private stopLossOrder: StopLossOrder;

  priceCounUS: number;
  candles: VOCandle[];
  constructor(
    public exchange: string,
    public market: string,
    public percentStopLoss: number,
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private storage: StorageService,
    private candlesService: CandlesService
  ) {

    const ar = market.split('_');
    this.base = ar[0];
    this.coin = ar[1];
    this.init();
    // console.log(this);

    // this.percentStopLoss = -1;
  }

  getCandles(){
    return this.candlesService.getCandles(this.exchange, this.market,'5m')
  }

  isTooFast(){
    const now = Date.now();
    if (now - this.lastCheck < 5e4) {
      console.log(' TOO FAST ctr ' + this.market);
      return true
    }
    this.lastCheck = now;
    return false;
  }


  async tick() {

    if(this.isTooFast()) return;
    this.candles = await this.getCandles();
    if(!this.balanceCoin){
      this.log('tick no balance coin ');
      return;
    }

    if ((this.balanceCoin.available + this.balanceCoin.pending) * this.priceCounUS < 10) {
      this.onNoBalance().then(()=>{
        this.destroy();
        this.onEnd();
      });
      return;
    }
    //  console.log(moment().format('HH:mm')+ ' ctr ' + this.market);

    if (this.balanceCoin.available * this.priceCounUS > 10) {
      this.stopLossOrder.setStopLoss(this.candles, this.balanceCoin.available);
      return;
    }

    if(!this.stopLossOrder.order) {
      this.stopLossOrder.setStopLoss(this.candles, this.balanceCoin.available);
      return;
    }

    const coin = this.coin;

    if(!this.initOrder) {
      await this.findInitOrder();
      return;
    }

    const candles =  this.candles;
    const closes = CandlesAnalys1.closes(candles);
    const ma3 = _.mean(_.takeRight(closes, 3));
    const ma7 = _.mean(_.takeRight(closes, 7));
    const ma12 = _.min(_.takeRight(closes, 12));
    const ma3_ma12 = MATH.percent(ma3, ma12);
    const ma3_ma7 = MATH.percent(ma3, ma7);
    const progress = CandlesAnalys1.progress(candles);
    const goingUp = CandlesAnalys1.goingUp(candles);

    if(this.sellOnJump.isJump(candles)) {
      return;
    }
    await this.stopLossOrder.checkStopLossPrice(this.candles, this.balanceCoin.available);
  }

  async sellCoin(){
   const result1 =  await this.stopLossOrder.cancelOrder();
   const qty = this.balanceCoin.available;
   if(qty * this.priceCounUS < 20) {
     this.log(' nothing to sell ');

     setTimeout(()=>this.sellCoin(), 10000);
     return;
   }
    const last = _.last(this.candles);
    const rate = last.close;
    this.log(' SELL COIN ' + qty + ' rate ' + rate);
   //  const result2 = this.apiPrivate.sellLimit2(this.market, qty, rate );

  }

  async log(message:string, save = true){
    message = moment().format('DD HH:mm') + ' ' + this.market + '  ' +message;
    FollowOpenOrder.status.next(message);
    if(save) {
      const logs = (await this.storage.select('follow-order-log' + this.market)) || [];
      logs.push(message);
      await this.storage.upsert('follow-order-log'+ this.market , _.takeRight(logs, 500));
    }

  }

  async init(){
    this.apiPrivate = this.apisPrivate.getExchangeApi(this.exchange);
    this.apiPublic = this.apisPublic.getExchangeApi(this.exchange);

   this.initOrder =   await this.storage.select('init-order' + this.exchange + this.market);
   if(!this.initOrder) await this.findInitOrder();
   await  this.subscribeForBalances();

   this.sellOnJump = new SellOnJump(this.market);
    this.sellOnJump.log = msg =>{
      this.log(msg, true);
    }
    this.sellOnJump.sellCoin = ()=>{
      this.log(' SELL COIN by sellOnJump');
      this.sellCoin();
    }

   this.stopLossOrder = new StopLossOrder(this.market, this.percentStopLoss,this.apiPrivate);
    this.stopLossOrder.log = (msg) =>{
      this.log(msg + ' stopLossOrder');
    }
    this.start();
  }

  async onNoBalance() {
    this.log(' NO BALANCE ', true);
    const last: any = _.last(this.candles) || {};
    last.timestamp = Date.now();
    return this.storage.upsert('no-balance'+  this.exchange + this.market, last);
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


    /*apiPrivate.allOpenOrders$().subscribe(orders => {
      console.log(orders);
      const myOpenOrder = _.find(orders, {coin: this.coin, base: this.base, action: 'STOP_LOSS'});
      if (myOpenOrder) {
        this.stopLossOrder = myOpenOrder;
      } else {
        console.log(' no my stop loss order')
      }
    });*/


    /*this.apisPublic.getExchangeApi(this.exchange).ticker5min$(this.market).subscribe(ticker =>{
      console.log(ticker);
    })*/

  }

  async findInitOrder() {
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
      const timestamp = _.last(buyOrders).timestamp;

      buyOrders.forEach(function (o) {
        rate += +o.rate;
        fees += +o.fee;
        amountCoin += o.amountCoin;
      });
      rate = rate/buyOrders.length;
      const market = this.market;
      const initOrder = {
        market,
        rate,
        fees,
        amountCoin,
        timestamp
      };

      this.initOrder = initOrder;

    } else this.initOrder = {rate: 0, fees:0, amountCoin: 0, timestamp:0 }

    this.storage.upsert('init-order' + this.exchange + this.market, this.initOrder);
    console.warn(buyOrders);
    console.log(this.initOrder)
  }

  /*getPrice(candles:VOCandle[]){
    const closes = _.takeRight(candles, 18).map(function (o) {
      return o.close;
    });

    const price = MATH.median(closes);
    if(isNaN(price)) throw new Error(this.market + closes.toString());
    return price;
  }
*/

  lastQuery: number = 0;
  lastCheck: number;
  destroy() {
    this.log('DESTROY FOLLOW');
    this.stop();
    if (this.sub1) this.sub1.unsubscribe();
    this.storage.remove('init-order' + this.exchange + this.market);
  }

  onEnd(){

  }
  checkInterval;

  start() {
    if (this.checkInterval) return;
    FollowOpenOrder.status.next(' Start following ' + this.market);
    this.checkInterval = setInterval(() => this.tick(), moment.duration(3, 'minutes'));
  }

  stop() {
    this.log(' STOPPING FOLLOW ');
    clearInterval(this.checkInterval);
    this.checkInterval = null;

  }
}
