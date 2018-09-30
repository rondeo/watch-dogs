/*
 * Created by Vlad on 7/8/2017.
 */


import {Observable} from 'rxjs/Observable';
import {WatchDogStatus} from '../app-services/app-bots-services/watch-dog-status';



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
  hex?: string
}


/*
export class ConfigApp {
  exchangesPublic: ConfigAPI[] = [
    {
      uid: 'poloniex',
      name: 'Poloniex',
      isMarketComplex: false,
      enabled: true,
      apiCurrencies: '/api/poloniex/currencies',
      apiMarkets: '/api/poloniex/markets-summary',
      apiMarket: '',
      apiOrderBook: '/api/poloniex/orderBook/{{pair}}/{{depth}}',
      webMarket: 'https://poloniex.com/exchange#{{base}}_{{coin}}',
      apiVolume24h: '',
      apiTradeHistory: ''
    },
    {
      uid: 'bittrex',
      name: 'Bittrex',
      enabled: true,
      isMarketComplex: false,
      apiMarket: '',
      apiMarkets: '/api/bittrex/markets-summary',
      apiOrderBook: '/api/bittrex/getorderbook/{{pair}}/{{depth}}',
      apiTradeHistory: '',
      webMarket: 'https://bittrex.com/Market/Index?MarketName={{base}}-{{coin}}'
    },
    {
      uid: 'cryptopia',
      name: 'Cryptopia',
      isMarketComplex: false,
      enabled: true,
      apiMarkets: '/api/cryptopia/markets-summary',
      apiMarket: '',
      apiOrderBook: '/api/cryptopia/getorderbook/{{pair}}/{{depth}}',
      apiTradeHistory: '',
      webMarket: 'https://www.cryptopia.co.nz/Exchange?market={{coin}}_{{base}}'
    },
    {
      uid: 'hitbtc',
      name: 'HitBTC',
      enabled: true,
      isMarketComplex: false,
      apiCurrencies: '/api/y/hitbtcrencies',
      apiMarkets: '/api/hitbtc/markets-summary',
      apiMarket: '',
      apiOrderBook: '/api/hitbtc/getorderbook/{{pair}}/{{depth}}',
      apiTradeHistory: '',
      webMarket: 'https://hitbtc.com/exchange/{{base}}-to-{{coin}}'
    },
    {
      uid: 'livecoin',
      name: 'Livecoin',
      enabled: true,
      isMarketComplex: false,
      apiCurrencies: '',
      apiMarkets: '/api/livecoin/markets',
      apiMarket: '',
      apiOrderBook: '',
      apiTradeHistory: '',
      webMarket: 'https://www.livecoin.net/en/trade/orderbook/{{coin}}{{base}}'
    },
    {
      uid: 'bitfinex',
      name: 'Bitfinex',
      enabled: true,
      isMarketComplex: true,
      apiCurrencies: '/api/bitfinex/currencies',
      apiMarkets: '',
      apiMarket: '/api/bitfinex/market/{{id}}',
      apiOrderBook: '',
      apiTradeHistory: '',
      webMarket: 'https://www.bfxdata.com/orderbooks/{{coin}}{{base}}'
    },
    {
      uid: 'yobit',
      name: 'YObit',
      enabled: true,
      isMarketComplex: true,
      apiCurrencies: '/api/yobit/currencies',
      apiMarkets: '',
      apiMarket: '/api/yobit/market/{{id}}',
      apiOrderBook: '/api/yobit/orderbook/{{coin}}_{{base}}',
      apiTradeHistory: '',
      webMarket: 'https://www.yobit.net/en/trade/{{coin}}/{{base}}'
    }
  ]
}
*/

export const VOORDER: VOOrder = {
  uuid: '',
  isOpen: false,
  base: '',
  coin: '',
  rate: 0,
  action: ''

}

export interface VOOrder {
  uuid: string;
  isOpen: boolean;
  message?: string;
  action?: string;
  date?: string;
  timestamp?: number;
  rate?: number;
  exchange?: string;
  priceUS?: number;
  amountUS?: number;
  // amountCoinUS?: number; priceUS?: number;
  amountCoin?: number;
  amountBase?: number;
  fee?: number;
  feeUS?: number;
  base?: string;
  coin?: string;
  local?: string;
  minutes?: string;
}

export interface VOOrderExt extends VOOrder{
  overlap: number
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

export interface IExchangePublic {
  getCurrencies(): Observable<any>
}


export class VOTransfer {
  uuid: string;
  action: string;
  market: string;
  base: string;
  amountBase: number;
  coin: string
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
  pair?: string
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

  coinMC?: VOMarketCap;
  baseMC?: VOMarketCap;
  stats?:IOrdersStats;
}
*/

export interface IVOMarketExt {

}


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
  Created?: string
  DisplayMarketName?: string
  disabled?: any;
  coinId?: string;
  coinRank?: number;
  mcDiff?: string;
  selected?: boolean;

  mcCoin?: VOMarketCap

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

export class VONews{
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
  //coins: CoinConfig[]
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
  balance: number;

  balanceUS?: number;
  address?: string;
  index?: number;
  available?: number;
  pending?: number;
  priceUS?: number;
  percent_change_1h?: number;
  percent_change_24h?: number;
  percent_change_7d?: number;
  id?: string;
  isDetails?: boolean;
  constructor(obj?: VOBalance){
    if(obj)Object.assign(this,obj);
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
export enum OrderType{
  SELL='SELL',
  BUY='BUY'
}

export class VOWatchdog {
  id: string;
  exchange: string;
  base: string;
  coin: string;
  orderType: OrderType;
  name: string;
  isActive: boolean;
  // isEmail: boolean;
  results: string[] =[];
  sellScripts: string[] = [];
  buyScripts: string[] = [];
  amount: number;
  orderID: string;
  _status: WatchDogStatus;
  constructor(obj: any) {
    Object.assign(this, obj);
  //  if(obj.action)this.orderType = obj.action
  }
}

export const VOWATCHDOG = new VOWatchdog({

})


/*

export class WatchDog {
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