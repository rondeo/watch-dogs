import {Component, OnInit} from '@angular/core';
import {AppBuySellService} from '../../app-services/app-buy-sell-services/app-buy-sell.service';
import {VOWatchdog} from '../../models/app-models';
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'app-buy-sell-summary',
  templateUrl: './buy-sell-summary.component.html',
  styleUrls: ['./buy-sell-summary.component.css']
})
export class BuySellSummaryComponent implements OnInit {

  sellWds$: Observable<VOWatchdog[]>;
  buyWds$: Observable<VOWatchdog[]>;

  constructor(
    private buySellCoin: AppBuySellService
  ) {
  }

  ngOnInit() {
    this.sellWds$ = this.buySellCoin.sellCoins$();
    this.buyWds$ = this.buySellCoin.buyCoins$();
  }

}
