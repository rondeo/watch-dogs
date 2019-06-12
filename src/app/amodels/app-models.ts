/*
 * Created by Vlad on 7/8/2017.
 */


import {StopLossSettings} from '../app-bots/stop-loss-auto';

export interface User {
  id: string;
  email: string;
}

export interface VOBooksStats {
  exchange: string;
  coin: string;
  base: string;
  coinMC: VOMarketCap;
  baseMC: VOMarketCap;
  booksDiff: number;
  rateToBuy: number;
  rateToSell: number;
  priceToSellUS: number;
  priceToBuyUS: number;
  priceToMC: number;
  priceBaseUS: number;
}

export interface VOTrade {
  amountCoin: number;
  timestamp: number;
  rate: number;
}


export interface VOBooks {
  market: string;
  exchange: string;
  buy: VOTrade[];
  sell: VOTrade[];
}

export class VOTransaction {

  txid: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  date: string;
  incoming: boolean;
  hex?: string;
}

export enum OrderType {
  NONE = '',
  SELL = 'SELL',
  BUY = 'BUY',
  STOP_LOSS = 'STOP_LOSS'
}

export const VOORDER: VOOrder = {
  uuid: '',
  action: '',
  isOpen: false,
  base: '',
  coin: '',
  rate: 0,
  orderType: OrderType.NONE,
  market: ''
};

export interface VOOrder {
  uuid: string;
  isOpen: boolean;
  action: string;
  message?: string;
  orderType?: OrderType;
  type?: string;
  date?: string;
  timestamp?: number;
  rate?: number;
  exchange?: string;
  priceUS?: number;
  amountUS?: number;
  stopPrice?: number;
  // amountCoinUS?: number; priceUS?: number;
  amountCoin?: number;
  amountBase?: number;
  fee?: number;
  feeUS?: number;
  base?: string;
  coin?: string;
  market: string;
  local?: string;
  minutes?: string;
  lastStatus?: string;
}

export interface VOOrderExt extends VOOrder {
  overlap: number;
  orders: number;
}

export interface ConfigAPI {
  isMarketComplex: boolean;
  webMarket: string;
  apiMarkets: string;
  apiMarket: string;
  apiOrderBook: string;
  apiTradeHistory: string;
  uid: string;
  name: string;
  enabled: boolean;


  apiVolume24h?: string;
  apiCurrencies?: string;

}

export class VOTransfer {
  uuid: string;
  action: string;
  market: string;
  base: string;
  amountBase: number;
  coin: string;
  amountCoin: number;
  amountBaseUS: number;
  amountCoinUS: number;
  rate: number;
  priceBaseUS: number;
  priceCoinUS: number;
  fee: number;
  feeUS: number;
  timestamp: number;
  valid: boolean;
  isComplete: boolean;
  isActive: boolean;
}


export interface VOSearch {
  exchange: string;
  symbol?: string;
  pair?: string;
}


export class VOCurrency {

}

/*export interface VOMarketData{
  pair:string;
  TimeStamp:string;
  Last:number;
  Bid:number;
  Ask:number;

  high: number;
  low:number;
  Volume:number
  OpenBuyOrders:number;
  OpenSellOrders:number;
}*/

export interface VOLoginResult {
  message: string;
  success: any;
  error: any;
  result: any;
}

/*

export interface IVOMarket {

  base: string;
  coin: string;
  id: string;
  exchange: string;
  Volume: number;
  Last: number;
  high: number;
  low: number;
  Ask: number;
  Bid: number;
  BaseVolume: number;
  disabled:boolean;
  PrevDay: number;

  mcCoin?: VOMarketCap;
  baseMC?: VOMarketCap;
  stats?:IOrdersStats;
}
*/


export class VOMarket {
  pair?: string;
  exchange?: string;
  base: string;
  coin: string;
  id: string;


  priceBaseUS?: number;
  rate?: number;
  rateToBuy?: number;
  rateToSell?: number;

  Last: number;
  dLast?: string;
  usLast?: number;

  Bid: number;
  dBid?: string;
  usBid?: string;

  Ask: number;
  dAsk?: string;
  usAsk?: string;

