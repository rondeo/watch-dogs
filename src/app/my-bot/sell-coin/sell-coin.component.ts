import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {WatchDog} from "../services/watch-dog";
import {forkJoin} from "rxjs/observable/forkJoin";
import {BotSellCoinService} from "../services/bot-sell-coin.service";
import {MongoService} from "../../apis/mongo.service";
import {ApisPrivateService} from "../../apis/apis-private.service";
import {ActivatedRoute} from "@angular/router";
import {StorageService} from "../../services/app-storage.service";
import {ApiMarketCapService} from "../../apis/api-market-cap.service";
import {UsdtBtcService} from "../services/usdt-btc.service";
import {VOGraphs} from "../../shared/line-chart/line-chart.component";
import * as moment from 'moment';
import * as _ from 'lodash';
import {GRAPHS} from "../../com/grpahs";
import {VOMarketCap} from "../../models/app-models";

@Component({
  selector: 'app-sell-coin',
  templateUrl: './sell-coin.component.html',
  styleUrls: ['./sell-coin.component.css']
})
export class SellCoinComponent implements OnInit, OnDestroy {

  myGraps: VOGraphs;
  @Input() watchdog: WatchDog;

  constructor(
    private marketcap: ApiMarketCapService,
    private apisPrivate: ApisPrivateService,
    private storage: StorageService,
    private mongo: MongoService
  ) {
  }

  async getBalance() {
    const wd: WatchDog = this.watchdog
    const api = this.apisPrivate.getExchangeApi(wd.exchange);
    const all = [];

    if (isNaN(wd.balanceBase) || wd.balanceBase < 0) {
      const sub1 = api.downloadBalance(wd.base).map(balance => {
        console.log(balance);
        wd.balanceBase = balance.balance;
        return balance;
      });
      all.push(sub1);
    }

    if (isNaN(wd.balanceCoin) || wd.balanceCoin < 0) {
      const sub2 = api.downloadBalance(wd.coin).map(balance => {
        console.log(balance);
        wd.balanceCoin = balance.balance;
        return balance;
      });
      all.push(sub2);
    }

    if (!all.length) return Promise.resolve();

    await forkJoin(all).toPromise()
    this.storage.saveWatchDogs();
  }


  async addUSValues() {
    const MC = await  this.marketcap.downloadTicker().toPromise();
    this.watchdog.addUS(MC);

  }

  sub1
  ngOnInit() {

   this.sub1 =  this.marketcap.agregated$().subscribe(newValues => {
      const coin = this.watchdog.coin;
      const data = newValues[coin];
      console.log(data);

      this.watchdog.mcCoin = {
        id: data.id,
        name: '',
        symbol: data.symbol,
        rank: data.rank,
        price_usd: data.price_usd,
        price_btc: data.price_btc,
        percent_change_1h: data.percent_change_1h,
        percent_change_24h: data.percent_change_24h,
        percent_change_7d: data.percent_change_7d,
        volume_usd_24h: data.volume
      }

      const integ = GRAPHS.integralData(data);

      // console.log(integ);
      const trigger =
        integ.cur_prev < 0 &&
        integ.prev5_10 < 0 &&
        integ.prev10_20 < 0 &&
        integ.prev5_10 < 0;
      console.log('%c ' + coin + '  ' + trigger, 'color:red');
      this.drawData();
    })

    this.initAsync();

  }

  async drawData() {
    const coin = this.watchdog.coin;
    const history = await this.mongo.downloadCoinHistory(moment().format(), moment().subtract(1, 'd').format(), coin, 300);
///console.log(history);

    const labels = []
    let trigger = false;
    const pricebtcs = [];
    const priceusds = [];
    const triggers = [10];

    history.forEach(function (item) {
      labels.push(' ');
      pricebtcs.push(item.price_btc);
      priceusds.push(item.price_usd);
      const integ = GRAPHS.integralData(item);
      if(trigger){
        trigger = false;
        triggers.push(0);
      }else{
        trigger =
          integ.cur_prev < 0 &&
          integ.prev5_10 < 0 &&
          integ.prev10_20 < 0 &&
          integ.prev5_10 < 0;
        triggers.push(trigger?2:1);

      }

    })





    const graphs = [
      {
        ys: pricebtcs,
        color:'#551c1c',
        label: 'BTC'
      },
      {
        ys: priceusds,
        color:'#545511',
        label: 'US'
      },
      {
        ys: triggers,
        color:'#095531',
        label: 'T'
      }
    ]

    this.myGraps = {
      xs: labels,
      graphs: graphs
    }

  }

  async initAsync() {
    await  this.getBalance();
    await this.addUSValues();

  }

  ngOnDestroy(){
    this.sub1.unsubscribe();
  }

}
