import {VOMarketCap} from './app-models';

export interface VOCoinDayValue {
  price_btc: number;
  volume: number;
  rank: number;
  price_usd?: number;
}

export interface VOCoinsDayData {
  [symbol: string]: VOCoinDayValue[];
}

export interface VOCoinWeek extends VOCoinDayValue {
  timestamp: number;
  total_supply: number;
}

export class VOMCData {
  price_btc: number
  price_usd: number;
  volume_24h: number;
  market_cap_usd: number;
  available_supply: number;
  total_supply: number;
  max_supply: number;
}

export interface MCdata {
  id: string;
  usd: number;
  btc: number;
  rank: number;
  rP: number;
  vol: number;
  vol_1h: number;
  vol_3h: number;
  vol_6h: number;
  h05: number;
  h1: number;
  t: number;
  n: string;
  data: number[];
  price_btcs: number[];
  prev?
}


/*export class VOMCAgregated extends VOMarketCap {
  symbol: string;
  id: string;
  price_btc: number;
  price_usd: number;
  tobtc_last: number;

  tobtc_change_05h: number;
  tobtc_change_1h: number;
  tobtc_change_2h: number;
  tobtc_change_3h: number;

  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;

  rankPrev: number;
  rank: number;
  timestamp: number;
  volume: number;
  vol_1h: number;
  vol_3h: number;
  vol_6h: number;
  prev: number;
  last5: number;
  last10: number
  last20: number;
  ago2h: number;
  last30: number;
  ago3h: number;
  date: string;
  total_supply?: number;
  rankChange24h?: number;
  rank24h?: number;
}*/

/*export const VOMCAGREGATED: VOMCAgregated = {
  symbol: '',
  id: '',
  name: '',
  price_btc: 0,
  price_usd: 0,
  tobtc_last: 0,

  tobtc_change_05h: 0,
  tobtc_change_1h: 0,
  tobtc_change_2h: 0,
  tobtc_change_3h: 0,

  percent_change_1h: 0,
  percent_change_24h: 0,
  percent_change_7d: 0,

  rankPrev: 0,
  rank: 0,
  timestamp: 0,
  volume: 0,
  vol_1h: 0,
  vol_3h: 0,
  vol_6h: 0,
  prev: 0,
  last5: 0,
  last10: 0,
  last20: 0,
  ago2h: 0,
  last30: 0,
  ago3h: 0,
  date: ''
}*/
/*
export interface VOMC extends VOMCAgregated {
  selected: boolean;
}*/

export class  VOMarketCapSelected extends VOMarketCap{
  selected: boolean;
}

export type VOMCObj = { [symbol: string]: VOMarketCap }

export interface VOCandle {
  from: number;
  to: number;
  Open: number;
  Close: number;
  High: number;
  Low: number;
  Trades?: number;
  Volume?: number;
}