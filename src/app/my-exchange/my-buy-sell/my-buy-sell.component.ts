import {Component, OnInit, ViewChild} from '@angular/core';
import {VOBalance, VOBooks, VOMarket, VOOrder} from '../../models/app-models';
import {Subscription} from 'rxjs/Subscription';
import {ActivatedRoute, Router} from '@angular/router';
import {ConnectorApiService} from '../../../../archive/services/connector-api.service';
import {ApiBase} from '../../../../archive/services/apis/api-base';
import {Observable} from 'rxjs/Observable';
import {MatDialog, MatSnackBar} from '@angular/material';
import {UtilsOrder} from '../../com/utils-order';
import {placeOrder} from './place-order';
import {ApisPrivateService} from '../../apis/api-private/apis-private.service';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {UtilsBooks} from '../../com/utils-books';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {MATH} from '../../com/math';
import * as _ from 'lodash';
import {ConfirmStopLossComponent} from '../confirm-stop-loss/confirm-stop-loss.component';
import {FollowOrdersService} from '../../apis/open-orders/follow-orders.service';

@Component({
  selector: 'app-my-buy-sell',
  templateUrl: './my-buy-sell.component.html',
  styleUrls: ['./my-buy-sell.component.css']
})

export class MyBuySellComponent implements OnInit {


  markets: string[];
  selectedMarket: string;
  ordersRefresh: number;


  exchange: string;
  market: string;
  coin: string;
  base: string;

  amountUS: number = 100;
  userRate: number;

  isBuyDisabled = false;
  isSellDisabled = false;


  rateBuy: number;
  rateSell: number;
  bookBuy: number;
  bookSell: number;

  bookBuy1000US: number;
  bookSell1000US: number;


  //priceBaseUS:number;
  amountBase: number = 0;

  /////////////////////
  priceCoin: number;
  amountCoin: number;
  balanceBase: VOBalance;
  balanceCoin: VOBalance;

  isInstant: boolean = true;


