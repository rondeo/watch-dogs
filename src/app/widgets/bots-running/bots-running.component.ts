import {Component, OnInit} from '@angular/core';

import {OrderType, VOWatchdog} from '../../models/app-models';
import {Observable} from 'rxjs/Observable';
import {MatSnackBar} from '@angular/material';
import {AppBotsService} from '../../app-services/app-bots-services/app-bots.service';
import {WatchDog} from '../../models/watch-dog';
import 'rxjs/add/operator/filter';

@Component({
  selector: 'app-bots-running',
  templateUrl: './bots-running.component.html',
  styleUrls: ['./bots-running.component.css']
})
export class BotsRunningComponent implements OnInit {
  activeSell: number;
  activeBuy: number;

  totalSell:number;
  totalBuy: number;

  secondsLeft: number;

  isSellRunning:boolean

  constructor(
    private botsService: AppBotsService,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit() {
    this.botsService.allWatchDogs$().subscribe(wds => {
      this.activeSell = this.botsService.getActiveSellBots().length;
      this.totalSell = this.botsService.getAllSellBots().length;

      this.totalBuy = this.botsService.getAllBuyBots().length;
      this.activeBuy = this.botsService.getActiveBuyBots().length;

    });

    this.botsService.secondsLeft$().subscribe(seconds =>{
      this.secondsLeft = seconds;
    })

    this.botsService.isSellRunning$().subscribe(isRunning => {
      this.isSellRunning = isRunning;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.showSbackBar(isRunning), 1300);

    })
  }

  timeout;

  showSbackBar(isRunning) {
    if (isRunning) this.snackBar.open('SELL Watchdogs are running', 'x', {duration: 1500, extraClasses: 'alert-green'});
    else this.snackBar.open('SELL Watchdogs STOPPED', 'x', {duration: 1500, extraClasses: 'alert-red'});
  }

}
