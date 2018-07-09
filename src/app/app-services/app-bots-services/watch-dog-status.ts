export enum WatchDogStatus {
  INITIALIZED = 'INITIALIZED',
  WAITING = 'WAITING',
  TO_SELL = 'TO_SELL',

  SELLING_IN_PROGRESS = 'SELLING_IN_PROGRESS',
  SELLING_GOT_ORDER = 'SELLING_GOT_ORDER',
  SELLING_ORDER_CLOSED = 'SELLING_ORDER_CLOSED',

  ERROR_SELLING = 'ERROR_SELLING',

  SOLD_OUT = 'SOLD_OUT',
  SOLD = 'SOLD',

  NO_BALANCE = 'NO_BALANCE',
  NO_BALANCE_BASE = 'NO_BALANCE_BASE',

  CHECKING_ORDER = 'CHECKING_ORDER'
}


export interface IWatchDog {
  id: string;
  exchange: string;
  status: WatchDogStatus;
  base: string;
  coin: string;
  balanceCoin: number;
  wdId: string;
  log: (msg: string) => void;
  warn: (msg: string, obj: any) => void;
  onError: (err:any) => void;
}