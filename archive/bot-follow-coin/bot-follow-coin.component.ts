import {Component, OnInit} from '@angular/core';
//import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {VOMarketCap} from "../../src/app/models/app-models";
import {MarketCapService} from "../../src/app/market-cap/services/market-cap.service";

import {MarketCollectorService} from "../bot/market-collector.service";
import {IMarketDataCollect, IMarketRecommended} from "../../src/app/com/utils-order";
import {DatabaseService} from "../../src/app/services/database.service";
import * as _ from 'lodash';
import * as moment from 'moment';
import {ACTIONS, FollowCoinHelper} from "./follow-coin-helper";
import {FollowCoinAnalytics} from "./follow-coin-analytics";
import {AnalizeData} from "./analize-data";
import {BuySellCoins} from "./buy-sell-coins";
import {IApiPublic} from "../../src/app/my-exchange/services/apis/api-base";
import {CoinAnalytics, NewGainers} from "./new-gainers";
import {ApisPublicService} from "../../src/app/apis/apis-public.service";
import {ApiMarketCapService} from "../../src/app/apis/api-market-cap.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-bot-follow-coin',
  templateUrl: './bot-follow-coin.component.html',
  styleUrls: ['./bot-follow-coin.component.css']
})
export class BotFollowCoinComponent implements OnInit {

  exchange: string = 'poloniex';

  dataset: string[][];

  isCollectiongData: boolean;
  myMarkets: IMarketRecommended[] = [];
  exchangeCoins: string[];

  private historyMC: { [symbol: string]: VOMarketCap }[] = [];


  constructor(private allApis: ApisPublicService,
              private router: Router,
              private route: ActivatedRoute,
              private marketCap: ApiMarketCapService,
              private database: DatabaseService) {

  }

  async downloadMCRecordAfter(date: string) {

    const mc = await this.marketCap.downloadOneRecord(date, null).toPromise();

  }

  async downloadRecordBefore(date: string) {

  }

  filterOnlyExchangeCoins(exchangeCoins, MC) {
    const out = {}
    for (let str in MC) {
      if (exchangeCoins[str]) out[str] = MC[str];
    }
    return out;
  }

  analigeGaners(gainersVolumeSorted: CoinAnalytics[], newData) {
    const btcMC = newData.data['BTC'];
    if (!btcMC) return;
    console.log(newData.createdAt + '   BTC 1h ' + btcMC.percent_change_1h);
    const MC = newData.data;
    gainersVolumeSorted.forEach(function (gainer: CoinAnalytics) {
      const mc: VOMarketCap = MC[gainer.symbol];
      if (mc) {
        const priceChange = (100 * (mc.price_usd - gainer.price_usd) / gainer.price_usd);
        const rankchange = gainer.rank - mc.rank;
         const vol =   (100 * (mc.volume_usd_24h - gainer.volume) / gainer.volume);
        const color = +priceChange > 0 ? 'green' : 'red';
        console.log('%c ' + gainer.symbol + ' P:'
          + priceChange.toFixed(2) + ' was P '
          + gainer.priceSpeed.toFixed(2)
          + ' rank+ ' + rankchange
          + ' v '+ vol.toFixed(2)
          , 'color:' + color);
      } else {
        console.warn(gainer.symbol);
      }
    })
  }

  async getWeekForCoins(gainersVolumeSorted, moment) {
    const out = {};

    const step = 15;
    const stepOf ='m';

    const data1 = await this.marketCap.downloadOneRecord(moment.add(step, stepOf).format(), null).toPromise();


    this.analigeGaners(gainersVolumeSorted, data1);
    const data2 = await this.marketCap.downloadOneRecord(moment.add(step, stepOf).format(), null).toPromise();

    this.analigeGaners(gainersVolumeSorted, data2);
    const data3 = await this.marketCap.downloadOneRecord(moment.add(step, stepOf).format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data3);

    const data4 = await this.marketCap.downloadOneRecord(moment.add(step, stepOf).format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data4);

    const data5 = await this.marketCap.downloadOneRecord(moment.add(step, stepOf).format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data5);

    const data6 = await this.marketCap.downloadOneRecord(moment.add(step, stepOf).format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data6);
    const data7 = await this.marketCap.downloadOneRecord(moment.add(step, stepOf).format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data7);
    const data8 = await this.marketCap.downloadOneRecord(moment.add(step, stepOf).format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data8);
    const data9 = await this.marketCap.downloadOneRecord(moment.add(step, stepOf).format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data9);
    const data10 = await this.marketCap.downloadOneRecord(moment.add(step, stepOf).format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data10);
    const data11 = await this.marketCap.downloadOneRecord(moment.add(step, stepOf).format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data11);
    const data12 = await this.marketCap.downloadOneRecord(moment.add(step, stepOf).format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data12);
    return out;
  }

  private filterMyCoins(res: any): any {
    const out = {};
    for (let str in res.data) {
      if (!!BotFollowCoinComponent.myCoins[str]) out[str] = res.data[str];
    }
    res.data = out;
    return res;
  }

  static filterGainers(analytics: CoinAnalytics[]): CoinAnalytics[] {
    return analytics.filter(function (gainer) {
      return gainer.priceSpeed >= 0 && gainer.priceSpeedAbs > 0 && gainer.volumeSpeed  >= 0;
    });
  }

