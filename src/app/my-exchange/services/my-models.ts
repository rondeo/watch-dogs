import {VOBubble} from "../../services/utils-order";
import {VOMarketCap, VOOrder} from "../../models/app-models";

/*
export interface IBooksStats{
  base: string;
  coin: string;
  exchange:string;
  coinMC:VOMarketCap;
  baseMC:VOMarketCap;
  booksDiff: number;
  rateToBuy: number;
  rateToSell: number;
  priceToSellUS:number;
  priceToBuyUS: number;
  priceToMC: number;
  priceBaseUS: number;

}*/

/*export interface IOrdersStats{
  base: string;
  coin: string;
  exchange:string;
  timestamp:number;
  date:string;
  coinMC:VOMarketCap;
  baseMC:VOMarketCap;
  duratinMin:number;
  speedPerMin:number;
  perHourBuy:number;
  perHourSell:number;
  sumBuyUS:number;
  sumSellUS:number;
  totalUS:number;
  rateLast:number;
  priceLastUS:number;
  priceBaseUS:number;
  priceToMC:number;
}*/

/*
export interface IMarketSummary {
  base: string;
  coin: string;
  exchange:string;

  MC:VOMarketCap;

  duratinMin:number;
  speedPerMin:number;
  perHourBuy:number;
  perHourSell:number;
  sumBuyUS:number;
  sumSellUS:number;
  totalUS:number;

  booksDiff:number;
  priceToBuyUS:number;
  priceToSellUS:number;
  rateToBuy:number;
  rateToSell:number;

  priceToMC:number;
  priceBaseUS:number;
  bubbles:VOBubble[]

}*/
/*

export interface VOOrder{
  uuid:string;
  isOpen:boolean;
  message?:string;
  status?:string;
  act?:string
  date?:string;
  timestamp?:number;
  rate:number;
  exchange?:string;
  priceBaseUS?:number;
  amountBaseUS?:number;
  amountCoinUS?:number;
  priceUS?:number;
  amountCoin:number;
  amountBase?:number;
  fee?:number;
  feeUS?:number;
  base?:string;
  coin?:string;
  local?:string;
  minutes?:string;
  marketStats?:IOrdersStats
}
*/

/*
export class VOBalance{
  address?:string;
  symbol:string;
  balance:number;
  index?:number;
  available?:number;
  pending?:number;
  balanceUS?:number;
  priceUS?:number;
  percent_change_1h?:number;
  percent_change_24h?:number;
  percent_change_7d?:number;
  id?:string;
}

export interface VOBooks{
  market:string;
  exchange:string;
  buy:VOOrder[];
  sell:VOOrder[];
}

export function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      if (name !== 'constructor') {
        derivedCtor.prototype[name] = baseCtor.prototype[name];
      }
    });
  });
}*/
