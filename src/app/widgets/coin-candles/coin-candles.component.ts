import {Component, Input, OnChanges, OnInit, SimpleChange} from '@angular/core';
import * as  moment from 'moment';
import {VOLineGraph} from '../../ui/line-graph/line-graph.component';
import {ApisPublicService} from '../../apis/apis-public.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {VOCandle, VOGraphs} from '../../ui/candlesticks/candlesticks.component';

@Component({
  selector: 'app-coin-candles',
  templateUrl: './coin-candles.component.html',
  styleUrls: ['./coin-candles.component.css']
})
export class CoinCandlesComponent implements OnInit, OnChanges{

  @Input() market: string;
  @Input() exchange: string;


  myGraps: VOGraphs;

  constructor(
    private apiPublic: ApisPublicService
  ) {
  }

  ngOnChanges(evt:{[val:string]: SimpleChange}){
   // this.showExchanges();
    this.getData();
  }
  ngOnInit() {
   // this.showExchanges();
  }

  getData(){
    const api: ApiPublicAbstract = this.apiPublic.getExchangeApi(this.exchange);
    if(!api) return;

    const ar = this.market.split('_');
    api.getCandlesticks(ar[0], ar[1]).then(res =>{
      const candles: VOCandle[] = res.map(function (item) {
        return {
          c:item.Close,
          h: item.High,
          l: item.Low,
          o: item.Open,
          t: item.from,
          v: item.Volume
        };
      })

      this.myGraps = {
        labelsX: null,
        candles: candles
      }
    })
  }

 /* async showExchanges() {
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
  }*/
}
