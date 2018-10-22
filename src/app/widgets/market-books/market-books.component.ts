import {Component, EventEmitter, Input, Output, OnChanges, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';

import {UtilsBooks} from '../../com/utils-books';
import * as _ from 'lodash';

import {VOMarketCap} from '../../models/app-models';

export class BooksDisplay {
  base: string;
  coin:string;
  sell: number;
  buy: number;
  buyUS: string= '';
  sellUS: string = ''
  diff: string = '';
  us: string = ''
  constructor(obj){
    Object.assign(this, obj);
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

  isRefreshing: boolean = false;

  constructor(
    private apiMarketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService
  ) {
  }

  ngOnChanges() {
    this.ngOnInit();
  }

  ngOnInit() {
    if(!this.exchange) console.error(' no exchange');
    if(!this.market) console.error( ' no market');


   /* const baseMC = this.allCoins[base];
    const priceBaseUS = this.baseMC ? this.baseMC.price_usd : -1;
    this.coinMC = this.allCoins[coin];

    this.conMCPrice = (this.coinMC.price_usd / priceBaseUS).toFixed(8) + ' $' + this.coinMC.price_usd;*/

  }




  onRefreshClick() {
     console.log('rfresh')
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
