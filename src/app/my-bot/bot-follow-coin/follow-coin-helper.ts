import {IMarketRecommended} from "../../services/utils-order";
import {VOMarketCap} from "../../models/app-models";
import * as _ from 'lodash';


export enum ACTIONS {
  NONE = 'NONE',
  GAINER = 'GAINER',
  TO_SELL = 'TO_SELL',
  SELL = 'SELL',
  TO_BUY = 'TO_BUY',
  BUY = 'BUY',
  BOUGHT = 'BOUGHT',
  SOLD = 'SOLD'
}

export class FollowCoinHelper {


  static saveMyMarkets(markets: IMarketRecommended[]) {
    let toSaveData = markets.map(function (item) {
      return {
        reports: item.reports,
        reason: item.reason,
        coin: item.coin,
        base: item.base,
        exchange: item.exchange,
        action: item.action,
        coinMC:item.coinMC
      }
    })
    localStorage.setItem('bot-data', JSON.stringify(toSaveData));
  }

  static loadMyMarkets(): IMarketRecommended[] {
    return JSON.parse(localStorage.getItem('bot-data') || '[]');
  }

  static removeMarket(stats: IMarketRecommended, collection: IMarketRecommended[]) {
    for (let i = collection.length - 1; i >= 0; i--) if (collection[i].base === stats.base && collection[i].coin === stats.coin) collection.splice(i, 1);
  }



  static updateStatsHistory(newStats: IMarketRecommended, collection: IMarketRecommended[]) {
    let market = collection.find(function (item) {
      return item.base === newStats.base && item.coin === newStats.coin;
    });

    if(!market) {
      FollowCoinHelper.updateValues(newStats, newStats);
      collection.push(newStats);
    }
    else{
      FollowCoinHelper.updateValues(market, newStats);
      if(!market.history) market.history = [];
      if (market.history.length > 10) market.history.shift();
        market.history.push(newStats);
    }

  }

  static updateValues(stats: IMarketRecommended, newstats: IMarketRecommended) {

    stats.coinMC = newstats.coinMC;
    stats.baseMC = newstats.baseMC;

    stats.percent_1h_ToBase = newstats.coinMC.tobtc_change_1h;
    stats.persent_1h = newstats.coinMC.percent_change_1h;
    stats.price_US = newstats.coinMC.price_usd;
    stats.price_B = newstats.coinMC.price_btc;
    stats.last_US = newstats.marketStats?newstats.marketStats.LastUS:0;
    stats.percentBuy = newstats.tradesStats?newstats.tradesStats.percentBuy:0;
  }

  static  transferBoughtToSell(myMarkets:IMarketRecommended[]){

    let boughtCoins = myMarkets.filter(function (item) { return item.action===ACTIONS.BOUGHT; });
    if(boughtCoins.length === 0) return;
    let toSell = myMarkets.filter(function (item) { return item.action===ACTIONS.TO_SELL; });
    let toSellExists:string[] = _.map(boughtCoins, 'coin');

    boughtCoins.forEach(function (item) {
      if(toSellExists.indexOf(item.coin) === -1) {
        item.action = ACTIONS.TO_SELL;
        myMarkets.unshift(item);
      }
    })
  }

  static createGainers(baseMC:VOMarketCap, gainers: VOMarketCap[], MC: { [symbol: string]: VOMarketCap }, reason: string, exchange: string) {
    let time = new Date().toLocaleTimeString();
    return gainers.map(function (item) {
      if(item.symbol === 'BTC') baseMC = MC['USDT'];
      return {
        exchange: exchange,
        coin: item.symbol,
        base: baseMC.symbol,
        action: ACTIONS.GAINER,
        timestamp: Date.now(),
        date: time,
        reason: time + reason,
        coinMC: MC[item.symbol],
        baseMC: baseMC,
        reports: [time+' to btc: '+item.tobtc_change_1h + ' full: '+item.percent_change_1h]
      }
    });
  }


  static cloneRecommendedBasic(markets: IMarketRecommended[], MC: { [symbol: string]: VOMarketCap }): IMarketRecommended[] {
    return markets.map(function (item) {
      return {
        exchange: item.exchange,
        coin: item.coin,
        base: item.base,
        coinMC: MC[item.coin],
        baseMC: MC[item.base],
        action: item.action,
        reason: item.reason
        //reports: JSON.parse(JSON.stringify(item.reports || []))
      }
    });
  }




  static removeCoins(markets: IMarketRecommended[], action:ACTIONS) {
    for (let i = markets.length - 1; i >= 0; i--) {
      if (markets[i].action === action) markets.splice(i, 1);
    }
  }

  static removeDuplicates(myMarkets: IMarketRecommended[]) {
    myMarkets.reverse();
    let exists: any = {};
    for (let i = myMarkets.length - 1; i >= 0; i--) {
      let stat = myMarkets[i];
      let id = stat.exchange + stat.base + stat.coin;
      if (!!exists[id]) myMarkets.splice(i, 1);
      exists[id] = 1;
    }
    myMarkets.reverse();
  }


  static tosellCoins: IMarketRecommended[] = [
    {
      exchange: 'poloniex',
      action: ACTIONS.TO_SELL,
      base: 'USDT',
      coin: 'BTC',
      reason: '',
      reports: null
    },
    {
      exchange: 'poloniex',
      action: ACTIONS.TO_SELL,
      base: 'USDT',
      coin: 'LTC',
      reason: '',
      reports: null
    },
    {
      exchange: 'poloniex',
      action: ACTIONS.TO_SELL,
      base: 'USDT',
      coin: 'ETH',
      reason: '',
      reports: null
    }
  ];
}
