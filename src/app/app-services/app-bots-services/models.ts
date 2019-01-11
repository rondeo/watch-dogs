export interface VOSignal {
  action: string;
  reason: string;
}

export enum BuySellState {
  NONE = 'NONE',
  BUY = 'BUY',
  SELL = 'SELL',
  BUY_NOW = 'BUY_NOW',
  SELL_NOW = 'SELL_NOW',
  SELL_ON_JUMP = 'SELL_ON_JUMP',
  CHANGE_SELL = 'CHANGE_SELL',
  CHANGE_BUY = 'CHANGE_BUY'
}
