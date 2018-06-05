import {Component, OnInit} from '@angular/core';
import {AppBuySellService} from '../../app-services/app-buy-sell-services/app-buy-sell.service';
import {VOWatchdog} from '../../models/app-models';
import {Observable} from 'rxjs/Observable';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-buy-sell-summary',
  templateUrl: './buy-sell-summary.component.html',
  styleUrls: ['./buy-sell-summary.component.css']
})
export class BuySellSummaryComponent implements OnInit {

  sellWds$: Observable<VOWatchdog[]>;
  buyWds$: Observable<VOWatchdog[]>;

  constructor(
    private buySellCoin: AppBuySellService,
    private snackBar:MatSnackBar
  ) {
  }

  ngOnInit() {
    this.sellWds$ = this.buySellCoin.subSellCoins$();
    this.buyWds$ = this.buySellCoin.subBuyCoins$();

    this.buySellCoin.isSellRunning$().subscribe(isRunning =>{
      clearTimeout(this.timeout);
      this.timeout = setTimeout(()=>this.showSbackBar(isRunning), 1300);

    })
  }

  timeout;
  showSbackBar(isRunning){
    if(isRunning) this.snackBar.open('SELL Watchdogs are running', 'x', {duration:1500, extraClasses:'alert-green'});
    else this.snackBar.open('SELL Watchdogs STOPPED' , 'x', {duration:1500, extraClasses:'alert-red'});
  }

}
