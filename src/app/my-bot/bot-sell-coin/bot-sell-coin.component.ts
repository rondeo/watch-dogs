import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiMarketCapService} from "../../apis/api-market-cap.service";
import {ActivatedRoute} from "@angular/router";
import {VOMarketCap, VOMarketCapExt, VOWatchdog} from "../../models/app-models";
import {BotSellCoinService} from "../services/bot-sell-coin.service";
import {RunScript} from "../../com/run-script";
import {StorageService} from "../../services/app-storage.service";
import * as moment from 'moment';
import * as _ from 'lodash';
import {ApisPrivateService} from "../../apis/apis-private.service";
import {Observable} from "rxjs/Observable";
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/mergeMap';

import {forkJoin} from "rxjs/observable/forkJoin";
import {UsdtBtcService} from "../services/usdt-btc.service";
import {WatchDog} from "../services/watch-dog";
import {MongoService} from "../../apis/mongo.service";


@Component({
  selector: 'app-bot-sell-coin',
  templateUrl: './bot-sell-coin.component.html',
  styleUrls: ['./bot-sell-coin.component.css']
})
export class BotSellCoinComponent implements OnInit, OnDestroy {

   sellCoins: WatchDog[];

  constructor(
    private marketcap: ApiMarketCapService,
    private sellService: BotSellCoinService,
    private apisPrivate: ApisPrivateService,
    private route: ActivatedRoute,
    private storage: StorageService,
    private usdtBtc:UsdtBtcService,
    private mongo: MongoService
  ) {
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  ngOnInit() {

    this.mongo.downloadCoinHistory(moment().subtract(2,'d').format(), moment().subtract(1,'d').format(), 'CVC', 1000).then(res=>{
      console.warn(res);
    })
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

  async addUSValues(wd:WatchDog[]){

    const MC = await  this.marketcap.downloadTicker().toPromise();
    wd.forEach(function (item) {
      item.addUS(MC);
    })
  }

  async initAsync() {
   let  wd: VOWatchdog[] = await this.storage.getWatchDogs();
    wd = _.filter(wd, {active:true});

    await this.checkBalance(wd);


    const watchDogs = wd.map(function (item) {
      return new WatchDog(item);
    });

    await this.addUSValues(watchDogs);

    const sellCoins = watchDogs.filter(function (item) {
      return item.sellScript.toString().length && item.balanceCoin > 0 && item.coin !== 'BTC';
    });

    console.log(sellCoins);
    this.checkMC(sellCoins);
    this.sellCoins = sellCoins

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

    const btcMC = MC['BTC'];
    this.usdtBtc.runMC(btcMC);
  //  console.log(MC);



    const result = [];

    sellCoins.forEach((coin: VOWatchdog) => {


      const coinMC: VOMarketCapExt = <VOMarketCapExt>MC[coin.coin];

      console.log(coinMC);

      if (coinMC) {

        if (coin.balanceCoin) {
          // run sell script
          console.log(' SELL  ' + coin.base + ' ' + coin.coin );

          const current = coin.coin === 'BTC'?coinMC.price_usd:coinMC.price_btc;
          const cur_prev = +(100 * (current - coinMC.prev) / coinMC.prev).toFixed(4);
          const cur_prev5 = +(100 * (current - coinMC.prev5) / coinMC.prev5).toFixed(4);


          const prev5_10 = +(100 * (coinMC.prev5 - coinMC.prev10) / coinMC.prev10).toFixed(4);

          const prev10_20 = +(100 * (coinMC.prev10 - coinMC.prev20) / coinMC.prev20).toFixed(4);
          const prev20_30 = +(100 * (coinMC.prev20 - coinMC.prev30) / coinMC.prev30).toFixed(4);
          const ago2h = +(100 * (coinMC.prev10 - coinMC.ago2h) / coinMC.ago2h).toFixed(4);
          const ago3h = +(100 * (coinMC.prev10 - coinMC.ago3h) / coinMC.ago3h).toFixed(4);


          console.log(' cur-prev ' + cur_prev + ' cur-prev5 ' + cur_prev5)
          console.log( ' prev5-10 ' + prev5_10 + ' prev10-20 ' + prev10_20 + ' prev20-30 ' + prev20_30)
          console.log(' prev10-ago2h ' + ago2h + ' prev10-ago3h  ' + ago3h)


        } else {
          // run buy script

          console.log('BUY ');

        }

        coinMC.tobtc_change_1h = +(coinMC.percent_change_1h - btcMC.percent_change_1h).toFixed(3);

        console.log(coin.coin + ' ' + coinMC.percent_change_1h + ' to BTC ' + coinMC.tobtc_change_1h);

        const sellResult = [];

        coin.sellScript.forEach(function (script) {
          console.log('Script : ' + script);
          const scriptResults = RunScript.runScriptSell(coinMC, script);
          console.log(scriptResults);
          // sellResult.push();
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