  // marketCap?:VOMarketCap;
  high: number;
  dHigh?: string;

  usHigh?: number;
  low: number;
  dLow?: string;
  usLow?: number;
  // Volume?: number;
  // dVolume?: string;
  usVolume?: string;


  BaseVolume: number;
  dBaseVolume?: string;
  TimeStamp?: string;

  OpenBuyOrders?: number;
  OpenSellOrders?: number;
  PrevDay?: number;
  dPrevDay?: string;
  usPrevDay?: string;
  change?: number;
  usMC?: number;
  toMC?: number;
  Created?: string;
  DisplayMarketName?: string;
  disabled?: any;
  coinId?: string;
  coinRank?: number;
  mcDiff?: string;
  selected?: boolean;

  mcCoin?: VOMarketCap;

  percent_change_1h?: number;
  percent_change_24h?: number;
  percent_change_7d?: number;


}

/*
export interface VOMarketHistory {
  Id: number
  TimeStamp: string;
  Quantity: number;
  Price: number;
  Total: number;
  FillType: string;
  OrderType: string;//": "SELL"
}
*/


export class VOMarketCap {
  id: string;
  name: string;
  symbol: string;

  rank: number;
  price_usd: number;
  price_btc: number;

  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;

  volume_24h: number;

  // tobtc_change_1h?: number;
  // tobtc_change_24h?: number;
  // tobtc_change_7d?: number;

  // btcUS?: number;

  market_cap_usd?: number;
  available_supply?: number;
  total_supply?: number;
  max_supply?: number;

  last_updated?: number;
  selected?: boolean;
  r6?: number;
  r24?: number;

  constructor(obj?: any) {
    if (obj) for (let str in obj) this[str] = obj[str];
  }
}

export class VOMarketCapExt extends VOMarketCap {
  btc_change_1h: string;
  btc_change_30h: string;
  btc_change_10d: string;
}

export class VOMCDisplay extends VOMarketCap {
  rankD: number;
  price_btcD: number;
  news1: number;
  news2: number;
  news3: number;
}

export class VONews {
  author: string;
  title: string;
  text: string;
  url: string;
}

/*
export interface VOMarketB {
  pair: string;
  coinToBuy: string;
  MarketName: string;
  high: number;
  dHigh?: string;
  usHigh?: string;
  low: number;
  dLow?: string;
  usLow?: string;
  Volume: number;
  dVolume?: string;
  usVolume?: string;
  Last: number;
  dLast?: string;
  usLast?: string;
  BaseVolume: number;
  dBaseVolume: string;
  TimeStamp: string;
  Bid: number;
  dBid?: string;
  usBid?: string;
  Ask: number;
  dAsk?: string;
  usAsk?: string;
  OpenBuyOrders: number;
  OpenSellOrders: number;
  PrevDay: number;
  dPrevDay?: string;
  usPrevDay?: string;
  usMC: string;
  Created: string
  DisplayMarketName: string
}
*/

/*export interface VOCoin {
  name: string;
  symbol: string;
  rank?: number;
  price_usd?: number;
  percent_change_1h?: number;
  percent_change_24h?: number;
  percent_change_7d?: number;
  market_cap_usd?: number;
  market?: VOMarketCap;

}*/

/*
export interface VOExchange {
  id: number;
  pair: string;
  last: number;
  low: number;
  high: number;
  percentChange: number;
  baseVolume: number;
  quoteVolume: number;
  isFrozen: boolean;
  high24hr: number;
  low24hr: number;
  highestBid?: number;
  lowestAsk?: number
  usd: number;
  usd_mcap?: string;
  usd_last?: string;
  //display_last?:string
  //price_usd_low?:number;
  //display_low?:string
  //price_usd_high?:number;
  //display_high?:string

  low24?: string;
  high24?: string;
  delta?: string;
  prevDay?: number;
  delta24: string;
  is_last_up?: boolean;
  mid24?: number;
}
*/

/*

export interface CoinConfig {
  symbol: string;
  network: any;
  isActive: string;
  icon: string;
  contractAddress: string;
  generator: string;
  displayName: string;
  mainNet: any;
  parent: string;
  urlBalance: string;
  urlSendTransaction: string;
  urlNonce: string;
  shapeshift: any;
  transactionType: string;
}
*/