  async analyseHistory() {

    const weekago = moment().subtract(3, 'd');
    weekago.add(10, 'h');

    const data0 = await this.marketCap.downloadOneRecord(weekago.format(), null).toPromise().then(this.filterMyCoins);
    console.log(' my ' + Object.keys(data0.data).length);


    const data1 = await this.marketCap.downloadOneRecord(weekago.add(15, 'm').format(), null).toPromise();
    let analytics1: CoinAnalytics[] = NewGainers.getrGanersByVolume(data0.data, data1.data);
    analytics1 = BotFollowCoinComponent.filterGainers(analytics1);
    const symbols1: string[] = _.map(analytics1, 'symbol');

    console.log(symbols1.length);

    const data2 = await this.marketCap.downloadOneRecord(weekago.add(15, 'm').format(), null).toPromise();
    let analytics2: CoinAnalytics[] = NewGainers.getrGanersByVolume(data1.data, data2.data);
    analytics2 = BotFollowCoinComponent.filterGainers(analytics2);
    const symbols2: string[] = _.map(analytics2, 'symbol');

    console.log(symbols2.length);
/*
    const data3 = await this.marketCap.downloadOneRecord(weekago.add(1, 'h').format(), null).toPromise();
    let analytics3: CoinAnalytics[] = NewGainers.getrGanersByVolume(data0.data, data3.data);
    analytics3 = BotFollowCoinComponent.filterGainers(analytics3);
    const symbols3: string[] = _.map(analytics3, 'symbol');*/

    //console.log(symbols3.length);

    const gainers: CoinAnalytics[] = analytics2.filter(function (item) {
      return symbols1.indexOf(item.symbol) !== -1 && symbols2.indexOf(item.symbol) !== -1;
    });
    console.log(gainers);

    if (gainers.length === 0) return;

    const gainersSorted = _.takeRight(gainers, 20);

    const done = await this.getWeekForCoins(gainersSorted, weekago);

    console.log(done);
  }

  async downloadHistory() {



    /*//
    //console.log(mc);

    const history = await this.marketCap.downloadHistoryFromLatHours(10).toPromise();
    // console.log(history);
    const gainersVolume = NewGainers.getrGanersVolume(Object.values(history));

    const gainersVolumeSorted1 = _.orderBy(gainersVolume, 'volumeSpeed', 'desc');
    console.log(gainersVolumeSorted1);

    const gainersVolumeSorted2 = _.orderBy(gainersVolumeSorted1, 'priceSpeed');

    console.log(gainersVolumeSorted2);
    const dataset = [];


    /!* gainersVolume.forEach(function (item: VOMarketCap[]) {
       const row = [item[0].symbol];
       const l = item.length - 1;
       if (l > 2) {
         row.push((100 * (item[l].volume_usd_24h - item[l - 1].volume_usd_24h) / item[l].volume_usd_24h).toFixed(2));
         row.push((100 * (item[l].volume_usd_24h - item[0].volume_usd_24h) / item[l].volume_usd_24h).toFixed(2));
         row.push('');
       } else row.push('', '', '');

       item.forEach(function (mc: VOMarketCap) {
         row.push(String(mc.percent_change_1h));
       })
       dataset.push(row);

     })*!/

    this.dataset = dataset;*/
  }

  onRefreshDataClick() {
    this.downloadHistory();
  }

  onRowClick(row) {
    const coin = row[0];
    console.log(coin);
    this.router.navigate(['../coin-graph/' + coin], {relativeTo: this.route});
    // this.router.navigateByUrl()
  }

  static myCoins: { [symbol: string]: any };

  ngOnInit() {
    const exchange = 'bittrex';
    this.allApis.getExchangeApi(exchange)
      .getAllCoins()
     /* .then(myCoins => {
        this.analyseHistory();
        BotFollowCoinComponent.myCoins = myCoins
        console.log('mycoins ' + Object.keys(BotFollowCoinComponent.myCoins).length);
      })*/


    // this.downloadHistory();


    /*let api: IApiPublic = this.allApis.getPublicApi(this.exchange);

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
    });*/

  }

  /* analizeData() {
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

    let gainers = _.filter(myMarkets, {'status': ACTIONS.GAINER});

    FollowCoinAnalytics.analizeGaners(gainers);


    this.database.saveMarkets(gainers);
    //AnalizeData.analizeData(myMarkets);

    //BuySellCoins.buySell(myMarkets, this.database);
    //FollowCoinHelper.removeCoins(myMarkets, ACTIONS.NONE);
    myMarkets.forEach(function (item) {
      item.updatedAt = 0;
    });
    FollowCoinHelper.saveMyMarkets(this.myMarkets);
  }*/
  /* onMC(MC) {
     if (this.historyMC.length > 10) this.historyMC.shift();
     if (this.historyMC.length) {

       let last = this.historyMC[this.historyMC.length - 1];
       let lastBTC: VOMarketCap = last['BTC'];
       let btc: VOMarketCap = MC['BTC'];
       //console.log(lastBTC.last_updated, btc.last_updated);
       if (lastBTC.last_updated < btc.last_updated) this.historyMC.push(MC);
       //console.warn(' Last  ' +lastBTC.last_updated + ' new ' +  btc.last_updated);

     } else this.historyMC.push(MC);

     this.myMarkets.forEach(function (item) {
       item.coinMC = MC[item.coin];
       item.baseMC = MC[item.base];
     });

     this.collectDataExists(MC);
     this.checkNewGainers();
   }

   collectDataExists(MC) {

     let toSellCoins = this.myMarkets.filter(function (item) {
       return item.status === ACTIONS.TO_SELL;
     });

     let gainers = this.myMarkets.filter(function (item) {
       return item.status === ACTIONS.GAINER;
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

   }*/

}
