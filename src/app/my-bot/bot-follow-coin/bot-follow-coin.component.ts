import {Component, OnInit} from '@angular/core';
//import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {VOMarketCap} from "../../models/app-models";
import {MarketCapService} from "../../market-cap/market-cap.service";

import {MarketCollectorService} from "../../my-exchange/my-exchange-bot/bot/market-collector.service";
import {IMarketDataCollect, IMarketRecommended} from "../../services/utils-order";
import {CollectMarketDataService} from "../services/collect-market-data.service";
import {DatabaseService} from "../../services/database.service";
import * as _ from 'lodash';
import * as moment from 'moment';
import {ACTIONS, FollowCoinHelper} from "./follow-coin-helper";
import {FollowCoinAnalytics} from "./follow-coin-analytics";
import {AnalizeData} from "./analize-data";
import {BuySellCoins} from "./buy-sell-coins";
import {IApiPublic} from "../../my-exchange/services/apis/api-base";
import {CoinAnalytics, NewGainers} from "./new-gainers";
import {FrontDeskService} from "../services/front-desk.service";
import {ApiAllPublicService} from "../../apis/api-all-public.service";
import {ApiMarketCapService} from "../../apis/api-market-cap.service";
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


  constructor(private allApis: ApiAllPublicService,
              private router: Router,
              private route: ActivatedRoute,
              private marketCap: ApiMarketCapService,
              private collectMarketDataService: CollectMarketDataService,
              private frontDesk: FrontDeskService,
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

  analigeGaners(gainersVolumeSorted: CoinAnalytics[], newData){
    const btcMC = newData.data['BTC'];

    console.log(newData.createdAt + '   BTC 1h '+ btcMC.percent_change_1h);

    const MC = newData.data;
    gainersVolumeSorted.forEach(function (gainer: CoinAnalytics) {
      const mc:VOMarketCap = MC[gainer.symbol];

      const priceChange  = (100 *(mc.price_usd - gainer.price_usd)/gainer.price_usd).toFixed(2);
      const change = (100 *(mc.market_cap_usd - gainer.orig)/gainer.orig).toFixed(2);
      console.log(gainer.symbol + ' or: ' + gainer.speed + ' now: ' + change +'  P: ' + priceChange);


    })
  }

  async getWeekForCoins(gainersVolumeSorted, moment){
    const out = {};

    const step = 3;

    const data1 = await this.marketCap.downloadOneRecord(moment.add(step, 'h').format(), null).toPromise();


    this.analigeGaners(gainersVolumeSorted, data1);
    const data2 = await this.marketCap.downloadOneRecord(moment.add(step, 'h').format(), null).toPromise();

    this.analigeGaners(gainersVolumeSorted, data2);
    const data3 = await this.marketCap.downloadOneRecord(moment.add(step, 'hours').format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data3);

    const data4 = await this.marketCap.downloadOneRecord(moment.add(step, 'hours').format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data4);

    const data5 = await this.marketCap.downloadOneRecord(moment.add(step, 'hours').format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data5);

    const data6 = await this.marketCap.downloadOneRecord(moment.add(step, 'hours').format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data6);
    const data7 = await this.marketCap.downloadOneRecord(moment.add(step, 'hours').format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data7);
    const data8 = await this.marketCap.downloadOneRecord(moment.add(step, 'hours').format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data8);
    const data9 = await this.marketCap.downloadOneRecord(moment.add(step, 'hours').format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data9);
    const data10 = await this.marketCap.downloadOneRecord(moment.add(step, 'hours').format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data10);
    const data11 = await this.marketCap.downloadOneRecord(moment.add(step, 'hours').format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data11);
    const data12 = await this.marketCap.downloadOneRecord(moment.add(step, 'hours').format(), null).toPromise();
    this.analigeGaners(gainersVolumeSorted, data12);
    return out;
  }


  async analyseHistory() {
    const weekago = moment().subtract(2, 'd');
    const data1 = await this.marketCap.downloadOneRecord(weekago.format(), null).toPromise();
    //  console.log(mc);

    const data2 = await this.marketCap.downloadOneRecord(weekago.add(1, 'h').format(), null).toPromise();



    //const data3 = await this.marketCap.downloadOneRecord(weekago.add(3, 'hours').format(), null).toPromise();
    // console.log(mc2);

    const gainersMarketCap =  NewGainers.getrGanersMarketCap(data1.data, data2.data);
    console.log(gainersMarketCap);

    const gainerSorted =_.takeRight( _.orderBy(gainersMarketCap, 'speed'), 10).reverse();

    this.getWeekForCoins(gainerSorted, weekago);

    if(gainersMarketCap) return;

    const gainersVolume =  NewGainers.getrGanersVolume2(data1.data, data2.data);
    //const gainersVolume3 =  NewGainers.getrGanersVolume2(data1.data, data3.data);

    const filtered = gainersVolume.filter(function (gainer) {
      return gainer.speed > 0 && gainer.priceSpeed > 0;
    })

    //console.log(gainersVolume);;
    //console.log(gainersVolume);;

    const gainersVolumeSorted =_.takeRight( _.orderBy(filtered, 'speed'), 10).reverse();

    this.analigeGaners(gainersVolumeSorted, data2);
    //const gainersVolumeSorted3 =_.takeRight( _.orderBy(gainersVolume3, 'volumeSpeed'), 100).reverse();


    const done = await this.getWeekForCoins(gainersVolumeSorted, weekago);


    console.log(done);

  //  const allCoins = await this.allApis.getAllCoins();

    // console.log(allCoins);
    const collection1 = {};

   /* for (let str in allCoins) {
      collection1[str] = this.filterOnlyExchangeCoins(allCoins[str], mc.data);
      console.log(str, Object.keys(collection1[str]).length)
    }

    const collection2 = {};

    for (let str in allCoins) {
      collection2[str] = this.filterOnlyExchangeCoins(allCoins[str], mc.data);
    }

    console.log(collection1, collection2);*/


  }

  async downloadHistory() {



    //
    //console.log(mc);

    const history = await this.marketCap.downloadHistoryFromLatHours(10).toPromise();
    // console.log(history);
    const gainersVolume = NewGainers.getrGanersVolume(Object.values(history));

    const gainersVolumeSorted1 = _.orderBy(gainersVolume, 'volumeSpeed', 'desc');
    console.log(gainersVolumeSorted1);

    const gainersVolumeSorted2 = _.orderBy(gainersVolumeSorted1, 'priceSpeed');

    console.log(gainersVolumeSorted2);
    const dataset = [];


    /* gainersVolume.forEach(function (item: VOMarketCap[]) {
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

     })*/

    this.dataset = dataset;
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

  ngOnInit() {
    this.analyseHistory();

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

    let gainers = _.filter(myMarkets, {'action': ACTIONS.GAINER});

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

   }*/

}
