import {Component, OnInit} from '@angular/core';
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {VOMarketCap} from "../../models/app-models";
import {MarketCapService} from "../../market-cap/market-cap.service";

import {MarketCollectorService} from "../../my-exchange/my-exchange-bot/bot/market-collector.service";
import {IMarketRecommended} from "../../services/utils-order";
import {CollectMarketDataService} from "../services/collect-market-data.service";
import {DatabaseService} from "../../services/database.service";
import * as _ from 'lodash';
import {ACTIONS, FollowCoinHelper} from "./follow-coin-helper";
import {FollowCoinAnalytics} from "./follow-coin-analytics";

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
    console.log('%c analizeData ----------------------------------------------------------- ', 'color:green');
    console.log(this.myMarkets);

    FollowCoinHelper.removeDuplicates(this.myMarkets);

    let gainers = _.filter(this.myMarkets, {'action': ACTIONS.GAINER});

    console.log('GAINERS: ' + gainers.length);

    FollowCoinAnalytics.analizeGaners(gainers);


    let toBuy = _.filter(this.myMarkets, {'action': ACTIONS.TO_BUY});

    console.log('TO_BUY: ' + toBuy.length);

    FollowCoinAnalytics.analizeToBuy(toBuy);

    let buyCoins = _.filter(this.myMarkets, {'action': ACTIONS.BUY});

    console.log(' BUY : ' + buyCoins.length);

    this.buyCoins(buyCoins);
    // this.saveInDB(toBuy)

    let toSell = _.filter(this.myMarkets, {'action': ACTIONS.TO_SELL});

    console.log('TO_SELL: ' + toSell.length);

    let sellCoinsChanges: IMarketRecommended[] = FollowCoinAnalytics.analizeToSell(toSell);

    let sellCoins = _.filter(this.myMarkets, {'action': ACTIONS.SELL});

    console.log('SELL: ' + sellCoins.length);

    this.sellCoins(sellCoins);

    let boughtCoins = _.filter(this.myMarkets, {'action': ACTIONS.BOUGHT});

    console.log('BOUGHT: ' + boughtCoins.length);

    FollowCoinHelper.removeCoins(this.myMarkets, ACTIONS.NONE);
    FollowCoinHelper.removeCoins(this.myMarkets, ACTIONS.SOLD);

    FollowCoinHelper.saveMyMarkets(this.myMarkets);
    console.log('%c ----------------------------------------------------------------', 'color:green');
  }

  sellCoins(markets: IMarketRecommended[]) {
    if (markets.length === 0) return;

    console.log('%c SELL ' + _.map(markets, 'coin'), 'color:red');

    this.saveInDB(markets);

    setTimeout(() => {
      console.log('%c SOLD ' + _.map(markets, 'coin'), 'color:red');
      markets.forEach(function (item) {
        item.action = ACTIONS.SOLD;
      });
    }, 20000);

  }


  buyCoins(markets: IMarketRecommended[]) {
    if (markets.length === 0) return;

    console.log('%c BUYING ' + _.map(markets, 'coin'), 'color:red');
    this.saveInDB(markets);
    setTimeout(() => this.bougthCoins(markets), 20000);
  }

  bougthCoins(markets) {
    markets.forEach(function (item) {
      item.action = ACTIONS.BOUGHT;
    });

    console.log('%c BOUGHT ' + _.map(markets, 'coin'), 'color:red');

    setTimeout(() => {
      console.log('%c transfering TO SELL ' + _.map(markets, 'coin'), 'color:red');
      this.saveInDB(markets);
      FollowCoinHelper.transferBoughtToSell(this.myMarkets);

    }, 10000)
  }


  /*onCoinStats(stats: IMarketRecommended) {
    if(stats.action === ACTIONS.GAINER){
         let OK =  FollowCoinHelper.analizeGaner(stats, this.gainers);
          if(OK) stats.action = ACTIONS.TO_BUY;
    }

  }*/

  private saveInDB(stats: IMarketRecommended[]) {

    this.database.saveMarkets(stats).then(res => {
      console.log(res);
    }).catch(err => {
      console.error(err)
    })
  }

  ngOnInit() {
    this.myMarkets = FollowCoinHelper.loadMyMarkets();

    setInterval(() => this.analizeData(), 60000);
    this.analizeData();


    this.collectMarketDataService.onDone.subscribe(exchange => {
      console.log('DONE ' + exchange);
      this.isCollectiongData = false;

    });

    this.collectMarketDataService.marketData$().subscribe((newStats: IMarketRecommended) => {
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

    let toSellCoins = this.myMarkets.filter(function (item) {
      return item.action === ACTIONS.TO_SELL;
    });

    let gainers = this.myMarkets.filter(function (item) {
      return item.action === ACTIONS.GAINER;
    });

    console.log(' collect data TO_SELL ' + toSellCoins.length);
    console.log(' collect data GAINERS ' + gainers.length);


    let reqired = FollowCoinHelper.cloneRecommendedBasic(toSellCoins.concat(gainers), MC);

    if(reqired.length){
      this.isCollectiongData = true;
      this.collectMarketDataService.collectMarketData(this.exchange, reqired);
    }
  }

  checkNewGainers() {
    if (this.myMarkets.length > 11) {
      console.log(' LIMIT 12 coins ');
      return;
    }

    let MC: { [symbol: string]: VOMarketCap } = _.last(this.historyMC);

    let api = this.allApis.getPublicApi(this.exchange);

    api.getCurrency().then(currency => {

      let exchange = this.exchange
      let MCAr: VOMarketCap[] = Object.values(MC);

      let baseMC = MC['BTC'];


      let gainers = MCAr.filter(function (item) {
        return item.tobtc_change_1h > 2;
      });

      if (baseMC.tobtc_change_1h > 2) gainers.unshift(baseMC);

      console.log(' gainers ' + gainers.length);

      let available = gainers.filter(function (item) {
        return currency.indexOf(item.symbol) !== -1;
      });

      let following = this.myMarkets.map(function (item) {
        return item.coin;
      });

      console.log(' available gainers ' + available.length);

      available = available.filter(function (item) {
        return following.indexOf(item.symbol) === -1;
      });

      let newGainers = FollowCoinHelper.createGainers(baseMC, available, MC, ' tobtc_change_1h > 2 btc: ' + baseMC.percent_change_1h, this.exchange);

      console.log('%c new gainers ' + newGainers.length + ' ' + _.map(newGainers, 'coin'), 'color:red');

      this.myMarkets = this.myMarkets.concat(newGainers);

      this.isCollectiongData = true;
      this.collectMarketDataService.collectMarketData(this.exchange, newGainers);

    })


  }

}
