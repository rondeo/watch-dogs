import {Injectable} from '@angular/core';
import {VOMarketCap, VOOrder} from "../../../models/app-models";

import {Subject} from "rxjs/Subject";

import {ApiBase} from "../../services/apis/api-base";
import {ConnectorApiService} from "../../services/connector-api.service";
import {FollowCoinController, IBotData} from "./follow-coin-controller";
import {MarketCapService} from "../../../market-cap/services/market-cap.service";
import {VOTradesStats} from "../../../services/utils-order";

@Injectable()
export class FollowCoinService {


  private sellCoinSub: Subject<VOOrder> = new Subject()

  private myCoins: FollowCoinController[] = [];

  sellCoin$() {
    return this.sellCoinSub.asObservable();
  }

  constructor(private apis: ConnectorApiService,
              private marketCap: MarketCapService) {


   /* marketCap.getCoinsObs().subscribe(MC => {
      this.onMCData(MC);

    })*/

  }


  getCoins() {
    return this.myCoins;
  }

  onMCData(MC: { [symbol: string]: VOMarketCap }) {
    this.myCoins.forEach(function (item, i) {
      item.onMC(MC, i);
    });
  }

  followCoin(api: ApiBase, marketStats: VOTradesStats, order: VOOrder, reasons: string[]) {

    let botData: IBotData = {
      startStats: marketStats,
      timestamp: Date.now(),
      reports: reasons,
      buyOrder: order,
      sellOrder: null
    };


    // console.log('followCoin ', botData);


    let myBot = new FollowCoinController(botData);

    //console.log(myBot);

    myBot.start(api);

    this.myCoins.push(myBot);
    this.save();

  }

  loadBots() {

    let models: IBotData[] = JSON.parse(localStorage.getItem('my-follow-coins') || '[]');

    //console.log(models);
    let bots = models.map(function (item) {
      return new FollowCoinController(item);
    });

    bots.forEach((item) => {
      let api = this.apis.getPrivateAPI(item.exchange);
      item.start(api);
    })
    this.myCoins = bots;
  }

  getExistingsBots(): string[] {

    return this.myCoins.map(function (item) {
      return item.exchange + '_' + item.base + '_' + item.coin
    })
  }

  save() {

    let models = this.myCoins.map(function (item) {

      return item.toString();
    });

    //console.log(models);

    let str = '[' + models.join(',') + ']';
    // console.log(str);

    localStorage.setItem('my-follow-coins', str);
  }

}
