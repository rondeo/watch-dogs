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

  sellWds:WatchDog[];
  buyWds: WatchDog[];

  constructor(
    private botsService: AppBotsService,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit() {
    this.botsService.allWatchDogs$().map(function (wds: WatchDog[]) {
      return wds.filter(function (item) {
        return  item.orderType === OrderType.SELL;
      })
    }).subscribe(wds => {
      this.sellWds = wds
    });

   this.botsService.allWatchDogs$().map(function (wds: WatchDog[]) {
      return wds.filter(function (item) {
        return  item.orderType === OrderType.BUY;
      })
    }).subscribe(wds => this.buyWds = wds);

    this.botsService.isSellRunning$().subscribe(isRunning => {
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
