import {VOMarketCap} from "../../models/app-models";
import {FollowCoinHelper} from "./follow-coin-helper";
import {IMarketRecommended} from "../../services/utils-order";
import * as _ from 'lodash';
import {IApiPublic} from "../../my-exchange/services/apis/api-base";

export class NewGainers {


  static checkNewGainers(historyMC: { [symbol: string]: VOMarketCap }[], myMarkets: IMarketRecommended[], api: IApiPublic, cb: Function) {


    let MC: { [symbol: string]: VOMarketCap } = _.last(historyMC);

    api.getCurrency().then(currency => {

      let exchange = api.exchange;

      let MCAr: VOMarketCap[] = Object.values(MC);

      let baseMC = MC['BTC'];


      let gainers = MCAr.filter(function (item) {
        return item.tobtc_change_1h > 2;
      });

      if (baseMC.tobtc_change_1h > 2) gainers.unshift(baseMC);

      console.log(' gainers ' + gainers.length);

      let available = gainers.filter(function (item) {
        return currency.indexOf(item.symbol) !== -1;
      });

      let following = myMarkets.map(function (item) {
        return item.coin;
      });

      console.log(' available gainers ' + available.length);

      available = available.filter(function (item) {
        return following.indexOf(item.symbol) === -1;
      });

      let newGainers = FollowCoinHelper.createGainers(baseMC, available, MC, ' tobtc_change_1h > 2 btc: ' + baseMC.percent_change_1h, exchange);

      console.log('%c new gainers ' + newGainers.length + ' ' + _.map(newGainers, 'coin'), 'color:red');

      let toCollect = FollowCoinHelper.cloneRecommendedBasic(newGainers, MC);

      myMarkets = myMarkets.concat(newGainers);

      cb(toCollect);

      //this.isCollectiongData = true;

    })
  }
}

