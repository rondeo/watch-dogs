

export interface SOCurrencyCoinexchange {
  Active: boolean;
  BaseCurrency: string;
  BaseCurrencyCode: string;
  BaseCurrencyID: number;
  MarketAssetCode: string;
  MarketAssetID: number;
  MarketAssetName: string;
  MarketAssetType: string;
  MarketID: number;
}



export interface SOMarketCoinExchange {
  AskPrice: number;
  BTCVolume: number;
  BidPrice: number;
  BuyOrderCount: number;
  Change: number;
  HighPrice: number;
  LastPrice: number;
  LowPrice: number;
  MarketID: number;
  SellOrderCount: number;
  TradeCount: number;
}

export interface SOMarketYobit {
  avg: number;
  buy: number;
  high: number;
  last: number;
  low: number;
  sell: number;
  updated: number;
  vol: number;
  vol_cur: number;

}


export interface SOMarketLiveCoin {
  best_ask: number;
  best_bid: number;
  cur: string; // "USD"
  high: number;
  last: number;
  low: number;
  max_bid: number;
  min_ask: number;
  symbol: string; // "USD/RUR"
  volume: number;
  vwap: number;
}



export interface SOMarketPoloniex {
  baseVolume: number;
  high24hr: number;
  highestBid: number;
  id: number;
  isFrozen: string;
  last: number;
  low24hr: number;
  lowestAsk: number;
  percentChange: number;
  quoteVolume: number;
}


export interface SOMarketBittrex {
  MarketName: string;
  High: number;
  Low: number;
  Volume: number;
  Last: number;
  BaseVolume: number;
  TimeStamp: string;
  Bid: number;
  Ask: number;
  OpenBuyOrders: number;
  OpenSellOrders: number;
  PrevDay: number;
  Created: string;
  DisplayMarketName: string;
}



export interface SOMarketHitbtc {
  ask: string;
  bid: string;
  last: string;
  low: string;
  high: string;
  open: string;
  volume: string;
  volume_quote: string;
  timestamp: number;
}


export interface SOMarketCryptopia {
  AskPrice: number;
  BaseVolume: number;
  BidPrice: number;
  BuyBaseVolume: number;
  BuyVolume: number;
  Change: number;
  Close: number;
  High: number;
  Label: string;
  LastPrice: number;
  Low: number;
  Open: number;
  SellBaseVolume: number;
  SellVolume: number;
  TradePairId: number;
  Volume: number;

}



export interface SOMarketNovaExchange {
  ask: string;
  basecurrency: string;
  bid: string;
  change24h: string;
  currency: string;
  disabled: number;
  high24h: string;
  last_price: string;
  low24h: string;
  marketId: number;
  marketname: string;
  volume24h: string;
}


export interface SOMarketExmo {
  avg: number;
  buy_price: number;
  high: number;
  last_trade: number;
  low: number;
  sell_price: number;
  updated: number;
  vol: number;
  vol_curr: number;
}


export interface SOMarketBitz {
  buy: number;
  date: number;
  high: number;
  last: number;
  low: number;
  sell: number;
  vol: number;
}

export interface SOMarketBithumb {
  average_price: number;
  buy_price: number;
  closing_price: number;
  max_price: number;
  min_price: number;
  opening_price: number;
  sell_price: number;
  units_traded: number;
  volume_1day: number;
  volume_7day: number;
}

export interface SOMarketBitsane {
  baseVolume: number;
  bitcoinEquivalent: number;
  euroEquivalent: number;
  high24hr: number;
  highestBid: number;
  last: number;
  low24hr: number;
  lowestAsk: number;
  percentChange: number;
  quoteVolume: number;
}

export interface SOMarketEtherdelta {
  ask: number;
  baseVolume: number;
  bid: number;
  last: number;
  percentChange: number;
  quoteVolume: number;
  tokenAddr: string;
}


export interface SOMarketCoinnone {
  currency: string;
  first: number;
  high: number;
  last: number;
  low: number;
  volume: number;
  yesterday_first: number;
  yesterday_high: number;
  yesterday_last: number;
  yesterday_low: number;
  yesterday_volume: number;
}
