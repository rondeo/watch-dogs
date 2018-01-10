import { Component, OnInit } from '@angular/core';
import {BitfinexService, VOBFMarket} from '../services/bitfinex.service';

@Component({
  selector: 'app-bitfinex',
  templateUrl: './bitfinex.component.html',
  styleUrls: ['./bitfinex.component.css']
})
export class BitfinexComponent implements OnInit {

  marketsAr:VOBFMarket[];


  constructor(
    private service:BitfinexService
  ) { }

  ngOnInit() {

    this.service.getMarkets().subscribe(res=>{
      console.log(res);
      this.marketsAr = res;
    })
  }

  onMarketClick(market: VOBFMarket) {
    let pair = market.pair;
    this.service.getMarket(pair).subscribe(res=>{
      console.log(res);
      market.high=res.high
      market.ask = res.ask;
      market.bid = res.bid;
      market.last_price = res.last_price;
      market.low = res.low;
      market.mid = res.mid;
      market.volume = res.volume;
      market.timestamp = res.timestamp;

    })


  }

}
