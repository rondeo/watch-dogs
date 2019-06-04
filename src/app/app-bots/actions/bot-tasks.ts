import {BotBase} from '../bot-base';
import {VOBalance, VOOrder, WDType} from '../../amodels/app-models';
import {debounceTime, filter, map, switchMap, take} from 'rxjs/operators';
import {Subscription} from 'rxjs/internal/Subscription';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {Observable} from 'rxjs/internal/Observable';
import {Subject} from 'rxjs/internal/Subject';
import {pipe} from 'rxjs/internal-compatibility';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

export enum TaskName {
  NONE = 'NONE',
  OFF = 'BOT_STATE_OFF',
  CANCELING_ORDERS = 'CANCELING_ORDERS',
  SELLING_COIN = 'SELLING_COIN',
  BUYING_COIN = 'BUYING_COIN',
  CANCEL_ALL_ORDERS = 'CANCEL_ALL_ORDERS',
  TURN_OFF = 'TURN_OFF',
  BUY_MORE_POTS = ' BUY_MORE_POTS',
  FROM_SHORT_TO_LONG = 'FROM_SHORT_TO_LONG',
  FROM_LONG_TO_SHORT = 'FROM_LONG_TO_SHORT',
  ADJUST_POTS_LONG = 'ADJUST_POTS_LONG',
  START_LONG = 'START_LONG'
}


export interface BTask {
  readonly name: TaskName;
  active: boolean;
  payload: any;

  start(bot: BotBase): Observable<string>;

  cancel()
  destroy(): void;
}



