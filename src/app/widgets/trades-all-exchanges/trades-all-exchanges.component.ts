import {Component, Input, OnInit} from '@angular/core';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOMarket} from '../../models/app-models';

@Component({
  selector: 'app-trades-all-exchanges',
  templateUrl: './trades-all-exchanges.component.html',
  styleUrls: ['./trades-all-exchanges.component.css']
})
export class TradesAllExchangesComponent implements OnInit {
  @Input() market: string;
  showMarkets: {exchange:string, market: string}[]
  constructor(
    private apisPublic: ApisPublicService,
    private marketCap: ApiMarketCapService
  ) { }

  ngOnInit() {
    const ar = this.market.split('_');
    if(ar.length !== 2) {
      console.error(this.market);
      return
    }
    this.initAsync();
  }

  async initAsync() {
    const ar = this.market.split('_');
    const allMarkets = await this.apisPublic.getMarketAllExchanges(ar[0], ar[1]);
    this.showMarkets = allMarkets.map(function (item) {
      return {
        exchange: item.exchange,
        market: item.base + '_' + item.coin
      }
    })
  }

}
