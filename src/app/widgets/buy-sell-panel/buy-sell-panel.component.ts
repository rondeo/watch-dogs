import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {VOBalance, VOBooks, VOOrder} from '../../models/app-models';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {MatSnackBar} from '@angular/material';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApisPublicService} from '../../apis/apis-public.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {UtilsBooks} from '../../com/utils-books';
import * as moment from 'moment';

@Component({
  selector: 'app-buy-sell-panel',
  templateUrl: './buy-sell-panel.component.html',
  styleUrls: ['./buy-sell-panel.component.css']
})
export class BuySellPanelComponent implements OnInit {

  @Input() exchange: string;
  @Input() market: string;

  @Output() newOrder: EventEmitter<VOOrder> = new EventEmitter();

  balanceBase: VOBalance;
  balanceCoin: VOBalance;

  rateBuy: number;
  rateSell: number;

  bookBuy: number;
  bookSell: number;
  bookBuy1000US: number;
  bookSell1000US: number;
  fullAmountUS: number;

 // buttonsSell: string[];
 // buttonsBuy: string[];

 // buttons: number[] = [25, 50, 75, 100];



  constructor(
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit() {
    this.downloadBooks();
   //  this.getMyOrdersHistory();
    setInterval(() => this.downloadBooks(), 60000);
  }

  async getPercentOfCoin(percent: number) {
    const ar = this.market.split('_');
    const MC = await this.marketCap.getTicker();
    const priceCoin = MC[ar[1]].price_usd;
    const half = this.fullAmountUS / 2;
    return percent * half / priceCoin
  }

  async onBuyClick(percent: number) {
    if (isNaN(this.rateBuy)) return;
    let amountCoin;
    if (this.isAbsolute) {
      amountCoin = await this.getPercentOfCoin(percent / 100);
    } else {
      const half = this.fullAmountUS / 2;
      const ar = this.market.split('_');
      const MC = await this.marketCap.getTicker();
      const amountBase = this.balanceBase.available * percent / 100;
      amountCoin = amountBase / this.rateBuy;
    }

    this.buyCoin(+amountCoin.toPrecision(5));
  }

  async onSellClick(percent: number) {
    if (isNaN(this.rateSell)) return;
    let amountCoin;
    if (this.isAbsolute) {
      amountCoin = await this.getPercentOfCoin(percent / 100);
    } else {
      amountCoin = this.balanceCoin.available * percent / 100;
    }

    this.sellCoin(+amountCoin.toPrecision(5));
  }

  async sellCoin(amount: number) {
    console.log('sell coin ' + amount + ' rate ' + this.rateSell);
    if(amount > this.balanceCoin.available) amount = this.balanceCoin.available;
    if (isNaN(this.rateSell)) return;
    const ar = this.market.split('_');
    const MC = await this.marketCap.getTicker();
    const priceCoin = MC[ar[1]].price_usd;
    const msg = 'Sell  $' + Math.round(amount * priceCoin) + '\n' + amount + '\n' + this.rateSell;

    if (confirm(msg)) {
      const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);
      try {
          const order = await api.sellLimit(ar[0], ar[1], amount, this.rateBuy).toPromise();
          this.newOrder.emit(order);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async buyCoin(amount: number) {
    console.log('buy coin ' + amount + ' rate ' + this.rateBuy);

    if (isNaN(this.rateBuy)) return;
    if(amount * this.rateBuy > this.balanceBase.available) {
      amount = this.balanceBase.available / this.rateBuy;
    }
    const ar = this.market.split('_');
    const MC = await this.marketCap.getTicker();
    const priceCoin = MC[ar[1]].price_usd;

    const msg = 'Buy $' + Math.round(amount * priceCoin) + '\n' + amount + '\n' + this.rateBuy;

    if (confirm(msg)) {
      const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);
      try {
          const order = await api.buyLimit(ar[0], ar[1], amount, this.rateBuy).toPromise();
        this.newOrder.emit(order);
      } catch (e) {
        console.warn(e);
      }

      this.getOpenOrders();
    }
  }

  onBalanceChange(bal: VOBalance) {
    const ar = this.market.split('_');
   // console.log(bal);
    if (bal.symbol === ar[0]) this.balanceBase = bal;
    if (bal.symbol === ar[1]) this.balanceCoin = bal;
    if (this.balanceBase && this.balanceCoin) {
      this.marketCap.getTicker().then(MC => {
        const balanceBase = this.balanceBase.available + this.balanceBase.pending;
        const balanceCoin = this.balanceCoin.available + this.balanceCoin.pending;
        const priceBase = ar[0] === 'USDT' ? 1 : MC[ar[0]].price_usd;
        const priceCoin = MC[ar[1]].price_usd;
        this.fullAmountUS = Math.round((balanceBase * priceBase) + (balanceCoin * priceCoin));

      })
    }

  }

  async on50_50Click() {
    const MC = await this.marketCap.getTicker();
    const ar = this.market.split('_');

    const priceBase = ar[0] === 'USDT' ? 1 : MC[ar[0]].price_usd;
    const priceCoin = MC[ar[1]].price_usd;

    const baseUS = (this.balanceBase.available + this.balanceBase.pending) * priceBase;
    const coinUS = (this.balanceCoin.available + this.balanceCoin.pending) * priceCoin;
    const diff = baseUS - coinUS;
    if (Math.abs(diff) < 20) {
      this.snackBar.open('Difference $' + diff + ' less then 20', 'x', {duration: 3000});
      return;
    }

    console.log(diff / 2);
    const amountCoin = Math.abs(diff) / 2 / priceCoin;

    if (baseUS > coinUS) {
      this.buyCoin(amountCoin);
    } else {
      this.sellCoin(amountCoin);
    }
  }

  async downloadBooks() {
    const ar = this.market.split('_');

    const api: ApiPublicAbstract = this.apisPublic.getExchangeApi(this.exchange);

    const books: VOBooks = await api.downloadBooks2(this.market).toPromise();

    this.bookBuy = books.buy[0].rate;
    if (this.focus !== 'rateBuy') this.rateBuy = this.bookBuy;
    this.bookSell = books.sell[0].rate;
    if (this.focus !== 'rateSell') this.rateSell = this.bookSell;

      const MC = await this.marketCap.getTicker();
      const priceCoin = MC[ar[1]].price_usd;
    const amountcoin1000 = 1000/priceCoin;
    this.bookBuy1000US = UtilsBooks.getRateForAmountCoin(books.buy, amountcoin1000);
    this.bookSell1000US = UtilsBooks.getRateForAmountCoin(books.sell, amountcoin1000)

  }

  focus: string;

  onFocus(field: string) {
    // console.log(field);
    this.focus = field;
  }

  async getOpenOrders() {
    const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);
    const orders = await api.getOpenOrders2(this.market).toPromise();
    console.log(orders);
  }

/*
  async getMyOrdersHistory() {
    const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);
    const orders = await api.getAllOrders2(this.market).toPromise();
    console.log(' all orders ', orders);

  }
*/

  isAbsolute: boolean = true;

  onAbsoluteChaged(evt) {
    this.isAbsolute = evt.checked;
    if (this.isAbsolute) {


    }
  }



}
