import {DatabaseService} from "../../services/database.service";
import {IMarketRecommended} from "../../services/utils-order";
import {ACTIONS} from "./follow-coin-helper";
import * as _ from 'lodash';

export class BuySellCoins {

  static buySell( myMarkets:IMarketRecommended[], database: DatabaseService){

    let buyCoins = _.filter(myMarkets, {'action': ACTIONS.BUY});


    if (buyCoins.length){

      console.log('%c BUYING ' + _.map(buyCoins, 'coin'), 'color:red');

      buyCoins.forEach(function (item) {
        item.action = ACTIONS.BUYING;
      });

      database.saveMarkets(buyCoins).then(res => {
        console.log(res);
      }).catch(err => {
        console.error(err);
      });

     /* setTimeout(() => {

        buyCoins.forEach(function (item:IMarketRecommended) {
          item.newData = 6;
          item.action = ACTIONS.BOUGHT;
        });

      }, 2000);*/

      setTimeout(() => {

        buyCoins.forEach(function (item:IMarketRecommended) {
          item.newData = 6;
          item.action = ACTIONS.TO_SELL;
        });

      }, 10000);
    }



    let sellCoins = _.filter(myMarkets, {'action': ACTIONS.SELL});


    if (sellCoins.length) {

      console.log('%c SELL ' + _.map(sellCoins, 'coin'), 'color:red');

      database.saveMarkets(sellCoins).then(res => {
        console.log(res);
      }).catch(err => {
        console.error(err)
      })

      setTimeout(() => {
        console.log('%c SOLD ' + _.map(sellCoins, 'coin'), 'color:red');
        sellCoins.forEach(function (item) {
          item.newData = 5;
          item.action = ACTIONS.SOLD;
        });
      }, 20000);


    }





  }
}
