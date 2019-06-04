import {Action} from '@ngrx/store';
import {VOBalance, VOOrder} from '../../amodels/app-models';

export enum AppBotsActionTypes {
  NONE = '[AppBots] NONE',
  LoadAppBots = '[AppBots] Load AppBots',
  AppBotsLoaded = '[AppBots] AppBotsLoaded',
  DownloadBalances = '[AppBots] DownloadBalances',
  OnBalances = '[AppBots] OnBalances',
  OnOpenOrders = '[AppBots] OnOpenOrders',
  OnServerData = '[AppBots] OnServerData',
  BuyCoinInstant = '[AppBots] BuyCoinInstant',
  BalanceInit = '[AppBots] BalanceInit',
  BalanceChange = '[AppBots] BalanceChange'
}

export class LoadAppBots implements Action {
  readonly type = AppBotsActionTypes.LoadAppBots;
}

export class AppBotsLoaded implements Action {
  readonly type = AppBotsActionTypes.AppBotsLoaded;

  constructor(public payload:any[]) {
  }
}

export class AppBotsDownloadBalances implements Action {
  readonly type = AppBotsActionTypes.DownloadBalances;

  constructor() {
  }
}

export class AppBotsOnBalances implements Action {
  readonly type = AppBotsActionTypes.OnBalances;
  constructor(public payload: VOBalance[]) {
  }
}

export class AppBotsOnOpenOrders implements Action {
  readonly type = AppBotsActionTypes.OnOpenOrders;

  constructor(public payload: VOOrder[]) {
  }
}

export class AppBotsOnServerData implements Action {
  readonly type = AppBotsActionTypes.OnServerData;

  constructor(public payload: { balances: VOBalance[], openOrders: VOOrder[] }) {
  }
}

export class BuyCoinInstant implements Action {
  readonly type = AppBotsActionTypes.BuyCoinInstant;

  constructor(public paylod: { market: string, coin: string, amount: number }) {
  }
}

export class BalanceInit implements Action {
  readonly type = AppBotsActionTypes.BalanceInit;
  constructor(public paylod: { exchange: string, market: string, balance: VOBalance }) {
  }
}

export class BalanceChange implements Action {
  readonly type = AppBotsActionTypes.BalanceChange;
  constructor(public paylod: { exchange: string, market: string, balance: VOBalance }) {
  }
}


export type AppBotsActions =
  LoadAppBots
  | AppBotsLoaded
  | AppBotsDownloadBalances
  | AppBotsOnBalances
  | AppBotsOnOpenOrders
  | AppBotsOnServerData



