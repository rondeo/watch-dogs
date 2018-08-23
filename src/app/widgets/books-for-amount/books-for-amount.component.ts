import {Component, Input, OnChanges, OnInit, SimpleChange, SimpleChanges} from '@angular/core';
import {BooksDisplay} from '../market-books/market-books.component';
import {UtilsBooks} from '../../com/utils-books';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {VOMarketCap} from '../../models/app-models';

@Component({
  selector: 'app-books-for-amount',
  templateUrl: './books-for-amount.component.html',
  styleUrls: ['./books-for-amount.component.css']
})
export class BooksForAmountComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;
  @Input() amountUS: number;

  booksDisplay: BooksDisplay = new BooksDisplay();

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

  ngOnChanges(evt: any) {
    if (evt.exchange && evt.market) {

    } else if (evt.amountUS) {
      // console.log(this.amountUS);
      this.calculate();
    }

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
    this.allCoins = await this.apiMarketCap.getTicker();
    this.baseMC = this.allCoins[base];
    this.priceBaseUS = this.baseMC ? this.baseMC.price_usd : -1;
    this.coinMC = this.allCoins[coin];
    this.priceCoinUS = this.coinMC ? this.coinMC.price_usd : -1;
    this.downloadBooks();
  }


  private calculate() {

    const coinPrice = this.coinMC.price_usd;
    const basePrice = this.baseMC.price_usd;
    const amount = this.amountUS / coinPrice;
    const ratesBuy = UtilsBooks.getRateForAmountCoin(this.books.sell, amount);
    const ratesSell = UtilsBooks.getRateForAmountCoin(this.books.buy, amount);

    const booksDisplay1 = new BooksDisplay();

    booksDisplay1.buy = (ratesBuy * basePrice).toPrecision(4);
    booksDisplay1.sell = (ratesSell * basePrice).toPrecision(4);
    if (+booksDisplay1.buy && +booksDisplay1.sell) {
      booksDisplay1.diff = (100 * (+booksDisplay1.buy - +booksDisplay1.sell) / +booksDisplay1.sell).toFixed(2);
    } else booksDisplay1.diff = '0';


    this.booksDisplay = booksDisplay1;
  }

  private books;

  async downloadBooks() {
    if (!this.baseMC || !this.coinMC) return;
    this.isRefreshing = true;
    const api = this.apisPublic.getExchangeApi(this.exchange);
    if (!api) throw new Error(' no api for ' + this.exchange);
    this.books = await api.downloadBooks(this.baseMC.symbol, this.coinMC.symbol).toPromise();
    this.isRefreshing = false;
    //console.log(this.books);
    //  console.log(books);
    this.calculate();

    //  console.log(ratesBuy, ratesSell);

  }

  onRefreshClick() {
    this.downloadBooks();
  }

}
