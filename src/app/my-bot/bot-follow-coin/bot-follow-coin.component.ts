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
import {FrontDeskService} from "../services/front-desk.service";

@Component({
  selector: 'app-bot-follow-coin',
  templateUrl: './bot-follow-coin.component.html',
  styleUrls: ['./bot-follow-coin.component.css']
})
export class BotFollowCoinComponent implements OnInit {

  exchange: string = 'poloniex';


  isCollectiongData: boolean;
  myMarkets: IMarketRecommended[] = [];
  exchangeCoins: string[];

  private historyMC: { [symbol: string]: VOMarketCap }[] = [];


  constructor(private allApis: ConnectorApiService,
              private marketCap: MarketCapService,
              private collectMarketDataService: CollectMarketDataService,
              private frontDesk: FrontDeskService,
              private database: DatabaseService) {

  }



  analizeData() {
    console.log('%c  --------------------------------------------------------- have: ' + this.myMarkets.length, 'color:green');
    FollowCoinHelper.removeDuplicates(this.myMarkets);

    let myMarkets = this.myMarkets.filter(function (item) {
      return item.updatedAt;
    });


    console.log('%c   updates: ' + myMarkets.length, 'color:green');

    if (!myMarkets.length) {
      console.log(' NO new data ');
      return;
    }

    let gainers = _.filter(myMarkets, {'action': ACTIONS.GAINER});

    FollowCoinAnalytics.analizeGaners(gainers);


    this.database.saveMarkets(gainers);
    //AnalizeData.analizeData(myMarkets);

    //BuySellCoins.buySell(myMarkets, this.database);
    //FollowCoinHelper.removeCoins(myMarkets, ACTIONS.NONE);
    myMarkets.forEach(function (item) { item.updatedAt = 0; });
    FollowCoinHelper.saveMyMarkets(this.myMarkets);
  }


  ngOnInit() {

    this.frontDesk.getMarketCapHistory('POT', 100).subscribe(res =>{
      console.log(res);
    })

    let api: IApiPublic = this.allApis.getPublicApi(this.exchange);

    api.getCurrency().then(currency => {

      this.exchangeCoins = currency;
      this.marketCap.getLast10(currency).toPromise().then(res=>{
       this.historyMC = res;
        let sub = this.marketCap.getCoinsObs().subscribe(MC => {
          if (!MC) return;

          let myMC = {};
          currency.forEach(function (item) {
            if(MC[item])myMC[item] = MC[item];
          });

          this.onMC(myMC);
        });

      });



    });

    this.myMarkets = FollowCoinHelper.loadMyMarkets();

    setInterval(() => this.analizeData(), 33360000);
    this.analizeData();


    this.collectMarketDataService.onDone.subscribe(exchange => {
      console.log('DONE ' + exchange);
      this.isCollectiongData = false;

    });

    this.collectMarketDataService.marketData$().subscribe((newStats: IMarketDataCollect) => {

      FollowCoinHelper.updateStatsHistory(newStats, this.myMarkets);
    });

  }

  onMC(MC) {
    if (this.historyMC.length > 10) this.historyMC.shift();
    if(this.historyMC.length){

      let last = this.historyMC[this.historyMC.length -1];
      let lastBTC:VOMarketCap = last['BTC'];
      let btc:VOMarketCap = MC['BTC'];
      //console.log(lastBTC.last_updated, btc.last_updated);
      if(lastBTC.last_updated < btc.last_updated)  this.historyMC.push(MC);
        //console.warn(' Last  ' +lastBTC.last_updated + ' new ' +  btc.last_updated);

    } else  this.historyMC.push(MC);

    this.myMarkets.forEach(function (item) {
      item.coinMC = MC[item.coin];
      item.baseMC = MC[item.base];
    });

    this.collectDataExists(MC);
    this.checkNewGainers();
  }

  collectDataExists(MC) {

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


    NewGainers.checkNewGainers(this.historyMC, this.myMarkets, this.exchange, (newGainers) => {

      this.isCollectiongData = true;

      this.myMarkets = this.myMarkets.concat(newGainers);

      let MC: { [symbol: string]: VOMarketCap } = _.last(this.historyMC);

      let toCollect = FollowCoinHelper.cloneRecommendedBasic(newGainers, MC);

      this.collectMarketDataService.collectMarketData(this.exchange, toCollect);

    })

  }

}
