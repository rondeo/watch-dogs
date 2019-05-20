import {Component, OnInit} from '@angular/core';

import {OrderType, VOWatchdog} from '../../../amodels/app-models';

import {MatSnackBar} from '@angular/material';

import {MarketOrderModel} from '../../../amodels/market-order-model';
import {AppBotsService} from '../../../app-bots/app-bots.service';

@Component({
  selector: 'app-bots-running',
  templateUrl: './bots-running.component.html',
  styleUrls: ['./bots-running.component.css']
})
export class BotsRunningComponent implements OnInit {

  constructor(
    private botsService: AppBotsService,
    private snackBar: MatSnackBar
  ) {
  }
  activeSell: number;
  activeBuy: number;

  totalSell: number;
  totalBuy: number;

  secondsLeft: number;

  isSellRunning: boolean;

  timeout;

  ngOnInit() {
   /* this.botsService.allWatchDogs$().subscribe(wds => {
      this.activeSell = this.botsService.getActiveSellBots().length;
      this.totalSell = this.botsService.getAllSellBots().length;

      this.totalBuy = this.botsService.getAllBuyBots().length;
      this.activeBuy = this.botsService.getActiveBuyBots().length;

    });

    this.botsService.secondsLeft$().subscribe(seconds => {
      this.secondsLeft = seconds;
    });

    this.botsService.isSellRunning$().subscribe(isRunning => {
      this.isSellRunning = isRunning;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.showSbackBar(isRunning), 1300);

    });*/
  }

  showSbackBar(isRunning) {
    if (isRunning) this.snackBar.open('SELL Watchdogs are running', 'x', {duration: 1500, panelClass: 'alert-green'});
    else this.snackBar.open('SELL Watchdogs STOPPED', 'x', {duration: 1500, panelClass: 'alert-red'});
  }

}
