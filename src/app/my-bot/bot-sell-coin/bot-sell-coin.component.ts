import {Component, OnInit} from '@angular/core';
import {ApiMarketCapService} from "../../apis/api-market-cap.service";
import {ActivatedRoute} from "@angular/router";
import {VOMarketCap, VOMarketCapExt, VOWatchdog} from "../../models/app-models";
import {BotSellCoinService, VOSellCoin} from "../services/bot-sell-coin.service";
import {RunScript} from "../../com/run-script";
import {StorageService} from "../../services/app-storage.service";
import * as moment from 'moment';
import * as _ from 'lodash';
import {ApisPrivateService} from "../../apis/apis-private.service";
import {Observable} from "rxjs/Observable";
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/mergeMap';

import {forkJoin} from "rxjs/observable/forkJoin";


@Component({
  selector: 'app-bot-sell-coin',
  templateUrl: './bot-sell-coin.component.html',
  styleUrls: ['./bot-sell-coin.component.css']
})
export class BotSellCoinComponent implements OnInit {

  // sellCoins: VOSellCoin[]

  constructor(
    private marketcap: ApiMarketCapService,
    private sellService: BotSellCoinService,
    private apisPrivate: ApisPrivateService,
    private route: ActivatedRoute,
    private storage: StorageService
  ) {
  }


  ngOnInit() {
    this.sellService.soldCoin$().subscribe(sellCoin => {
      //this.storage
      console.log(' SOLD coin ', sellCoin);

      //this.storage.setSoldCoin(sellCoin);
    })
    this.initAsync();
    ;
    this.startCheckMC();
  }


  async checkBalance(wds: VOWatchdog[]) {
    const all = [];

    wds.forEach((item, i) => {
      const api = this.apisPrivate.getExchangeApi(item.exchange);

      if (isNaN(item.balanceBase) || item.balanceBase < 0) {
        const sub1 = api.downloadBalance(item.base).map(balance => {
          console.log(balance);
          item.balanceBase = balance.balance;
          return balance;
        });
        all.push(sub1);
      }

      if (isNaN(item.balanceCoin) || item.balanceCoin < 0) {
        const sub2 = api.downloadBalance(item.coin).map(balance => {
          console.log(balance);
          item.balanceCoin = balance.balance;
          return balance;
        });

        all.push(sub2);
      }

    });

    if (!all.length) return Promise.resolve();

    await forkJoin(all).toPromise()

    this.storage.saveWatchDogs();

  }


  async initAsync() {
    const wd: VOWatchdog[] = await this.storage.getWatchDogs();
    await this.checkBalance(wd);
    console.log(wd);

    const sellCoins = wd.filter(function (item) {
      return item.sellScript.toString().length && item.balanceCoin > 0;
    });

    this.checkMC(sellCoins);

    // console.log(allSellCoins);
    //  const toSell = _.filter(allSellCoins, {status:'SELL'})
    // console.log(' to sell ', toSell);

    // const results = await this.checkMC(toSell);
    // console.log(results);

  }

  interval

  startCheckMC() {
    this.interval = setInterval(() => this.initAsync(), 3 * 60000);

  }


  async checkMC(sellCoins: VOWatchdog[]) {
    const MC = await  this.marketcap.downloadTicker().toPromise();
    console.log(MC);

    const btcMC = MC['BTC'];

    const result = [];

    sellCoins.forEach((coin: VOWatchdog) => {

      const coinMC: VOMarketCapExt = <VOMarketCapExt>MC[coin.coin];

      if (coinMC) {

        coinMC.tobtc_change_1h = +(coinMC.percent_change_1h - btcMC.percent_change_1h).toFixed(3);

        console.log(coin.coin + ' ' + coinMC.percent_change_1h + ' to BTC ' + coinMC.tobtc_change_1h);

        const sellResult = [];

        coin.sellScript.forEach(function (script) {
          console.log('Script : ' + script);
          const scriptResults = RunScript.runScriptSell(coinMC, script);
          console.log(scriptResults);
          sellResult.push();
        })


        if (sellResult.length) {

          const msg = moment().format() + ' ' + sellResult.toString() + '  sellResults: ' + sellResult.toString()
            + ' MC coin price ' + coinMC.price_usd + ' BTC price: ' + btcMC.price_usd
            + '  \n ' + JSON.stringify(coinMC) + ' \n ' + JSON.stringify(btcMC);
          console.log(msg);

          result.push(sellResult);
          coin.results = [msg];
          //coin.coinPrice = coinMC.price_usd;
          //coin.basePrice = MC[coin.base].price_usd;

          //  this.storage.upsert('SELL-' + coin.exchange + '-' + coin.base + '-' + coin.coin, coin);
          //  this.sellService.sellCoin(coin);
        }
      }
    })
    return result;

  }


}
