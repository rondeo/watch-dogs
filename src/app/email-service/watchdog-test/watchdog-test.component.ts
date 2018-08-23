import {Component, OnInit} from '@angular/core';
import {MatSnackBar} from '@angular/material';

import {StorageService} from '../../services/app-storage.service';
import {WatchDogService} from '../watch-dog.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ActivatedRoute} from '@angular/router';
import {VOMarketCap, VOWatchdog} from '../../models/app-models';


import * as _ from 'lodash';
import * as moment from 'moment';
import {VOLineGraph} from '../../ui/line-graph/line-graph.component';
import {AppBotsService} from '../../app-services/app-bots-services/app-bots.service';
import {MovingAverage} from '../../com/moving-average';

import {WatchDog} from '../../models/watch-dog';
import {ShowExternalPageService} from '../../services/show-external-page.service';



@Component({
  selector: 'app-watchdog-test',
  templateUrl: './watchdog-test.component.html',
  styleUrls: ['./watchdog-test.component.css']
})
export class WatchdogTestComponent implements OnInit {

  private uid: string;
  watchDog: WatchDog = new WatchDog(new VOWatchdog({}));
  MC: VOMarketCap;
  scripts: string[];
  exchange:string;
  market:string;
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
    private showExternalPageService:ShowExternalPageService
  ) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.uid = params.uid;
      this.initAsync();
    })
  }

  async initAsync() {
    if (!this.uid) throw new Error(' no id ');
    this.watchDog = await this.botsService.getWatchDogById(this.uid);
    if (!this.watchDog) throw new Error(' no WD for ' + this.uid);
   // this.scripts = this.watchDog.sellScripts;
    this.exchange = this.watchDog.exchange;
    this.market = this.watchDog.base + '_' + this.watchDog.coin;

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
    let triggers:{ timestamp: number, trigger: number }[] = MovingAverage.triggerMovingAvarages(mas);

   //  while(triggers.length < length) triggers.unshift(1);
   // console.log(triggers);
    const values = _.map(triggers, 'trigger');
    this.triggers = [{
      ys:values,
      color:'#4c9561',
      label:null
    }];
  }


  onLineChartClick(){
    if(this.exchange && this.market) {
      const ar = this.market.split('_')
      this.showExternalPageService.showMarket(this.exchange, ar[0], ar[1]);
    }
  }

  showExchanges(){

  }



}
