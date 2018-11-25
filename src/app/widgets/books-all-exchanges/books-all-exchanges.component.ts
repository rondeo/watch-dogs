import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOBooks} from '../../models/app-models';


@Component({
  selector: 'app-books-all-exchanges',
  templateUrl: './books-all-exchanges.component.html',
  styleUrls: ['./books-all-exchanges.component.css']
})
export class BooksAllExchangesComponent implements OnInit {

  // @ViewChild('amount') amoubtView: ElementRef;

  @Input() coin: string;
  @Input() market: string;
  @Output() marketExchange: EventEmitter<{ exchange: string, market: string }> = new EventEmitter();
  @Output() amount: EventEmitter<number> = new EventEmitter();

  selected: { exchange: string, market: string, selected: boolean };
  allMarkets: { exchange: string, market: string, selected: boolean }[];
  amountUS = 1000;
  coinPriceMC: string;
  amountInput: number;
  exchange: string;

  constructor(
    private apiPublic: ApisPublicService,
    private marketCap: ApiMarketCapService
  ) {
  }

  ngOnInit() {
    this.amountInput = this.amountUS;
    this.getMarkets();
  }

  getAllMarketsForCoin() {
    const coin = this.coin;
    if (!coin) return;
    this.apiPublic.getAvailableMarketsForCoin(coin).then(res => {
      //  console.warn(res);
      this.marketCap.getTicker().then(MC => {
        this.coinPriceMC = '$' + MC[coin].price_usd;
        //  console.log(res);
        this.allMarkets = res.map(o => {
          return {
            exchange: o.exchange,
            market: o.base + '_' + o.coin,
            selected: false
          };
        });
      });
    });
  }

  getMarkets() {
    if (!this.market) return this.getAllMarketsForCoin();
    const ar = this.market.split('_');

    this.apiPublic.getMarketAllExchanges(ar[0], ar[1]).then(res => {
      //  console.warn(res);
      this.marketCap.getTicker().then(MC => {
        const basePrice = MC[ar[0]].price_usd;
        const coinPrice = MC[ar[1]].price_usd;

        this.coinPriceMC = (coinPrice / basePrice).toPrecision(5).substr(0, 10) + ' $' + coinPrice.toPrecision(5).substr(0, 6);
        // console.log(res);
        this.allMarkets = res.map(o => {
          return {
            exchange: o.exchange,
            market: o.base + '_' + o.coin,
            selected: false
          };
        });
      });
    });


  }

  onAmountEnter(evt) {
    this.amountUS = this.amountInput;
    this.amount.emit(this.amountUS);

  }


  onBooksClick(item) {
    if (item === this.selected) return;
    //  console.log(item);
    if (this.selected) this.selected.selected = false;
    item.selected = true;
    this.selected = item;
    const copy = JSON.parse(JSON.stringify(item));
    delete copy.selected;
    this.marketExchange.emit(copy);
  }

  onExternalLinkClick(books: VOBooks) {
    // console.log(books);
    const url = this.apiPublic.getExchangeApi(books.exchange).getMarketURL(books.market);
    window.open(url, books.exchange);


  }

}
