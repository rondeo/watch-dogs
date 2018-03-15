import {Component, OnInit} from '@angular/core';
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {VOMarketCap} from "../../models/app-models";
import {MarketCapService} from "../../market-cap/market-cap.service";

import {MarketCollectorService} from "../../my-exchange/my-exchange-bot/bot/market-collector.service";
import {IMarketDataCollect, IMarketRecommended} from "../../services/utils-order";
import {CollectMarketDataService} from "../services/collect-market-data.service";
import {DatabaseService} from "../../services/database.service";
import * as _ from 'lodash';
import {ACTIONS, FollowCoinHelper} from "./follow-coin-helper";
import {FollowCoinAnalytics} from "./follow-coin-analytics";
import {AnalizeData} from "./analize-data";
import {BuySellCoins} from "./buy-sell-coins";
import {IApiPublic} from "../../my-exchange/services/apis/api-base";
import {NewGainers} from "./new-gainers";

@Component({
  selector: 'app-bot-follow-coin',
  templateUrl: './bot-follow-coin.component.html',
  styleUrls: ['./bot-follow-coin.component.css']
})
export class BotFollowCoinComponent implements OnInit {

  exchange: string = 'poloniex';


  isCollectiongData: boolean;
  myMarkets: IMarketRecommended[] = [];

  private historyMC: { [symbol: string]: VOMarketCap }[] = [];


  constructor(private allApis: ConnectorApiService,
              private marketCap: MarketCapService,
              private collectMarketDataService: CollectMarketDataService,
              private database: DatabaseService) {

  }


  analizeData() {
    console.log('%c  --------------------------------------------------------- have: ' + this.myMarkets.length, 'color:green');
    FollowCoinHelper.removeDuplicates(this.myMarkets);
    let myMarkets = this.myMarkets.filter(function (item) {
      return item.newData;
    });

    if (!myMarkets.length) {
      console.log(' NO new data ');
      return;
    }

    AnalizeData.analizeData(myMarkets);

    BuySellCoins.buySell(myMarkets, this.database);

  }


  ngOnInit() {
    this.myMarkets = FollowCoinHelper.loadMyMarkets();

    setInterval(() => this.analizeData(), 60000);
    this.analizeData();


    this.collectMarketDataService.onDone.subscribe(exchange => {
      console.log('DONE ' + exchange);
      this.isCollectiongData = false;

    });

    this.collectMarketDataService.marketData$().subscribe((newStats: IMarketDataCollect) => {

      FollowCoinHelper.updateStatsHistory(newStats, this.myMarkets);
    });

    let sub = this.marketCap.getCoinsObs().subscribe(MC => {
      if (!MC) return;
      this.onMC(MC);
    });
  }

  onMC(MC) {

    if (this.historyMC.length > 100) this.historyMC.shift();
    this.historyMC.push(MC);
    this.collectDataExists();
    this.checkNewGainers();
  }

  collectDataExists() {

    let MC = _.last(this.historyMC);
    this.myMarkets.forEach(function (item) {
      item.coinMC = MC[item.coin];
      item.baseMC = MC[item.base]
      item.newData = 2;
    });

    let toSellCoins = this.myMarkets.filter(function (item) {
      return item.action === ACTIONS.TO_SELL;
    });

    let gainers = this.myMarkets.filter(function (item) {
      return item.action === ACTIONS.GAINER;
    });

    console.log(' collect data TO_SELL ' + toSellCoins.length);
    console.log(' collect data GAINERS ' + gainers.length);


    let reqired: IMarketDataCollect[] = FollowCoinHelper.cloneRecommendedBasic(toSellCoins.concat(gainers), MC);

    if (reqired.length) {
      this.isCollectiongData = true;
      this.collectMarketDataService.collectMarketData(this.exchange, reqired);
    }
  }

  checkNewGainers() {

    if (this.myMarkets.length > 11) {
      console.log(' LIMIT 12 coins ');
      return;
    }

    let api: IApiPublic = this.allApis.getPublicApi(this.exchange);

    NewGainers.checkNewGainers(this.historyMC, this.myMarkets, api, (toCollect) => {

      this.isCollectiongData = true;

      this.collectMarketDataService.collectMarketData(this.exchange, toCollect);

    })

  }

}
