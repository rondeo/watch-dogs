import {VOBalance, VOBooks, VOOrder} from '../../models/app-models';
import {ApisPrivateService} from '../apis-private.service';
import {ApisPublicService} from '../apis-public.service';
import {ApiMarketCapService} from '../api-market-cap.service';
import * as _ from 'lodash';
import {CandlesService} from '../../app-services/candles/candles.service';
import {Observable} from 'rxjs/Observable';
import {VOCandle} from '../../models/api-models';
import {MATH} from '../../com/math';

export class FollowOpenOrder {

  base: string;
  coin: string;
  initOrder: VOOrder;
  stopLossOrder: VOOrder;
  balanceBase: VOBalance;
  balanceCoin: VOBalance;
  currentCoinRate: number;
  constructor(
    public exchange: string,
    public market: string,
    private percentStopLoss: number,
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private candlesService: CandlesService
  ) {

    const ar = market.split('_');
    this.base = ar[0];
    this.coin = ar[1];
    this.subscribeForBalances();
   //  console.log(this);

   // this.percentStopLoss = -1;
  }

  onNoBalance() {
    throw new Error('no balance');
  }

  async subscribeForBalances() {
    // return new Promise((resolve, reject) =>{
    const apiPrivate = this.apisPrivate.getExchangeApi(this.exchange);
    apiPrivate.balances$().subscribe(balances => {
      if (!balances) return;
      const MC = this.marketCap.getTicker();
      const priceCounUS = MC[this.coin] ? MC[this.coin].pice_usd : 1;
      this.balanceBase = _.find(balances, {symbol: this.base});
      this.balanceCoin = _.find(balances, {symbol: this.coin});
      // console.log(this.balanceCoin);
      if ((this.balanceCoin.available + this.balanceCoin.pending) * priceCounUS < 10) {
        this.onNoBalance();
      }
      if (this.balanceCoin.available * priceCounUS > 10) this.setStopLoss();
      else this.checkPrice();
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

  async cancelOrder(order: VOOrder) {
    const uuid = order.uuid;
    console.log(' canceling order ' +  order.coin);
    const apiPrivate = this.apisPrivate.getExchangeApi(this.exchange);
    let result;
    try {
      result =  await apiPrivate.cancelOrder(uuid, this.base, this.coin).toPromise();
    } catch (e) {
      console.error(e);
    }
  }

  async getPrice(){
    const apiPublic = this.apisPublic.getExchangeApi(this.exchange);
    //const tobuy = books.sell[0].rate;

   /* const books: VOBooks =  await this.apisPublic.getExchangeApi(this.exchange).downloadBooks(this.base, this.coin).toPromise();

    const buyPrice = books.buy[0].rate;
*/

   let candles = await this.candlesService.getCandles(this.exchange, this.market);
   if(!candles) candles = await apiPublic.downloadCandles(this.market, this.candlesService.candlesInterval, 10);
   else candles = _.takeRight(candles, 10);
    // console.log(candles);

    const closes = candles.map(function (o) {
      return o.close
    });
    return _.mean(closes);
  }

  async setStopLoss() {
    const currentPrice = await this.getPrice();
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const market = this.market;
    const qty = this.balanceCoin.available;
    const stopPrice = currentPrice + (currentPrice * this.percentStopLoss / 100);
    const sellPrice = stopPrice + (stopPrice * -0.001) ;
    console.log(' SET STOP LOSS ' + market, currentPrice,  stopPrice, sellPrice);
    try{
       const order = await api.stopLoss(market, qty, stopPrice, sellPrice);
    } catch (e) {
      if(e.toString().indexOf('no formatter') !== -1){
        const books: VOBooks =  await this.apisPublic.getExchangeApi(this.exchange).downloadBooks(this.base, this.coin).toPromise();
      }

      console.error(e);
    }




  }

  lastCheck:number
  private async checkPrice() {
    const now = Date.now();
    if(now - this.lastCheck < 6e4) return;
    this.lastCheck = now;
    const coin = this.coin;
    const openOrders = this.apisPrivate.getExchangeApi(this.exchange).getAllOpenOrders();
    if (!openOrders) return;
    const myOrder = _.find(openOrders, {coin: this.coin});
    if (!myOrder) return;

    const currentPrice = await this.getPrice();
    const diff = MATH.percent(myOrder.stopPrice, currentPrice);


    console.log('%c FOLLOWING ' + this.market + '  ' +diff, 'color:green');


     if (diff < (this.percentStopLoss * 2)) {

       this.cancelOrder(myOrder)
    }
  }

  destroy() {

  }
}
