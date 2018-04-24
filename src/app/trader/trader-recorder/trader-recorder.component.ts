import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ApisPublicService} from "../../apis/apis-public.service";

import {IMarketStats, MarketStats} from "../../com/market-stats";
import {DatabaseService} from "../../services/database.service";
import * as moment from 'moment';
import {ApiPublicAbstract} from "../../apis/api-public/api-public-abstract";

@Component({
  selector: 'app-trader-recorder',
  templateUrl: './trader-recorder.component.html',
  styleUrls: ['./trader-recorder.component.css']
})
export class TraderRecorderComponent implements OnInit, OnChanges {

  //////////////////////////////// View
  diffSellBuyPrice: string;
  totalBuy: string;
  totalSell: string;
  avgRate: string;
  speed: string;
  amountPerMinute: string;
  totalPerMinute: string;

  marketStats: IMarketStats;

  @Input() market: string;
  @Input() exchange: string;
  ////////////////////////////////////

  private api: ApiPublicAbstract;

  private interval;

  constructor(private apis: ApisPublicService, private database: DatabaseService) {
    this.marketStats = {
      amountBaseBuy: 0,
      amountBaseSell: 0,
      avgSellPrice: 0,
      avgBuyPrice: 0,
      maxBuy: 0,
      maxSell: 0,
      dustSell: 0,
      dustBuy: 0,
      speed: 0,
      duration: 0,
      avgRate: 0,
      diff: '',
      total: 0,
      buysell: 0
    }
  }

  ngOnInit() {

  }

  ngOnChanges() {
    if (this.exchange && this.market) {
      this.api = this.apis.getExchangeApi(this.exchange);
      if (this.api) this.startRecording();
      else console.error(' no api for ' + this.exchange);
    }

  }

  async startRecording() {

    const allCoinsObj = await this.api.getAllCoins();
    const ar = this.market.split('_');
    const base = ar[0];
    const coin = ar[1];
    const coins = Object.keys(allCoinsObj);
    if (coins.indexOf(coin) !== -1) {
      clearInterval(this.interval);
      this.interval = setInterval(() => this.recordData(), 60 * 1000);
      this.recordData();
    }

  }

  async recordData() {
    const ar = this.market.split('_');
    const base = ar[0];
    const coin = ar[1];
    let res: any;
    try {
      const orders = await this.api.downloadMarketHistory(base, coin).toPromise();
     // console.log(this.exchange + '  ' + this.market + ' ' + orders.length);
      const stats = MarketStats.parseMarketHistory(orders);
      this.marketStats = stats;
      res = stats;
    } catch (e) {
      res = e
    }
    this.saveInDB(res);
  }

  saveInDB(data: any) {
    data.stamp = moment().format();
    data.createdAt = Date.now();
    this.database.saveData(this.exchange + '_' + this.market, data).then(res => {
      console.log(res);
    });
  }

}
