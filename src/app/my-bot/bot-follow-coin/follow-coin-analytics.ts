import {IMarketRecommended} from "../../services/utils-order";
import {ACTIONS, FollowCoinHelper} from "./follow-coin-helper";

export class FollowCoinAnalytics {


  static analizeToBuy(markets: IMarketRecommended[]) {
    let changes = [];
    markets.forEach(function (item: IMarketRecommended) {
      if (item.coinMC.percent_change_1h < 1) {
        item.action = ACTIONS.NONE;
        console.log('%c to remove  TO_BUY ' + item.coin + ' ' + item.coinMC.percent_change_1h, 'color:red');
      } else {
        if (!item.reports) item.reports = [];
        item.reports.push(new Date().toLocaleTimeString() + ' US '+item.coinMC.price_usd);
        if (item.percentBuy < 0) {
          let msg = ' percentBuy  '+ item.percentBuy;
          console.log('%c changing BUY' + item.coin +msg, 'color:#25383C');
          item.action = ACTIONS.BUY;
          item.reports.push(new Date().toLocaleTimeString() + msg);
          changes.push(item);
        }
      }

    });
  }

  static analizeGaners(gainers: IMarketRecommended[]): IMarketRecommended[] {
    let toBuy = [];
    gainers.forEach(function (gainer) {
      if (gainer.coinMC.percent_change_1h < 1) {
        gainer.action = ACTIONS.NONE;
        console.log('%c to remove GAINER ' + gainer.coin + '  ' + gainer.coinMC.percent_change_1h, 'color:red');
      } else {
        if (!gainer.reports) gainer.reports = [];
        gainer.reports.push(new Date().toLocaleTimeString() + ' US ' + gainer.coinMC.price_usd);
       // console.log(gainer);

        if(gainer.percentBuy < -1){
          gainer.action = ACTIONS.BUY;

          console.log('%c changing BUY' + gainer.coin, 'color:brown');
          gainer.reports.push(new Date().toLocaleTimeString() + ' BUY percentBuy: ' + gainer.percentBuy);

        }else if (gainer.history && gainer.history.length > 2) {

          console.log('%c changing TO_BUY' + gainer.coin, 'color:brown');

          gainer.reports.push(new Date().toLocaleTimeString() + ' TO BUY percent_change_1h:' + gainer.coinMC.percent_change_1h);
          gainer.action = ACTIONS.TO_BUY;
        }
      }

    });
    return toBuy;
  }


  static analizeToSell(markets: IMarketRecommended[]) {
    let sell: IMarketRecommended[] = [];

    let time = new Date().toLocaleTimeString();
    markets.forEach(function (market) {
      if (!market.reports) market.reports = [];
      if (market.coinMC.percent_change_1h < -2) {
        market.action = ACTIONS.SELL;
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



