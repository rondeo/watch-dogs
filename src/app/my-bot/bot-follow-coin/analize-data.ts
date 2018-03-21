import {ACTIONS, FollowCoinHelper} from "./follow-coin-helper";
import {FollowCoinAnalytics} from "./follow-coin-analytics";
import {IMarketRecommended} from "../../services/utils-order";
import * as _ from 'lodash';

export class AnalizeData {

  static analizeData(myMarkets:IMarketRecommended[]) {

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
    //FollowCoinHelper.removeCoins(this.myMarkets, ACTIONS.SOLD);

    console.log('%c ----------------------------------------------------------------', 'color:green');
  }
}
