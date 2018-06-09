import {Component, OnInit} from '@angular/core';

import {VOWatchdog} from '../../models/app-models';
import {Observable} from 'rxjs/Observable';
import {MatSnackBar} from '@angular/material';
import {AppBotsService} from '../../app-services/app-bots-services/app-bots.service';

@Component({
  selector: 'app-bots-running',
  templateUrl: './bots-running.component.html',
  styleUrls: ['./bots-running.component.css']
})
export class BotsRunningComponent implements OnInit {

  sellWds$: Observable<VOWatchdog[]>;
  buyWds$: Observable<VOWatchdog[]>;

  constructor(
    private botsService: AppBotsService,
    private snackBar:MatSnackBar
  ) {
  }

  ngOnInit() {
    this.sellWds$ = this.botsService.subSellCoins$();
    this.buyWds$ = this.botsService.subBuyCoins$();

    this.botsService.isSellRunning$().subscribe(isRunning =>{
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
