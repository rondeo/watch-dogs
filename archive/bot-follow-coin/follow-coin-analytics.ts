import {IMarketRecommended} from "../../src/app/com/utils-order";
import {ACTIONS, FollowCoinHelper} from "./follow-coin-helper";
import * as _ from 'lodash';

export class FollowCoinAnalytics {


  static analizeToBuy(markets: IMarketRecommended[]) {
    let changes = [];
    markets.forEach(function (item: IMarketRecommended) {
     // if (item.coinMC.percent_change_1h < 1) {
       // item.status = ACTIONS.NONE;
        //console.log('%c to remove  TO_BUY ' + item.coin + ' ' + item.coinMC.percent_change_1h, 'color:red');
     // } else {
        if (!item.reports) item.reports = [];

        item.reports.push(new Date().toLocaleTimeString() + ' US '+item.coinMC.price_usd);
        if (item.percentBuy < 0) {
          let msg = ' percentBuy  '+ item.percentBuy;
          console.log('%c changing BUY ' + item.coin +msg, 'color:red');
          item.status = ACTIONS.BUY;
          item.reports.push(new Date().toLocaleTimeString() + msg);
          changes.push(item);
        }
     // }

    });
  }

  static analizeGaners(gainers: IMarketRecommended[]): IMarketRecommended[] {

    let toBuy = [];
    gainers.forEach(function (gainer) {
     // if (gainer.coinMC.percent_change_1h < 1) {
       // gainer.status = ACTIONS.NONE;
       // console.log('%c to remove GAINER ' + gainer.coin + '  ' + gainer.coinMC.percent_change_1h, 'color:red');
      //} else {
      if (!gainer.reports) gainer.reports = [];

        gainer.reports.push(new Date().toLocaleTimeString() + ' US ' + gainer.coinMC.price_usd);
       // console.log(gainer);

        //if(gainer.percentBuy < -1){
         // gainer.status = ACTIONS.BUY;

         /// let report = ' BUY percentBuy: ' + gainer.percentBuy;
         // console.log('%c changing BUY ' + gainer.coin + report, 'color:red');
         // gainer.reports.push(new Date().toLocaleTimeString() + report);

       // }else if (gainer.history && gainer.history.length > 2) {

         // console.log('%c changing TO_BUY' + gainer.coin, 'color:brown');

        //  gainer.reports.push(new Date().toLocaleTimeString() + ' TO BUY percent_change_1h:' + gainer.coinMC.percent_change_1h);
         // gainer.status = ACTIONS.TO_BUY;
       // }
     // }

    });
    return gainers;
  }


  static analizeToSell(markets: IMarketRecommended[]) {
    let sell: IMarketRecommended[] = [];

    let time = new Date().toLocaleTimeString();
    markets.forEach(function (market) {
      if (!market.reports) market.reports = [];
      if (market.coinMC.percent_change_1h < -2) {
        market.status = ACTIONS.SELL;
        market.timestamp = Date.now();
        market.date = time;
        market.reports.push(time + ' SELL 1h: ' + market.coinMC.percent_change_1h);
        sell.push(market);
      } else {
        market.reports.push(time + ' 1h ' + market.coinMC.percent_change_1h + ' US: '+ market.coinMC.price_usd)
      }
    });

    return sell;
  }


}



