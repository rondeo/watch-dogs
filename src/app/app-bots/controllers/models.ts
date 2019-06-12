import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {VOBalance, VOOrder} from '../../amodels/app-models';

export enum ControllerType {
  SORT,
  START_LONG,
  LONGING,
  LONG_TO_SHORT
}

export enum TaskName {
  NONE = 'NONE',
  DONE = 'DONE',
  NEED_BUY = 'NEED_BUY',
  SET_BUY_ORDER = 'SET_BUY_ORDER',
  BUY_ORDER_SET = 'BUY_ORDER_SET',
  NEED_SELL = 'NEED_SELL',
  SET_SELL_ORDER = 'SET_SELL_ORDER',
  SELL_ORDER_SET = 'SELL_ORDER_SET',
  SHORTING = 'SHORTING',
  LONGING = 'LONGING',
  NEED_CANCEL_ORDERS = 'NEED_CANCEL_ORDERS',
  CANCELING_ORDERS= 'CANCELING_ORDERS',
  BUYING = 'BUYING',
  SELLING = 'SELLING',
  TIME_TO_SELL = 'TIME_TO_SELL',
  TIME_TO_BUY = 'TIME_TO_BUY',
  LOST = 'LOST'
}

export interface Action {
  readonly type: TaskName;
  payload: any;
}

export class TaskNone implements Action{
  type = TaskName.NONE;
  payload = null;
}

export class TaskDone implements Action{
  type = TaskName.DONE;
  constructor(public payload: VOBalance) {

  }
}

export class NeedBuy implements Action {
  type = TaskName.NEED_BUY;
  constructor(public payload) {

  }
}

export class NeedSell implements Action  {
  type = TaskName.NEED_SELL;
  constructor(public payload) {

  }
}

export class SetSellOrder implements Action  {
  type = TaskName.SET_SELL_ORDER;
  constructor(public payload: {amountCoin: number, price: number}) {

  }
}

export class SellOrderSet implements Action  {
  type = TaskName.SELL_ORDER_SET;
  constructor(public payload) {
  }
}

export class SetBuyOrder implements Action  {
  type = TaskName.SET_BUY_ORDER;
  constructor(public payload: {amountCoin: number, price: number}) {

  }
}

export class BuyOrderSet implements Action  {
  type = TaskName.BUY_ORDER_SET;
  constructor(public payload: VOOrder) {
  }
}

export class NeedCancelOrders implements Action  {
  type = TaskName.NEED_SELL;
  constructor(public payload) {

  }
}

export class TimeToBuy implements Action{
  type = TaskName.TIME_TO_BUY;
  constructor(public payload ) {

  }
}

export class TimeToSell implements Action{
  type = TaskName.TIME_TO_SELL
constructor(public payload ) {

}
}

export class Shorting implements Action{
  payload = null;
  type = TaskName.SHORTING;
}

export class Longing {
  type = TaskName.LONGING
}

export class Lost implements Action {
  type = TaskName.LOST;
  payload = null;
}


export interface TaskController {
  type : ControllerType;
  status: BehaviorSubject<Action>;
  destroy(reason: string): void;
}
