
export interface VOOrder{
  uuid:string;
  isOpen:boolean;
  message?:string;
  action?:string;
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
}

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
}