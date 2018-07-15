import {Component, EventEmitter, Input, Output, OnChanges, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';

import {UtilsBooks} from '../../com/utils-books';
import * as _ from 'lodash';
import {VOMCAgregated} from '../../models/api-models';
import {VOMarketCap} from '../../models/app-models';

export class BooksDisplay {
  sell: string = '';
  buy: string = '';
  diff: string = '';
  us: string = ''
}

@Component({
  selector: 'app-market-books',
  templateUrl: './market-books.component.html',
  styleUrls: ['./market-books.component.css']
})
export class MarketBooksComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;

  @Output() price: EventEmitter<number> = new EventEmitter();

  bookDisplays: BooksDisplay[] = [];
  priceCoinUS: number;

  isRefreshing: boolean = false;

  private priceBaseUS: number;
  private baseMC: VOMarketCap;
  private coinMC: VOMarketCap;
  private allCoins: { [symbol: string]: VOMarketCap };

  constructor(
    private apiMarketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService
  ) {
  }

  ngOnChanges() {
    this.ngOnInit();
  }

  ngOnInit() {
    this.initAsync();
  }

  async initAsync() {
    let pair = this.market;
    if (!pair || pair.indexOf('_') === -1) return;
    let ar = pair.split('_');
    let base = ar[0];
    let coin = ar[1];
    this.allCoins = await this.apiMarketCap.getData();
    this.baseMC = this.allCoins[base];
    this.priceBaseUS = this.baseMC.price_usd;
    this.coinMC = this.allCoins[coin];
    this.priceCoinUS = this.coinMC.price_usd;
    this.downloadBooks();

  }

  // private basePrice;
  async downloadBooks() {
    const ar = this.market.split('_');
    const base = ar[0];
    const coin = ar[1];
    this.isRefreshing = true;
    const api = this.apisPublic.getExchangeApi(this.exchange);
    if (!api) throw new Error(' no api for ' + this.exchange);
    const books = await api.downloadBooks(base, coin).toPromise();
    //  console.log(books);

    const coinPrice = this.coinMC.price_usd;
    const basePrice = this.baseMC.price_usd;

    const amount1 = 500 / coinPrice;
    const amount2 = 1200 / coinPrice;
    const amount3 = 5000 / coinPrice;

    // this.basePrice = basePrice;

    const ratesBuy = UtilsBooks.getRateForAmounts(books.sell, amount1, amount2, amount3);

    const ratesSell = UtilsBooks.getRateForAmounts(books.buy, amount1, amount2, amount3);

    const booksDisplay1 = new BooksDisplay();
    const booksDisplay2 = new BooksDisplay();
    const booksDisplay3 = new BooksDisplay();
    const booksDisplay4 = new BooksDisplay();

    booksDisplay1.buy = (ratesBuy.rate1 * basePrice).toPrecision(4);
    booksDisplay1.sell = (ratesSell.rate1 * basePrice).toPrecision(4);
    booksDisplay1.us = '500';
    booksDisplay1.diff = (100 * (+booksDisplay1.buy - +booksDisplay1.sell) / +booksDisplay1.sell).toFixed(2);

    booksDisplay2.buy = (ratesBuy.rate2 * basePrice).toPrecision(4);
    booksDisplay2.sell = (ratesSell.rate2 * basePrice).toPrecision(4);
    booksDisplay2.us = '1200';
    booksDisplay2.diff = (100 * (+booksDisplay2.buy - +booksDisplay2.sell) / +booksDisplay2.sell).toFixed(2);

    booksDisplay3.buy = (ratesBuy.rate3 * basePrice).toPrecision(4);
    booksDisplay3.sell = (ratesSell.rate3 * basePrice).toPrecision(4);
    booksDisplay3.us = '5000';
    booksDisplay3.diff = (100 * (+booksDisplay3.buy - +booksDisplay3.sell) / +booksDisplay1.sell).toFixed(2);

    /* booksDisplay4.buy =  (+booksDisplay1.buy + (+booksDisplay1.buy * 0.02)).toFixed(3);
     booksDisplay4.sell =  (+booksDisplay1.sell - (+booksDisplay1.sell * 0.02)).toFixed(3);
     booksDisplay4.us = 'Inst';
     booksDisplay4.diff = (100 * (+booksDisplay4.buy - +booksDisplay4.sell)/+booksDisplay4.sell).toFixed(2);
 */
    this.bookDisplays = [booksDisplay1, booksDisplay2, booksDisplay3];

    this.isRefreshing = false;
    //  console.log(ratesBuy, ratesSell);

  }

  onRefreshClick() {
    this.downloadBooks();
  }

  onBookClick(price: number) {
    this.price.emit(+price);
  }

  onToSellClick() {
    const first = _.first(this.bookDisplays);
    if (first) {
      const toSell = +(+first.sell - (+first.sell * 0.02)).toFixed(3);
      this.price.emit(toSell);
    }

  }

  onToBuyClick() {
    const first = _.first(this.bookDisplays);
    if (first) {
      const toSell = +(+first.buy + (+first.buy * 0.02)).toFixed(3);
      this.price.emit(toSell);
    }

  }

}