export class UTXO {
  address: string;
  balance: number;
  vouts: number;
  txid: string;
}

export interface UserProfile {
  ver: number;
  timestamp: number;
  date: string;
  filename: string;
  // coins: CoinConfig[]
}

/*

export class CoinsAvailable {
  coins: CoinConfig[]
  tokens: CoinConfig[]
}
*/


export interface VOOrderBook {
  Quantity: number;
  dQuantity: string;
  Rate: number;
  Price: string;
}

/*
export interface VOOpenOrder {
  Uuid: string;
  OrderUuid: string;
  Exchange: string;
  OrderType: string;
  Quantity: number;
  QuantityRemaining: number;
  Limit: number;
  CommissionPaid: number;
  Price: number;
  PricePerUnit: string;
  Opened: string;
  Closed: string
  CancelInitiated: boolean;
  ImmediateOrCancel: boolean;
  IsConditional: boolean;
  Condition: string;
  ConditionTarget: string;
}*/

export class VOBalance {
  symbol: string;
  exchange: string;
  available: number;
  pending: number;
  balance?: number;
  balanceUS?: number;
  address?: string;
  index?: number;
  priceUS?: number;
  percent_change_1h?: number;
  percent_change_24h?: number;
  percent_change_7d?: number;
  id?: string;
  change?: number;

  constructor(obj?: VOBalance) {
    if (obj) for (let str in obj) this[str] = obj[str];
  }
}

/*

export class Analitycs {

  price_usd_history: number[];
  price_btc_history: number[];
  price_usd_historyDisplay: string;

}
*/

/*
export class WalletModel {
  // config:CoinConfig;
  id: string;
  selected: boolean;
  network: any;
  displayName: string;
  hdindex: number;
  market: VOMarketCap;
  analitics: Analitycs;
  privateKey: string;
  balance: string;
  balanceDisplay: number;
  usd: string;
  price_usd: number;


  label: string;
  symbol: string;
  address: string;
  sort: number;
  createdAt: string;
  updatedAt: string;

}
*/

export enum WDType {
  OFF = 'OFF',
  SHORT = 'SHORT',
  LONG = 'LONG',
  LONGING = 'LONGING',
  LOST = 'LOST',
  BUYING = 'BUYING',
  OUT = 'OUT',
  LONG_SL = 'LONG_SL'
}

export class VOWatchdog {
  id: string;
  potSize: number;
  exchange: string;
  market: string;
  wdType?: WDType;
  pots?: number;
  entryPrice?: number;
  liquidPrice?: number;
  stopLoss?: StopLossSettings;
  results?: string[] = [];
  sellScripts?: string[] = [];
  buyScripts?: string[] = [];
  orderID?: string;

  constructor(obj: any) {
    if (obj) for (let str in obj) this[str] = obj[str];
    this.id = this.exchange + '-' + this.market;
    //  if(obj.orderType)this.orderType = obj.orderType
  }
}

export const VOWATCHDOG = new VOWatchdog({});


/*

export class MarketOrderModel {
  uid: string;
  coinId: string;
  dogName: string;
  isActive: string;
  marketCap: VOMarketCap;

  description?: string;
  scriptText?: string;
  scriptIcon?: string;
  statusIcon?: string;

  /!* time?:string;
   price_usd_history?:{time:string, value:number}[];
   savedValues?:any;
   scriptText?:string;
   watchwers?:any;
   market?:VOMarketCap;
   prevMarket?:VOMarketCap;
   marketHistory?:VOMarketCap[];
   percent_change_1h?:number;
   percent_change_24h?:number;
   percent_change_7d?:number;
   price_usd?: number;
   rank?: number;*!/
}

*/

export interface VOResult {
  success: string;
  error: string;
  message: string;
}

export enum VOAlert {
  UP = 'UP',
  DOWN = 'DOWN',
  DROPPING = 'DROPPING',
  JAMPING = 'JUMPING',
  WATERFALL = 'WATERFALL',
  FOUNTAIN = 'FOUNTAIN'
}
