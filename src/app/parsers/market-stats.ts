import {VOOrder} from "../models/app-models";


export interface IMarketStats {
  amountBaseBuy: number;
  amountBaseSell: number;
  avgSellPrice: number;
  avgBuyPrice: number;
  maxBuy: number;
  maxSell: number;
  dustSell: number;
  dustBuy: number;
  speed:number;
  duration: number;
  avgRate:number;
  diff:string;
}
export class MarketStats {
  static parseMarketHistory(history: VOOrder[]):IMarketStats{
    const l =  history.length;
    let duration = (history[0].timestamp -  history[l-1].timestamp)/1000/60;

    let speed = l / duration;

    let total = 0;
    let amountCoin = 0;
    let amountBase = 0;
    let firstBuy = 0;
    let lastBuy = 0;
    let firstSell = 0;
    let lastSell = 0;
    let amountBaseBuy = 0;
    let amountCoinBuy = 0;
    let amountBaseSell = 0;
    let amountCoinSell = 0;
    let maxBuy = 0;
    let maxSell = 0;
    let dustSell = 0;
    let dustBuy = 0;

    history.forEach(function (item: VOOrder) {

      if (item.action ==='BUY') {
        amountCoinBuy += item.amountCoin;
        amountBaseBuy += item.amountCoin * item.rate;
        if(amountBaseBuy > maxBuy) maxBuy = amountBaseBuy;
        if(amountCoinBuy < 300) dustBuy ++;

        (firstBuy === 0) ? firstBuy = item.rate : lastBuy = item.rate;
      } else {
        amountCoinSell +=  item.amountCoin;
        amountBaseSell +=  item.amountCoin * item.rate;
        if(amountBaseSell > maxSell) maxSell = amountBaseSell;
        if(amountCoinSell < 300) dustSell ++;

        (firstSell === 0) ? firstSell = item.rate : lastSell = item.rate;
      }

      const amount =  item.amountCoin * item.rate


      amountBase += item.amountCoin * item.rate;
      amountCoin += item.amountCoin;
      total += item.amountCoin * item.rate;
    });

    let avgSellPrice;
    let avgBuyPrice;
    let diff:string;

    if(amountCoinSell && amountCoinBuy){
      avgSellPrice = amountBaseSell / amountCoinSell;
      avgBuyPrice = amountBaseBuy / amountCoinBuy;

      const diff = (100 * (avgBuyPrice - avgSellPrice) / avgSellPrice).toFixed(4);

    } else diff = 'inf';
    const avgRate = +(amountBase / amountCoin).toPrecision(4);
    amountBaseBuy = Math.round(amountBaseBuy/duration);
    amountBaseSell = Math.round(amountBaseSell/duration);
    maxBuy = Math.round(maxBuy/duration);
    maxSell = Math.round(maxSell/duration);

    return {
      amountBaseBuy,
      amountBaseSell,
      avgSellPrice,
      avgBuyPrice,
      maxBuy,
      maxSell,
      dustSell,
      dustBuy,
      speed,
      duration,
      avgRate,
      diff
    }

  }
}