  // marketInit:{base:string, coin:string, exchange:string, priceBaseUS:number, rate:number, market:string} = {base:'', coin:'', exchange:'', market:'',priceBaseUS:0, rate:0};
  selectedMarketExchange = {exchange:null, market:null};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private marketCap: ApiMarketCapService,
    private followOrders: FollowOrdersService
  ) {

  }

  onMarketExchangeChange(evt) {
    this.selectedMarketExchange = evt;
  }

  onStopFollowClick() {
    this.followOrders.stopFollow(this.exchange, this.market);
  }

  onUserPriceChanged(rate) {

  }


  books: VOBooks;


  async downloadBooks() {
    if (!this.market || !this.exchange) return;
    const ar = this.market.split('_');
    const api: ApiPublicAbstract = this.apisPublic.getExchangeApi(this.exchange);
    const books: VOBooks = await api.downloadBooks2(this.market).toPromise();
    this.bookBuy = books.buy[0].rate;
    this.bookSell = books.sell[0].rate;
    this.books = books;
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

  focusBuy = 'first';
  focusSell = 'first';


  onFocusBuy(field: string) {
    // console.log(field);
    this.focusBuy = field;
    this.showRate();
  }

  onFocusSell(field: string) {
    this.focusSell = field;
    this.showRate();
  }

  async onBuyClick() {
    let action = 'BUY';
    await this.downloadBooks();

    if (isNaN(this.rateBuy)) return;
    const MC = await this.marketCap.getTicker();
    let amountUS = this.amountUS;
    const priceBase = this.base === 'USDT' ? 1 : MC[this.base].price_usd;
    let amountBase = amountUS / priceBase;
    if (this.balanceBase.available < amountBase) amountBase = this.balanceBase.available;
    if (amountBase * priceBase < 9) {
      alert('Low amount $' + (amountBase * priceBase).toFixed(2));
      return
    }
    let amountCoin = amountBase / this.rateBuy;
    amountCoin = +amountCoin.toPrecision(5);
    this.buyCoin(amountCoin);
  }

  async buyCoin(amount: number) {
    let rateBuy = +this.rateBuy;
    if(this.isInstant){
      rateBuy = UtilsBooks.getRateForAmountCoin(this.books.sell, amount);
      this.rateBuy = rateBuy;
    }
   /* if (rateBuy === this.rateSell) {
      console.warn(' rate buy === rate sell');
      rateBuy = this.rateBuy;
    }*/
    const precision = rateBuy.toString();
    console.log('buy coin ' + amount + ' rate ' + rateBuy);
    if (isNaN(rateBuy)) {
      console.warn(' rateBuy ' + rateBuy)
      return;
    }

    /*if (amount * this.rateBuy > this.balanceBase.available) {
      amount = this.balanceBase.available / rateBuy;
    }*/
    const ar = this.market.split('_');
    const MC = await this.marketCap.getTicker();
    const priceCoin = MC[ar[1]].price_usd;

    const msg = 'Buy $' + Math.round(amount * priceCoin) + '\n' + amount + '\n' + rateBuy;
    const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);
    if (!await this.confirm(msg)) return;
    try {

      const order = await api.buyLimit2(this.market, amount, rateBuy);

      const msg = 'New Order ' + order.action + ' ' + order.isOpen ? 'Open' : 'Closed';
      this.snackBar.open(msg, 'x', {duration: 30000});
      // api.refreshAllOpenOrders();
      //this.onNewOrder(order);

    } catch (e) {
      this.snackBar.open('ERROR ' + e.message, 'x', {extraClasses: 'error'});
      console.warn(e);
    }
    this.focusBuy = 'first';
    this.focusSell = 'first';
    //api.startRefreshBalances();
  }

  async onSellClick() {
    await this.downloadBooks();

    if (isNaN(this.rateSell)) return;
    let amountUS = this.amountUS;
    const MC = await this.marketCap.getTicker();
    const priceCoin = MC[this.coin].price_usd;
    let amountCoin = amountUS / priceCoin;
    if (amountCoin + (amountCoin/10) > this.balanceCoin.available) amountCoin = this.balanceCoin.available;

    if (amountCoin * priceCoin < 9) {
      const msg = 'Minimum trading amount $10 got ' + (amountCoin * priceCoin).toFixed(2);
      this.snackBar.open(msg, 'x', {duration: 3000});
      return;
    }
    amountCoin = +amountCoin.toPrecision(5);
    this.sellCoin(amountCoin);
  }

  async sellCoin(amount: number) {
    let rateSell = this.rateSell;
    if(this.isInstant){
      rateSell = UtilsBooks.getRateForAmountCoin(this.books.buy, amount);
      this.rateSell = rateSell;
    }
    if (isNaN(this.rateSell)) return;
    // rateSell = MATH.addDecimal(this.rateSell, -1);
    console.log('sell coin ' + amount + ' rate ' + rateSell);

    const ar = this.market.split('_');
    const MC = await this.marketCap.getTicker();
    const priceCoin = MC[ar[1]].price_usd;
    const msg = 'Sell  $' + Math.round(amount * priceCoin) + '\n' + amount + '\n' + rateSell;

    if (!await this.confirm(msg)) return;
    const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);


    try {
      const order = await api.sellLimit2(this.market, amount, rateSell);

      //this.newOrder.emit(order);
    } catch (e) {
      console.warn(e);
    }

    this.focusBuy = 'first';
    this.focusSell = 'first';
    // api.startRefreshBalances();
  }

  async setStopLoss() {
    const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);
    const openOrders: VOOrder[] = api.openOrdersSub.getValue();
    console.log(openOrders);

    const rate = this.rateBuy;
    if (isNaN(rate)) return;
    //if(!openOrders.length) {
    try {
      const MC = await this.marketCap.getTicker();
      const priceCoin = MC[this.coin].price_usd;
      const coinAmount = (this.balanceCoin.available - (this.balanceCoin.available * 0.002));

      const percent = MATH.percent(rate, this.bookSell);

      let msg = 'STOP LOSS';

      if (coinAmount * priceCoin < 10) msg = 'Not enough amount';

      const ref = this.dialog.open(ConfirmStopLossComponent, {data: {rate, msg}});
      if (coinAmount * priceCoin < 10) return;
      const data: { stopPrice: number, sellPrice: number } = await ref.afterClosed().toPromise();
      if (!data) return;

      console.log(coinAmount, data.stopPrice, data.sellPrice);
      const res = await api.stopLoss(this.market, coinAmount, data.stopPrice, data.sellPrice);

    } catch (e) {
      console.warn(e);
      this.snackBar.open('ERROR ' + e.message, 'x', {extraClasses: 'error'});
    }

    // }
  }


  stopLossClick() {
    this.setStopLoss();
  }

  async confirm(msg) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (confirm(msg)) resolve(true);
        else resolve(false);
      }, 100);
    })
  }

  newOrder: VOOrder;

  private sub1: Subscription;
  private sub2: Subscription;
  private sub3: Subscription;

  ngOnDestroy() {
    if (this.sub1) this.sub1.unsubscribe();
    this.unsubscribe();
  }


  marketHistoryData: { priceBaseUS: number, history: VOOrder[] };
  marketSummaryData: { summary: VOMarket, priceBaseUS: number }

  //marketSummary:VOMarket;


  unsubscribe() {
    if (this.sub2) this.sub2.unsubscribe();
    if (this.sub3) this.sub3.unsubscribe();
  }

  async subscribe() {
    this.unsubscribe();
    if (!this.exchange || !this.market) return;
    const ar = this.market.split('_');
    this.base = ar[0];
    this.coin = ar[1];
    const MC = this.marketCap.getTicker();
   this.sub2 =  this.apisPrivate.getExchangeApi(this.exchange).balances$().subscribe(balances =>{
      this.balanceBase = _.find(balances, {symbol:this.base});
     this.balanceCoin = _.find(balances, {symbol:this.coin});

    });

 /*   this.marketCap.getTicker().then(MC => {

      const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);

      api.balance$(ar[0]).subscribe(balance => {
        // if (ar[0] === 'USDT') MC[ar[0]].price_usd = 1;
        this.balanceBase = balance;
        //this.balanceBaseUS = +(balance.available + MC[ar[0]].price_usd).toPrecision(0);
      });
      api.balance$(ar[1]).subscribe(balance => {
        this.balanceCoin = balance;
        //this.balanceCoinUS = +(balance.available + MC[ar[1]].price_usd).toPrecision(0);

      });
    });*/
    this.downloadBooks();
  }

  ngOnInit() {
    this.sub1 = this.route.params.subscribe(params => {
      console.log(params);
      this.exchange = params.exchange;
      this.market = params.market;
      const api = this.apisPublic.getExchangeApi(this.exchange);

      if (api) api.getMarkets().then(M => {
        this.markets = Object.keys(M).sort();
        if (this.market && !this.selectedMarket) this.selectedMarket = this.market
      });

      this.subscribe();
    });


  }

  onMarketSelected($event) {
    const market = $event.value;
    this.router.navigateByUrl('my-exchange/buy-sell/' + this.exchange + '/' + market)
  }

  onAmountChanged(amount) {
    this.amountUS = amount;

  }


}
