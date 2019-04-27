import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {VOBalance, VOBooks, VOOrder, VOOrderExt} from '../../amodels/app-models';
import {ApiMarketCapService} from '../../a-core/apis/api-market-cap.service';
import {MatDialog, MatSnackBar} from '@angular/material';
import {ApisPrivateService} from '../../a-core/apis/api-private/apis-private.service';
import {ApiPrivateAbstaract} from '../../a-core/apis/api-private/api-private-abstaract';
import {ApisPublicService} from '../../a-core/apis/api-public/apis-public.service';
import {ApiPublicAbstract} from '../../a-core/apis/api-public/api-public-abstract';
import {UtilsBooks} from '../../acom/utils-books';
import * as moment from 'moment';
import * as _ from 'lodash';
import {ActivatedRoute, Router} from '@angular/router';
import {MATH} from '../../acom/math';
import {MarketsHistoryService} from '../../a-core/app-services/market-history/markets-history.service';
import {ConfirmStopLossComponent} from '../confirm-stop-loss/confirm-stop-loss.component';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-buy-sell-panel',
  templateUrl: './buy-sell-panel.component.html',
  styleUrls: ['./buy-sell-panel.component.css']
})
export class BuySellPanelComponent implements OnInit, OnDestroy {


  constructor(
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private marketsHistory: MarketsHistoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.exchanges = this.apisPrivate.getAllAvailable();
  }


  exchanges: string[];
  markets = ['USDT_BTC'];
  // @Input();
  exchange: string;
  // @Input()
  market: string;
  @Input() displayNewOrder = true;
  // @Output() newOrder: EventEmitter<VOOrder> = new EventEmitter();

  selectedExchange: string;

  // balanceBase: VOBalance;
  // balanceCoin: VOBalance;

  coin: string;
  base: string;

  rateBuy: number;
  rateSell: number;

  bookBuy: number;
  bookSell: number;
  bookBuy1000US: number;
  bookSell1000US: number;
  //  fullAmountUS: number;
  tradingAmountUS: number;
  tradingBalanceBaseUS: number;
  tradingBalanceBasePendingUS: number;

  pendingBaseUS = 0;

  balanceCoinAvailable: number;
  balanceCoinAvailableUS: number;
  balanceCoinPendingUS: number;


  sliderSellValue: number;

  volumes: number[];

  private sub1: Subscription;
  private sub2: Subscription;
  private sub3: Subscription;
  private sub4: Subscription;

  focusBuy = 'first';
  focusSell = 'first';

  ordersHistoryAfter: number;
  /*

    onNewOrder(order: VOOrder) {

      //this.downloadAllAndOpenOrders();
      // this.newOrder.emit(order);
    }
  */


  isAbsolute = true;


  onMarketChange(evt) {
    console.log(evt);

  }

  onSladerSellChange(evt) {
    const val = evt.value / 100;
    this.focusSell = null;
    this.rateSell = +(this.bookSell + (this.bookSell * val)).toPrecision(5);
  }

