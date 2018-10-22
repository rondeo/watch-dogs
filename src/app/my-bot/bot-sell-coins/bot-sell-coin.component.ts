import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ApiMarketCapService} from "../../apis/api-market-cap.service";
import {ActivatedRoute} from "@angular/router";
import {VOMarketCap, VOMarketCapExt, VOWatchdog} from "../../models/app-models";
import {RunScript} from "../../com/run-script";
import {StorageService} from "../../services/app-storage.service";
import * as moment from 'moment';
import * as _ from 'lodash';
import {ApisPrivateService} from "../../apis/api-private/apis-private.service";
import {Observable} from "rxjs/Observable";
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/mergeMap';

import {forkJoin} from "rxjs/observable/forkJoin";

import {MongoService} from "../../apis/mongo.service";
import {GRAPHS} from "../../com/grpahs";
import {VOGraphs} from "../../ui/line-chart/line-chart.component";
import {WatchDog} from '../../models/watch-dog';


@Component({
  selector: 'app-bot-sell-coin',
  templateUrl: './bot-sell-coin.component.html',
  styleUrls: ['./bot-sell-coin.component.css']
})
export class BotSellCoinComponent implements OnInit, OnDestroy {

  sellCoins: WatchDog[];


  myGraps: VOGraphs;

  constructor(
    private marketcap: ApiMarketCapService,
    // private sellService: BotSellCoinService,
    private apisPrivate: ApisPrivateService,
    private route: ActivatedRoute,
    private storage: StorageService,
    // private usdtBtc: UsdtBtcService,
    private mongo: MongoService
  ) {
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }


  ngOnInit() {

   /* this.sellService.soldCoin$().subscribe(sellCoin => {
      //this.storage
      console.log(' SOLD coin ', sellCoin);

      //this.storage.setSoldCoin(sellCoin);
    })*/
    this.initAsync();
    ;
    this.startCheckMC();
  }



  async checkBalance(wds: WatchDog[]) {
    const all = [];

   /* wds.forEach((item, i) => {
      const api = this.apisPrivate.getExchangeApi(item.exchange);

      if (isNaN(item.balanceBase) || item.balanceBase < 0) {
        const sub1 = api.getBalance(item.base).map(balance => {
          console.log(balance);
          item.balanceBase = balance.balance;
          return balance;
        });
        all.push(sub1);
      }

      if (isNaN(item.balanceCoin) || item.balanceCoin < 0) {
        const sub2 = api.getBalance(item.coin).map(balance => {
          console.log(balance);
          item.balanceCoin = balance.balance;
          return balance;
        });

        all.push(sub2);
      }

    });

    if (!all.length) return Promise.resolve();

    await forkJoin(all).toPromise()
    this.storage.saveWatchDogs();*/
  }

 /* async addUSValues(wd: WatchDog[]) {

    const MC = await  this.marketcap.downloadTicker().toPromise();
    wd.forEach(function (item) {
      item.addUS(MC);
    })
  }*/

  async initAsync() {
    let wd: WatchDog[] = (await this.storage.getWatchDogs()).map(function (item) {
      return new WatchDog(item);
    })
    wd = _.filter(wd, {isActive: true});

    await this.checkBalance(wd);

   /* const watchDogs = wd.map(function (item) {
      return new WatchDog(item);
    });*/

   // await this.addUSValues(watchDogs);

   /* const sellCoins = watchDogs.filter(function (item) {
      return item.sellScripts.toString().length && item.balanceCoin > 0 && item.coin !== 'BTC';
    });

    console.log(sellCoins);
    this.sellCoins = sellCoins;

    this.downloadAgrigated();*/

  }

  interval

  startCheckMC() {
    this.interval = setInterval(() => this.downloadAgrigated(), 3 * 60000);
  }

  async downloadAgrigated() {
   //  const MC = await  this.marketcap.downloadAgrigated().toPromise();


  }


}
