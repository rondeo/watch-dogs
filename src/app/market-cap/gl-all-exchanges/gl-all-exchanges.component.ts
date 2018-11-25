import {Component, OnInit} from '@angular/core';
import {VOMarketCap} from '../../models/app-models';
import {MarketCapService} from '../services/market-cap.service';
import * as _ from 'lodash';
@Component({
  selector: 'app-gl-all-exchanges',
  templateUrl: './gl-all-exchanges.component.html',
  styleUrls: ['./gl-all-exchanges.component.css']
})
export class GlAllExchangesComponent implements OnInit {

  gainersAr: VOMarketCap[];
  losersAr: VOMarketCap[];

  symbolMarkets: VOSymbolMarkets[];

  capLimit = 10000;

  constructor(
    private service: MarketCapService
  ) {
  }

  ngOnInit() {
    /*
        this.service.coinsAr$.subscribe(res => {
          //  console.log(res);
          if (!res) {
            return;
          }
          let out: VOMarketCap[] = [];
          let limit = this.capLimit;

          out = res.filter(function (item) {
            return item.volume_usd_24h > limit;
          });

          // let gainers = _.sortBy(out,'percent_change_24h','desc');
          let sorted = _.sortBy(out, 'percent_change_24h');

          // console.log(out);

          this.gainersAr = _.takeRight(sorted, 30);
          this.losersAr = _.take(sorted, 30);
          let gainers = this.gainersAr;

          this.service.getCoinsExchanges().subscribe((res: VOExchangeCoin[]) => {

            let symbolMarkets: VOSymbolMarkets[] = [];

            gainers.forEach(function (item) {
              let symbol = item.symbol;
              symbolMarkets.push({
                symbol: symbol,
                markets: Utils.filterMarkets(symbol, res)
              });

            });

            this.symbolMarkets = symbolMarkets;

          });
        });
        */


  //  this.service.refresh();
  }




}

export interface VOSymbolMarkets {
  symbol: string;
  markets: string[];
}
