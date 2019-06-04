import { Action } from '@ngrx/store';
import {AppBotsActions, AppBotsActionTypes, LoadAppBots} from '../actions/app-bots.actions';

import {VOBalance, VOOrder} from '../../amodels/app-models';
import {BotBus} from '../bot-bus';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {debounceTime, skip} from 'rxjs/operators';
import {BotBase} from '../bot-base';


export enum BotsCondition {
  NONE = 'NONE',
  READY = 'READY'
}

export interface BotsState {
  botsState: BotsCondition;
  botsData: BotBase[];
  balances: VOBalance[];
  openOrders: VOOrder[];
}

export const initialState: BotsState = {
  botsState: BotsCondition.NONE,
  botsData:[],
  balances:[],
  openOrders:[]
};

export function BotsReducer(state = initialState, action: AppBotsActions): BotsState {
  switch (action.type) {
    case AppBotsActionTypes.LoadAppBots:
      return {...state};
    case AppBotsActionTypes.AppBotsLoaded:
      return {...state, botsData:action.payload, botsState: BotsCondition.READY };
      case AppBotsActionTypes.OnServerData:
      return {...state, balances: action.payload.balances, openOrders: action.payload.openOrders };
    default:
      return state;
  }
}






