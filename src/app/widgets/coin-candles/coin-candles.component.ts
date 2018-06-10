import {Component, Input, OnChanges, OnInit, SimpleChange} from '@angular/core';
import * as  moment from 'moment';
import {VOLineGraph} from '../../ui/line-graph/line-graph.component';
import {ApisPublicService} from '../../apis/apis-public.service';

@Component({
  selector: 'app-coin-candles',
  templateUrl: './coin-candles.component.html',
  styleUrls: ['./coin-candles.component.css']
})
export class CoinCandlesComponent implements OnInit, OnChanges{

  @Input() market: string;
  @Input() numberTo: number;

  myGraps: VOLineGraph[];

  constructor(
    private apiPublic: ApisPublicService
  ) {
  }

  ngOnChanges(evt:{[val:string]: SimpleChange}){
    this.showExchanges();
  }
  ngOnInit() {
    this.showExchanges();
  }


  async showExchanges() {
    const to = this.numberTo;
    const from = moment(to).subtract(1, 'd').valueOf();
    const ar = this.market.split('_');
    const prices = await this.apiPublic.getPriceFromExchangesByCandlesticks(['binance', 'bittrex'], ar[0], ar[1], from, to);
    // console.log(prices);

    const line: VOLineGraph = {
      ys: prices[0],
      color: '#ff7f56',
      label: 'binance'
    }
    this.myGraps = [line];
  }
}
