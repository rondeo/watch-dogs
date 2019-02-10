import {Component, EventEmitter, Input, Output, OnChanges, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../../adal/apis/api-market-cap.service';
import {ApisPublicService} from '../../../adal/apis/api-public/apis-public.service';

import {UtilsBooks} from '../../../acom/utils-books';
import * as _ from 'lodash';

import {VOMarketCap} from '../../../amodels/app-models';

export class BooksDisplay {
  base: string;
  coin: string;
  sell: number;
  buy: number;
  buyUS = '';
  sellUS = '';
  diff = '';
  us = '';

  constructor(obj) {

  }
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

  isRefreshing = false;

  constructor(
    private apiMarketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService
  ) {
  }

  ngOnChanges() {
    this.ngOnInit();
  }

  ngOnInit() {
    if (!this.exchange) console.error(' no exchange');
    if (!this.market) console.error( ' no market');


   /* const baseMC = this.allCoins[base];
    const priceBaseUS = this.baseMC ? this.baseMC.price_usd : -1;
    this.mcCoin = this.allCoins[coin];

    this.conMCPrice = (this.mcCoin.price_usd / priceBaseUS).toFixed(8) + ' $' + this.mcCoin.price_usd;*/

  }




  onRefreshClick() {
     console.log('rfresh');
   // this.downloadBooks();
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
