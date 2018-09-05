import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges} from '@angular/core';
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

  @Output() rate: EventEmitter<number> = new EventEmitter();
  booksDisplay: BooksDisplay = new BooksDisplay({});

  isRefreshing: boolean = false;


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
    this.coinMC = this.allCoins[coin];
    this.baseMC = this.allCoins[base];
    this.downloadBooks();
  }


  private calculate() {
    let ar = this.market.split('_');
    const obj = {base: ar[0], coin: ar[1]};
    const coinPrice = this.coinMC.price_usd;
    const basePrice = this.baseMC.price_usd;
    const amount = this.amountUS / coinPrice;
    const ratesBuy = UtilsBooks.getRateForAmountCoin(this.books.sell, amount);
    const ratesSell = UtilsBooks.getRateForAmountCoin(this.books.buy, amount);

    const booksDisplay1 = new BooksDisplay(obj);

    booksDisplay1.buy = ratesBuy;
    booksDisplay1.buyUS = (ratesBuy * basePrice).toPrecision(4);
    booksDisplay1.sell = ratesSell;
    booksDisplay1.sellUS = (ratesSell * basePrice).toPrecision(4);

    if (booksDisplay1.buy && booksDisplay1.sell) {
      booksDisplay1.diff = (100 * (+booksDisplay1.buy - +booksDisplay1.sell) / +booksDisplay1.sell).toFixed(2);
    } else booksDisplay1.diff = '0';


    this.booksDisplay = booksDisplay1;
  }

  private books;

  downloadBooks() {
    const api = this.apisPublic.getExchangeApi(this.exchange);
    if (!api) throw new Error(' no api for ' + this.exchange);

    this.isRefreshing = true;
    api.books$(this.market).subscribe(books =>{

      if(!books) return;
      this.books = books;
      this.isRefreshing = false;
      this.calculate();
    })

  }

  onRefreshClick() {
    const api = this.apisPublic.getExchangeApi(this.exchange);
    api.refreshBooks(this.market);
    this.isRefreshing = api.booksProgress;
  }

  onBookClick(rate: number) {
    this.rate.emit(rate);
  }
}
