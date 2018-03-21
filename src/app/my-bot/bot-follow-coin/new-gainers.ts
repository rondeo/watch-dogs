import {VOMarketCap} from "../../models/app-models";
import {FollowCoinHelper} from "./follow-coin-helper";
import {IMarketRecommended} from "../../services/utils-order";
import * as _ from 'lodash';
import {IApiPublic} from "../../my-exchange/services/apis/api-base";
import {forEach} from "@angular/router/src/utils/collection";

export class NewGainers {


  static checkNewGainers(historyMC: { [symbol: string]: VOMarketCap }[],
                         myMarkets: IMarketRecommended[],
                         exchange: string,
                         cb: (newGainers: IMarketRecommended[]) => void) {

    let MC: { [symbol: string]: VOMarketCap } = _.last(historyMC);

    let newGainers = [];

    let MCAr: VOMarketCap[] = Object.values(MC);

    let following = myMarkets.map(function (item) {
      return item.coin;
    });

    following.push('BTC');



    MCAr = MCAr.filter(function (item) {
      return following.indexOf(item.symbol) === -1;
    });

    let rankUP: VOMarketCap[] = [];
    let rankDOWN: VOMarketCap[] = [];
    let baseMC = MC['BTC'];

   // console.log(baseMC);

    if (historyMC.length > 1) {
      let prevMC = historyMC[historyMC.length - 2];

      let prevBTC = prevMC['BTC'];


      FollowCoinHelper.logData(baseMC, prevBTC);




      MCAr.forEach(function (item: VOMarketCap) {

        let prev = prevMC[item.symbol];

        let percent = +((item.market_cap_usd - prev.market_cap_usd)/ prev.market_cap_usd).toFixed(4);
        if(percent > 0){
          console.log(item.symbol + '  ' + percent);
        }


       // let vol =  +((item.volume_usd_24h  - prev.volume_usd_24h)/prev.volume_usd_24h).toFixed(2);
        //console.log(vol);
       // if (vol > 0) {
         // console.log(item.symbol + ' V '+ vol +' rank '+ item.rank +' prev ' + prev.rank)
         // newGainers.push(FollowCoinHelper.createGainer(baseMC, item, MC, ' volume 24h % ' +vol, exchange));
       // }
       // if(item.rank > prev.rank)  rankUP.push(item);
       // else if (item.rank < prev.rank) rankDOWN.push(item)
      })
    }

    //console.log('rankUP ' + _.map(rankUP,'symbol'));
    //console.log('rankDOWN ' + _.map(rankDOWN,'symbol'));

    //let exchange = api.exchange;


    /*let gainers = MCAr.filter(function (item) {
      return item.tobtc_change_1h > 2;
    });
*/
    //if (baseMC.tobtc_change_1h > 2) gainers.unshift(baseMC);

    //console.log(' gainers ' + gainers.length);




/*

    newCoins.forEach(function (item) {
      newGainers.push(FollowCoinHelper.createGainer(baseMC, item, MC, ' tobtc_change_1h ' + item.tobtc_change_1h, exchange));
    });
*/


    console.log('%c new gainers ' + newGainers.length + ' ' + _.map(newGainers, 'coin'), 'color:red');

    cb(newGainers);

  }
}

