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
        if (item.percentBuy < 0) {
          item.action = ACTIONS.BUY;
          item.reports.push(new Date().toLocaleTimeString() + ' percentBuy < 0 BUY ');
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
        if (gainer.history && gainer.history.length > 2) {
          let first = gainer.history[0];
          let from = first.date;
          gainer.reports.push(new Date().toLocaleTimeString() + ' TO BUY history > 2  percent_change_1h:' + gainer.coinMC.percent_change_1h + ' from ' + from);
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
        market.reason = 'percent_change_1h ' + market.coinMC.percent_change_1h;
        market.timestamp = Date.now();
        market.date = time;
        market.reports.push(time + ' ' + market.reason);
        sell.push(market);
      } else {
        market.reports.push(time + 'not -2 percent_change_1h ' + market.coinMC.percent_change_1h)
      }
    });

    return sell;
  }


}