  onSladerBuyChange(evt) {
    const val = evt.value / 100;
    this.focusBuy = null;
    this.rateBuy = +(this.bookBuy + (this.bookBuy * val)).toPrecision(5);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      // console.log(params);
      // console.log(this.exchange);
      if (this.exchange !== params.exchange) this.exchange = params.exchange;
      if (this.market !== params.market) this.market = params.market;
      const ar = this.market.split('_');
      this.base = ar[0];
      this.coin = ar[1];
      this.tradingAmountUS = +localStorage.getItem('tradingAmount-' + this.exchange + '-' + this.market);
      this.subscribe();
      this.downloadBooks();
    });

    //  this.getMyOrdersHistory();
    setInterval(() => this.downloadBooks(), 60000);

  }

  async getPercentOfCoin(percent: number) {
    const ar = this.market.split('_');
    const MC = await this.marketCap.getTicker();
    const priceCoin = MC[ar[1]].price_usd;
    const half = this.tradingAmountUS / 2;
    return percent * half / priceCoin;
  }

  async onBuyClick(percent: number) {
    await this.downloadBooks();
    if (isNaN(this.rateBuy)) return;
    const MC = await this.marketCap.getTicker();
    percent = percent / 100;
    let amountUS = percent * this.tradingAmountUS / 2;
    if (amountUS > this.tradingBalanceBaseUS) amountUS = this.tradingBalanceBaseUS;
    if (amountUS < 10) {
      this.snackBar.open('Minimum trading amount $10 got ' + amountUS, 'x', {duration: 3000});
      return;
    }
    const priceBase = MC[this.base].price_usd;
    const amountBase = amountUS / priceBase;
    let amountCoin = amountBase / this.rateBuy;
    amountCoin = +amountCoin.toPrecision(5);
    /*let amountCoin;
    if (this.isAbsolute) {
      amountCoin =  amountBase / this.rateBuy;
    } else {
      const half = this.tradingAmountUS / 2;
      const ar = this.market.split('_');
      const amountBase = this.balanceBase.available * percent / 100;
      amountCoin = amountBase / this.rateBuy;
    }*/
    this.buyCoin(amountCoin);
  }

  async setStopLoss() {
    const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);
    const openOrders: VOOrder[] = api.openOrdersSub.getValue();
    console.log(openOrders);

    const rate = this.rateBuy;
    if (isNaN(rate)) return;
    // if(!openOrders.length) {
    try {
      const MC = await this.marketCap.getTicker();
      const priceCoin = MC[this.coin].price_usd;
      const coinAmount = (this.balanceCoinAvailable - (this.balanceCoinAvailable * 0.002));

      const percent = MATH.percent(rate, this.bookSell);

      let msg;

      if (coinAmount * priceCoin < 10) msg = 'Not enough amount';

      const ref = this.dialog.open(ConfirmStopLossComponent, {data: {rate, msg}});
      if (coinAmount * priceCoin < 10) return;
      const data: { stopPrice: number, sellPrice: number } = await ref.afterClosed().toPromise();
      if (!data) return;
      const res = await api.stopLoss(this.market, coinAmount, data.stopPrice, data.sellPrice);

    } catch (e) {
      console.warn(e);
      this.snackBar.open('ERROR ' + e.message, 'x', {panelClass: 'error'});
    }

    // }
  }


  stopLossClick() {
    this.setStopLoss();
  }

  async onSellClick(percent: number) {
    await this.downloadBooks();
    if (isNaN(this.rateSell)) return;
    percent = percent / 100;
    let amountUS = percent * this.tradingAmountUS / 2;
    if (amountUS > this.balanceCoinAvailableUS) amountUS = this.balanceCoinAvailableUS;

    if (amountUS < 10) {
      this.snackBar.open('Minimum trading amount $10 got ' + amountUS, 'x', {duration: 3000});
      return;
    }
    const MC = await this.marketCap.getTicker();
    const priceCoin = MC[this.coin].price_usd;
    let amountCoin = amountUS / priceCoin;
    amountCoin = +amountCoin.toPrecision(5);


    /*  let amountCoin;
      if (this.isAbsolute) {

        amountCoin = await this.getPercentOfCoin(percent / 100);
      } else {
        amountCoin = this.balanceCoin.available * percent / 100;*/
    // }

    this.sellCoin(amountCoin);
  }

  async sellCoin(amount: number) {
    const rateSell = this.rateSell;
    console.log('sell coin ' + amount + ' rate ' + rateSell);
    if (amount > this.balanceCoinAvailable) amount = this.balanceCoinAvailable;
    if (isNaN(rateSell)) return;
    const ar = this.market.split('_');
    const MC = await this.marketCap.getTicker();
    const priceCoin = MC[ar[1]].price_usd;
    const msg = 'Sell  $' + Math.round(amount * priceCoin) + '\n' + amount + '\n' + rateSell;

    if (!await this.confirm(msg)) return;
    const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);


    try {
      const order = await api.sellLimit2(this.market, amount, rateSell);

      // this.newOrder.emit(order);
    } catch (e) {
      console.warn(e);
    }

    this.focusBuy = 'first';
    this.focusSell = 'first';
    // api.startRefreshBalances();
  }

  async buyCoin(amount: number) {
    const rateBuy = this.rateBuy;
    console.log('buy coin ' + amount + ' rate ' + rateBuy);
    if (isNaN(this.rateBuy)) return;

    /*if (amount * this.rateBuy > this.balanceBase.available) {
      amount = this.balanceBase.available / rateBuy;
    }*/
    const ar = this.market.split('_');
    const MC = await this.marketCap.getTicker();
    const priceCoin = MC[ar[1]].price_usd;

    let msg = 'Buy $' + Math.round(amount * priceCoin) + '\n' + amount + '\n' + rateBuy;
    const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);
    if (!await this.confirm(msg)) return;
    try {

      const order = await api.buyLimit2(this.market, amount, rateBuy);
      msg = 'New Order ' + order.action + ' ' + order.isOpen ? 'Open' : 'Closed';
      this.snackBar.open(msg, 'x', {duration: 30000});
      // api.refreshAllOpenOrders();
      // this.onNewOrder(order);

    } catch (e) {
      this.snackBar.open('ERROR ' + e.message, 'x', {panelClass: 'error'});
      console.warn(e);
    }
    this.focusBuy = 'first';
    this.focusSell = 'first';
    // api.startRefreshBalances();
  }

  async confirm(msg) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (confirm(msg)) resolve(true);
        else resolve(false);
      }, 100);
    });
  }

  subscribe() {
    if (!this.exchange || !this.market) return;
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.sub4) this.sub4.unsubscribe();
    const base = this.base;
    const coin = this.coin;

    /*   const history = this.marketsHistory.getOrdersHistory('bitfinex', 'USDT_BTC');
       history.signalBuySell$().subscribe(signal =>{
         console.warn(moment().format('HH:mm'), signal);
         this.snackBar.open(moment().format('HH:mm') + ' ' +signal.type + ' '+signal.rate);
       });
   */
    this.marketCap.getTicker().then(MC => {

      const priceBase = base === 'USDT' ? 1 : MC[base].price_usd;
      const priceCoin = MC[coin].price_usd;
      const api = this.apisPrivate.getExchangeApi(this.exchange);
      this.sub1 = api.balance$(base).subscribe((balance: VOBalance) => {

        const balanceBase = balance.available + balance.pending;
        if (!this.tradingAmountUS) this.tradingBalanceBaseUS = Math.round(balanceBase * priceBase);

        //  const tradingBalanceBaseUS = this.tradingAmountUS? this.tradingAmountUS - balanceCoinUS: (balanceBase * priceBase);
      });

      this.sub2 = api.balance$(coin).subscribe((balance: VOBalance) => {
        this.balanceCoinAvailable = balance.available;


        const balanceCoinAvailableUS = Math.round(balance.available * priceCoin);
        this.balanceCoinPendingUS = Math.round(balance.pending * priceCoin);
        this.balanceCoinAvailableUS = balanceCoinAvailableUS;
        this.calculateBase();
      });

      this.sub3 = api.openOrders$(base, coin).subscribe(orders => {
        let sum = 0;
        orders.forEach(function (item) {
          if (item.action === 'BUY') sum += item.amountCoin;
        });
        this.pendingBaseUS = Math.round(priceCoin * sum);
        this.calculateBase();
      });
    });

  }

  calculateBase() {
   //  if (this.tradingAmountUS) this.tradingBalanceBaseUS = this.tradingAmountUS
    // - (this.balanceCoinPendingUS + this.balanceCoinAvailableUS) - this.pendingBaseUS;
  }

  /* async getBalances(){
     if(!this.exchange || ! this.market) return;
     const api = this.apisPrivate.getExchangeApi(this.exchange);
     const ar = this.market.split('_');
     const balanceBase:VOBalance  =  await api.getBalance(ar[0]);
     if(!this.balanceBase || this.balanceBase.available !== balanceBase.available) this.onBalanceChange(balanceBase);

     const balanceCoin: VOBalance = await api.getBalance(ar[1]);
     if(!this.balanceCoin || this.balanceCoin.available !== balanceCoin.available) this.onBalanceChange(balanceCoin);

   }*/

  onBalanceChange(deltaUS: number) {
    /* const ar = this.market.split('_');
     // console.log(bal);
     if (bal.symbol === ar[0]) this.balanceBase = bal;
     if (bal.symbol === ar[1]) this.balanceCoin = bal;
     if (this.balanceBase && this.balanceCoin) {
       this.marketCap.getTicker().then(MC => {
         const balanceBase = this.balanceBase.available + this.balanceBase.pending;
         const balanceCoin = this.balanceCoin.available + this.balanceCoin.pending;
         const priceBase = ar[0] === 'USDT' ? 1 : MC[ar[0]].price_usd;
         const priceCoin = MC[ar[1]].price_usd;
         const balanceCoinUS = (balanceCoin * priceCoin);
         const tradingBalanceBaseUS = this.tradingAmountUS? this.tradingAmountUS - balanceCoinUS: (balanceBase * priceBase);
         this.tradingBalanceBaseUS = Math.round(tradingBalanceBaseUS);
         this.balanceCoinUS = Math.round(balanceCoinUS);

         if(!this.tradingAmountUS) this.tradingAmountUS = Math.round((balanceBase * priceBase) + (balanceCoin * priceCoin))

       })
     }*/

    this.downloadAllAndOpenOrders();

  }

  async on50_50Click() {
    await this.downloadBooks();
    const MC = await this.marketCap.getTicker();
    const ar = this.market.split('_');

    const priceBase = ar[0] === 'USDT' ? 1 : MC[ar[0]].price_usd;
    const priceCoin = MC[ar[1]].price_usd;


    const baseUS = this.tradingBalanceBaseUS;
    const coinUS = this.balanceCoinAvailableUS + this.balanceCoinPendingUS;
    const diff = baseUS - coinUS;
    if (Math.abs(diff) < 20) {
      this.snackBar.open('Difference $' + diff + ' less then 20', 'x', {duration: 3000});
      return;
    }
    //  console.log(diff / 2);
    const amountCoin = Math.abs(diff) / 2 / priceCoin;

    if (baseUS > coinUS) {
      this.buyCoin(amountCoin);
    } else {
      this.sellCoin(amountCoin);
    }
  }


  async downloadBooks() {
    if (!this.market || !this.exchange) return;
    const ar = this.market.split('_');
    const api: ApiPublicAbstract = this.apisPublic.getExchangeApi(this.exchange);
    const books: VOBooks = await api.downloadBooks2(this.market).toPromise();

    this.bookBuy = books.buy[0].rate;
    this.bookSell = books.sell[0].rate;
    const MC = await this.marketCap.getTicker();
    const priceCoin = MC[ar[1]].price_usd;
    const amountCoin1000 = 1000 / priceCoin;
    this.bookBuy1000US = UtilsBooks.getRateForAmountCoin(books.buy, amountCoin1000);
    this.bookSell1000US = UtilsBooks.getRateForAmountCoin(books.sell, amountCoin1000);
    this.showRate();
  }

  private showRate() {
    if (this.focusBuy === 'first') this.rateBuy = this.bookBuy;
    else if (this.focusBuy === 'b1000') this.rateBuy = this.bookBuy1000US;
    if (this.focusSell === 'first') this.rateSell = this.bookSell;
    else if (this.focusSell === 'b1000') this.rateSell = this.bookSell1000US;
  }

  onFocusBuy(field: string) {
    // console.log(field);
    this.focusBuy = field;
    this.showRate();
  }

  onFocusSell(field: string) {
    this.focusSell = field;
    this.showRate();
  }

  /* async getOpenOrders() {
     const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);
     const orders = await api.getOpenOrders2(this.market).toPromise();
     console.log(orders);
   }*/


  downloadAllAndOpenOrders() {
    this.ordersHistoryAfter = moment().subtract(20, 'hours').valueOf();
  }

  onSignal(signal) {
    this.snackBar.open(moment().format('HH:mm') + ' ' + signal.type + ' ' + signal.rate);
  }

  onAbsoluteChaged(evt) {
    this.isAbsolute = evt.checked;
    if (this.isAbsolute) {

    }
  }

  onExcgangeChange(evt) {
    this.router.navigate(['/my-exchange/buy-sell-panel/' + this.exchange + '/' + this.market]);
  }


  onTradinAmontChanged() {
    localStorage.setItem('tradingAmount-' + this.exchange + '-' + this.market, String(this.tradingAmountUS));
  }

  ngOnDestroy() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.sub2) this.sub3.unsubscribe();
  }

}
