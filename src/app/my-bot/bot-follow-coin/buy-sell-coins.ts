import {DatabaseService} from "../../services/database.service";
import {IMarketRecommended} from "../../services/utils-order";
import {ACTIONS} from "./follow-coin-helper";
import * as _ from 'lodash';

export class BuySellCoins {

  static buySell( myMarkets:IMarketRecommended[], database: DatabaseService){

    let buyCoins = _.filter(myMarkets, {'action': ACTIONS.BUY});

    console.log('BUY ' + buyCoins.length);

    if (buyCoins.length){

      console.log('%c BUY ' + _.map(buyCoins, 'coin'), 'color:red');

      buyCoins.forEach(function (item) {
        item.status = ACTIONS.BUYING;
        item.newData = 7;
      });

      database.saveMarkets(buyCoins).then(res => {
        console.log(res);
      }).catch(err => {
        console.error(err);
      });

    }




    let buyingCoins = _.filter(myMarkets, {'action': ACTIONS.BUYING});

    console.log('BUYING ' + buyingCoins.length);

    if(buyingCoins.length){

      setTimeout(() => {

        console.log('%c BOUGHT now TO_SELL ' + _.map(buyCoins, 'coin'), 'color:red');
        buyingCoins.forEach(function (item:IMarketRecommended) {
          //item.newData = 6;
          item.status = ACTIONS.TO_SELL;
        });

      }, 10000);



    }


    let sellCoins = _.filter(myMarkets, {'action': ACTIONS.SELL});
    console.log('SELL ' + sellCoins.length)

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
          item.status = ACTIONS.SOLD;
        });
      }, 20000);


    }





  }
}
