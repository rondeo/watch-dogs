import {ACTIONS, FollowCoinHelper} from "./follow-coin-helper";
import {FollowCoinAnalytics} from "./follow-coin-analytics";
import {IMarketRecommended} from "../../services/utils-order";
import * as _ from 'lodash';

export class AnalizeData {

  static analizeData(allMarkets:IMarketRecommended[]) {
    console.log('%c  --------------------------------------------------------- have: ' + allMarkets.length, 'color:green');
    let myMarkets = allMarkets.filter(function (item) {
      return item.newData;
    });

    if(!myMarkets.length) {
      console.log(' NO new data ');
      return;
    }

    console.log(' new data ', myMarkets);

    let gainers = _.filter(myMarkets, {'action': ACTIONS.GAINER});

    console.log('GAINERS: ' + gainers.length);

    FollowCoinAnalytics.analizeGaners(gainers);


    let toBuy = _.filter(myMarkets, {'action': ACTIONS.TO_BUY});

    console.log('TO_BUY: ' + toBuy.length);

    FollowCoinAnalytics.analizeToBuy(toBuy);

    let buyCoins = _.filter(myMarkets, {'action': ACTIONS.BUY});

    console.log(' BUY : ' + buyCoins.length);

    //this.buyCoins(buyCoins);
    // this.saveInDB(toBuy)

    let toSell = _.filter(myMarkets, {'action': ACTIONS.TO_SELL});

    console.log('TO_SELL: ' + toSell.length);

    //this.saveInDB(toSell);

    let sellCoinsChanges: IMarketRecommended[] = FollowCoinAnalytics.analizeToSell(toSell);

    //let sellCoins = _.filter(myMarkets, {'action': ACTIONS.SELL});

    //console.log('SELL: ' + sellCoins.length);

    ///this.sellCoins(sellCoins);


    let boughtCoins = _.filter(myMarkets, {'action': ACTIONS.BOUGHT});

    console.log('BOUGHT: ' + boughtCoins.length);

    if(boughtCoins.length){

      boughtCoins.forEach(function (item:IMarketRecommended) {

        item.date = new Date().toLocaleTimeString();
        let report = item.date + ' transfer TO_SELL ';
        console.log(report);
        item.reports.push(report);
        item.action = ACTIONS.TO_SELL;
      });

      //this.saveInDB(boughtCoins);
    }


    FollowCoinHelper.removeCoins(allMarkets, ACTIONS.NONE);
    //FollowCoinHelper.removeCoins(this.myMarkets, ACTIONS.SOLD);
    allMarkets.forEach(function (item) {
      item.newData = 0;
    })

    FollowCoinHelper.saveMyMarkets(allMarkets);
    console.log('%c ----------------------------------------------------------------', 'color:green');
  }
}
