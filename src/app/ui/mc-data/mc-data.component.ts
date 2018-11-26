import {Component, Input, OnChanges, OnInit} from '@angular/core';

import {VOMarketCap} from '../../models/app-models';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';

@Component({
  selector: 'app-mc-data',
  templateUrl: './mc-data.component.html',
  styleUrls: ['./mc-data.component.css']
})
export class McDataComponent implements OnInit, OnChanges {

  @Input() coin: string;
  coinMC: VOMarketCap = new VOMarketCap();
  constructor(
    private marketcap: ApiMarketCapService
  ) { }

  ngOnInit() {
  }

  ngOnChanges(evt) {
    if (!this.coin) this.coinMC = new VOMarketCap();
    else this.marketcap.ticker$().subscribe(MC => {
      if(!MC) return;
     if (typeof MC[this.coin].price_usd !== 'number') console.log(MC[this.coin]);
      this.coinMC = MC[this.coin] || new VOMarketCap();
    } );
  }

}
