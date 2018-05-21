import {Component, Input, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {VOMCAgregated} from '../../apis/models';
import {UtilsBooks} from '../../com/utils-books';

export class BooksDisplay {
  sell: string = '';
  buy: string = '';
  diff: string = '';
  us:string = ''
}

@Component({
  selector: 'app-market-books',
  templateUrl: './market-books.component.html',
  styleUrls: ['./market-books.component.css']
})
export class MarketBooksComponent implements OnInit {

  @Input() exchange: string;
  @Input() market: string;

  bookDisplays:BooksDisplay[] = [];

  priceCoinUS: number;

  isRefreshing: boolean = false;

  private priceBaseUS: number;
  private baseMC: VOMCAgregated;
  private coinMC: VOMCAgregated;
  private allCoins: { [symbol: string]: VOMCAgregated };

  constructor(
    private apiMarketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService
  ) {
  }

  ngOnInit() {

    let pair = this.market;
    if (!pair || pair.indexOf('_') === -1) return;
    let ar = pair.split('_');
    let base = ar[0];
    let coin = ar[1];
    this.apiMarketCap.getData().subscribe(allCoins => {
      this.allCoins = allCoins;
      this.baseMC = allCoins[base];
      this.priceBaseUS = this.baseMC.price_usd;
      this.coinMC = allCoins[coin];
      this.priceCoinUS = this.coinMC.price_usd;
      this.downloadBooks();
    })

  }

  async downloadBooks() {
    this.isRefreshing = true;
    const api = this.apisPublic.getExchangeApi(this.exchange);
    if (!api) throw new Error(' no api for ' + this.exchange);
    const books = await api.downloadBooks(this.baseMC.symbol, this.coinMC.symbol).toPromise();
   //  console.log(books);

    const coinPrice = this.coinMC.price_usd;
    const basePrice = this.baseMC.price_usd;

    const amount1 = 500 / coinPrice;
    const amount2 = 1200 / coinPrice;
    const amount3 = 5000 / coinPrice;

    const ratesBuy = UtilsBooks.getRateForAmounts(books.sell, amount1, amount2, amount3);

    const ratesSell = UtilsBooks.getRateForAmounts(books.buy, amount1, amount2, amount3);

    const booksDisplay1 = new BooksDisplay();
    const booksDisplay2 = new BooksDisplay();
    const booksDisplay3 = new BooksDisplay();

    booksDisplay1.buy = (ratesBuy.rate1 * basePrice).toPrecision(4);
    booksDisplay1.sell = (ratesSell.rate1 * basePrice).toPrecision(4);
    booksDisplay1.us = '500';
    booksDisplay1.diff = (100 * (+booksDisplay1.buy - +booksDisplay1.sell)/+booksDisplay1.sell).toFixed(3);

    booksDisplay2.buy = (ratesBuy.rate2 * basePrice).toPrecision(4);
    booksDisplay2.sell = (ratesSell.rate2 * basePrice).toPrecision(4);
    booksDisplay2.us = '1200';
    booksDisplay2.diff = (100 * (+booksDisplay2.buy - +booksDisplay2.sell)/+booksDisplay2.sell).toFixed(3)

    booksDisplay3.buy = (ratesBuy.rate3 * basePrice).toPrecision(4);
    booksDisplay3.sell = (ratesSell.rate3 * basePrice).toPrecision(4);
    booksDisplay3.us = '5000';
    booksDisplay3.diff = (100 * (+booksDisplay3.buy - +booksDisplay3.sell)/+booksDisplay1.sell).toFixed(2)


    this.bookDisplays = [booksDisplay1, booksDisplay2, booksDisplay3];

    this.isRefreshing = false;
   //  console.log(ratesBuy, ratesSell);

  }


  onRefreshClick(){
    this.downloadBooks();
  }


}
