import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ApisPublicService} from '../../apis/apis-public.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';


@Component({
  selector: 'app-books-all-exchanges',
  templateUrl: './books-all-exchanges.component.html',
  styleUrls: ['./books-all-exchanges.component.css']
})
export class BooksAllExchangesComponent implements OnInit {

  @ViewChild('amount') amoubtView: ElementRef;

  @Input() coin: string;
  @Output() marketExchange: EventEmitter<{ exchange: string, market: string }> = new EventEmitter();

  selected: { exchange: string, market: string, selected: boolean };
  allMarkets: { exchange: string, market: string, selected: boolean }[];
  amountUS = 1000;
  coinPriceMC: number;

  exchange: string;
  market: string;

  constructor(
    private apiPublic: ApisPublicService,
    private marketCap: ApiMarketCapService
  ) {
  }

  ngOnInit() {
    this.getMarkets();
  }


  getMarkets() {
    const coin = this.coin;
    if(!coin) return;
    this.apiPublic.getAvailableMarketsForCoin(coin).subscribe(res => {
      //  console.warn(res);
      this.marketCap.getData().then(MC => {
        this.coinPriceMC = MC[coin].price_usd;
        this.allMarkets = res.map(o => Object.assign(o, {selected: false}));
      })
    })
  }


  onAmountEnter(evt) {
    let am = Number(evt);

    if (am < 10) {
      am = 10;
      this.amoubtView.nativeElement.value = am
    }
    this.amountUS = am;
  }


  onBooksClick(item) {
    if (item == this.selected) return;
    console.log(item);
    if (this.selected) this.selected.selected = false;
    item.selected = true;
    this.selected = item;
    const copy = JSON.parse(JSON.stringify(item));
    delete copy.selected;
    this.marketExchange.emit(copy);
  }

}
