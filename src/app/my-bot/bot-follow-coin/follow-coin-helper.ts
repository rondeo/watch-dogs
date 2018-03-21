import {IMarketDataCollect, IMarketRecommended, VOMarketsStats, VOTradesStats} from "../../services/utils-order";
import {VOMarketCap} from "../../models/app-models";
import * as _ from 'lodash';


export enum ACTIONS {
  NONE = 'NONE',
  GAINER = 'GAINER',
  TO_SELL = 'TO_SELL',
  SELL = 'SELL',
  TO_BUY = 'TO_BUY',
  BUY = 'BUY',
  BUYING = 'BUYING',
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
        coinMC: item.coinMC
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


  static updateStatsHistory(marketData: IMarketDataCollect, collection: IMarketRecommended[]) {
    let market = collection.find(function (item) {
      return item.base === marketData.base && item.coin === marketData.coin;
    });


    if (!market) {
      console.warn(' no market ' + marketData.coin);
    }
    else {

      market.updatedAt = Date.now();
      market.timeStats = new Date().toLocaleTimeString();
      FollowCoinHelper.updateValues(market, marketData);
      if (!market.history) market.history = [];
      if (market.history.length > 10) market.history.shift();
      market.history.push(marketData);
    }
  }

  static updateValues(stats: IMarketRecommended, newstats: IMarketDataCollect) {


    stats.percent_1h_ToBase = stats.coinMC.tobtc_change_1h;

    if(isNaN( stats.SumPersent1h)) stats.SumPersent1h = 0;
    stats.SumPersent1h += stats.coinMC.percent_change_1h;


    if (newstats.marketStats) {

      if (!stats.MCUS) stats.MCUS = [];
      if (!stats.LastsUS) stats.LastsUS = [];

      if(!stats.persent_1h) stats.persent_1h = [];
      stats.persent_1h.push(stats.coinMC.percent_change_1h);

      stats.MCUS.push(stats.coinMC.price_usd);
      stats.LastsUS.push(newstats.marketStats.LastUS);
      stats.AskToBid = +((newstats.marketStats.AskUS - newstats.marketStats.BidUS) / newstats.marketStats.BidUS).toFixed(2);

      stats.lastToMC = +((newstats.marketStats.LastUS - stats.coinMC.price_usd) / stats.coinMC.price_usd).toFixed(2);
    }

    if (newstats.tradesStats) {


      stats.lastToMCTrades = +((newstats.tradesStats.rateLastUS - stats.coinMC.price_usd) / stats.coinMC.price_usd).toFixed(2);
      stats.speedPerMinute = newstats.tradesStats.speedPerMin;
      stats.percentBuy = newstats.tradesStats.percentBuy;
    }



    //stats.price_B = stats.coinMC.price_btc;


  }

  static logData(curMC:VOMarketCap, prevMC:VOMarketCap){

    let price_usd = +((curMC.price_usd - prevMC.price_usd)/ prevMC.price_usd).toFixed(5);

    let price_btc = +((curMC.price_btc - prevMC.price_btc)/ prevMC.price_btc).toFixed(5);

    let percent_change_1h = +((curMC.percent_change_1h - prevMC.percent_change_1h)/ prevMC.percent_change_1h).toFixed(5);

    let available_supply = +((curMC.available_supply - prevMC.available_supply)/ prevMC.available_supply).toFixed(5);

    let max_supply = +((curMC.max_supply - prevMC.max_supply)/ prevMC.max_supply).toFixed(5);

    let total_supply = +((curMC.total_supply - prevMC.total_supply)/ prevMC.total_supply).toFixed(5);

    let volume_usd_24h = +((curMC.volume_usd_24h - prevMC.volume_usd_24h)/ prevMC.volume_usd_24h).toFixed(5);


    let market_cap_usd = +((curMC.market_cap_usd - prevMC.market_cap_usd)/ prevMC.market_cap_usd).toFixed(5);


    console.log('%c BTC market_cap_usd: ' + market_cap_usd + ' available_supply ' + available_supply + ' max_supply ' + max_supply
      + ' total_supply ' + total_supply + ' volume_usd_24h  ' + volume_usd_24h
      + ' percent_change_1h ' + percent_change_1h + ' price_usd '+ price_usd + ' price_btc ' + price_btc, 'color:purple');

  }
/*
  static transferBoughtToSell(myMarkets: IMarketRecommended[]) {

    let boughtCoins = myMarkets.filter(function (item) {
      return item.action === ACTIONS.BOUGHT;
    });
    if (boughtCoins.length === 0) return;
    let toSell = myMarkets.filter(function (item) {
      return item.action === ACTIONS.TO_SELL;
    });
    let toSellExists: string[] = _.map(boughtCoins, 'coin');

    boughtCoins.forEach(function (item) {
      if (toSellExists.indexOf(item.coin) === -1) {
        item.action = ACTIONS.TO_SELL;
        myMarkets.unshift(item);
      }
    })
  }*/

  static createGainer(baseMC: VOMarketCap, gainer: VOMarketCap, MC: { [symbol: string]: VOMarketCap }, reason: string, exchange: string): IMarketRecommended{
    let time = new Date().toLocaleTimeString();
    //if (gainer.symbol === 'BTC') baseMC = MC['USDT'];
      return {
        exchange: exchange,
        coin: gainer.symbol,
        base: baseMC.symbol,
        action: ACTIONS.GAINER,
        timestamp: Date.now(),
        date: time,
        reason: time + reason,
        coinMC: MC[gainer.symbol],
        baseMC: baseMC,
        reports: [time +' ' + reason]
      }

  }


  static cloneRecommendedBasic(markets: IMarketRecommended[], MC: { [symbol: string]: VOMarketCap }): IMarketDataCollect[] {
    return markets.map(function (item) {
      return {
        exchange: item.exchange,
        coin: item.coin,
        base: item.base,
        priceBaseUS: MC[item.base].price_usd,
        tradesStats: null,
        marketStats: null
      }
    });
  }


  static removeCoins(markets: IMarketRecommended[], action: ACTIONS) {
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
