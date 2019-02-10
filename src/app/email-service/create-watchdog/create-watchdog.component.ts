import {Component, OnDestroy, OnInit} from '@angular/core';

import * as _ from 'lodash';
import {EmailServiceService} from '../email-service.service';

import {MatDialog} from '@angular/material';
import {OrderType, VOMarketCap, VOWatchdog} from '../../amodels/app-models';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {ActivatedRoute, Router} from '@angular/router';
import {WatchDog} from '../../amodels/watch-dog';
import * as moment from 'moment';
import {AppBotsService} from '../../adal/app-services/app-bots-services/app-bots.service';
import {WatchDogStatus} from '../../adal/app-services/app-bots-services/watch-dog-status';


@Component({
  selector: 'app-create-watchdog',
  templateUrl: './create-watchdog.component.html',
  styleUrls: ['./create-watchdog.component.css']
})
export class CreateWatchdogComponent implements OnInit, OnDestroy {


  exchange: string;
  base: string;
  coin: string;
  isActive: boolean;
  orderType: OrderType = OrderType.SELL;
  amount: number;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private botsService: AppBotsService
  ) {

  }


  // private sub3;
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const amount = params.amount || 100;
      this.amount =  Math.ceil(amount);
    });
    this.route.params.subscribe(params => {
      this.exchange = params.exchange;
      this.base = params.base;
      this.coin = params.coin;
    });


  }

  setCurrentById(uid: string) {

  }


  ngOnDestroy() {

  }

 async onCreateClick() {
    const wdData: VOWatchdog = new VOWatchdog({
      id: moment().toISOString(),
      exchange: this.exchange,
      base: this.base,
      coin: this.coin,
      amount: this.amount,
      isActive: this.isActive,
      orderType: this.orderType,
      name: this.exchange + ' ' + this.base + ' ' + this.coin + ' ' + this.amount,
      _status: WatchDogStatus.WAITING
    });

    const WD: WatchDog = new WatchDog(wdData);
    await this.botsService.saveWatchDog(WD);
    this.router.navigateByUrl('/email-service/watchdogs-list/' + this.orderType);
  }



}
