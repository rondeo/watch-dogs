import {Component, OnInit} from '@angular/core';
import {MatSnackBar} from '@angular/material';

import {StorageService} from '../../a-core/services/app-storage.service';
import {WatchDogService} from '../watch-dog.service';
import {ApiMarketCapService} from '../../a-core/apis/api-market-cap.service';
import {ActivatedRoute} from '@angular/router';
import {VOMarketCap, VOWatchdog} from '../../amodels/app-models';


import * as _ from 'lodash';
import * as moment from 'moment';
import {VOLineGraph} from '../../aui/comps/line-graph/line-graph.component';

import {MovingAverage} from '../../acom/moving-average';
import {MarketOrderModel} from '../../amodels/market-order-model';
import {ShowExternalPageService} from '../../a-core/services/show-external-page.service';
import {AppBotsService} from '../../app-bots/app-bots.service';



@Component({
  selector: 'app-watchdog-test',
  templateUrl: './watchdog-test.component.html',
  styleUrls: ['./watchdog-test.component.css']
})
export class WatchdogTestComponent implements OnInit {

  private uid: string;
  watchDog: MarketOrderModel = new MarketOrderModel(new VOWatchdog({}));
  MC: VOMarketCap;
  scripts: string[];
  exchange: string;
  market: string;
  isExchanges: boolean;
  numberTo = moment().valueOf();

  triggers: VOLineGraph[];

  // scriptText: string;
  constructor(
    private route: ActivatedRoute,
    private watchdogService: WatchDogService,
    private storage: StorageService,
    private marketCap: ApiMarketCapService,
    private snackBar: MatSnackBar,
    private botsService: AppBotsService,
    private showExternalPageService: ShowExternalPageService
  ) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.uid = params.uid;
      this.initAsync();
    });
  }

  async initAsync() {
    if (!this.uid) throw new Error(' no id ');
   // this.watchDog = await this.botsService.getWatchDogById(this.uid);
  //  if (!this.watchDog) throw new Error(' no WD for ' + this.uid);
   // this.scripts = this.watchDog.sellScripts;
  //  this.exchange = this.watchDog.exchange;
   // this.market = this.watchDog.base + '_' + this.watchDog.coin;

    // console.log(this.watchDog);
    //  this.scriptText = this.scripts.join('<br>');


  }


  onCoinDataChange(coindatas: any[]) {
    const length = coindatas.length;
    console.log(moment(_.first(coindatas).timestamp).format());
    console.log(moment(_.last(coindatas).timestamp).format());

    const mas = MovingAverage.movingAverageGraphFromCoinWeek(coindatas);
    console.log(moment(_.first(mas).timestamp).format());
    console.log(moment(_.last(mas).timestamp).format());
    let triggers: { timestamp: number, trigger: number }[] = MovingAverage.triggerMovingAvarages(mas);

   //  while(triggers.length < length) triggers.unshift(1);
   // console.log(triggers);
    const values = _.map(triggers, 'trigger');
    this.triggers = [{
      ys: values,
      color: '#4c9561',
      label: null
    }];
  }


  onLineChartClick() {
    if (this.exchange && this.market) {
      const ar = this.market.split('_');
      this.showExternalPageService.showMarket(this.exchange, ar[0], ar[1]);
    }
  }

  showExchanges() {

  }



}
