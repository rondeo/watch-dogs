import { Action } from '@ngrx/store';
import {User} from '../../amodels/app-models';

export enum AuthActionTypes {
  LoginAction = '[Login] Action',
  LogoutAction = '[Logout] Action',
}

export class Login implements Action {
  readonly type = AuthActionTypes.LoginAction;
  constructor(public payload: {user: User}) {

  }
}


export class LogoutAction implements Action {
  readonly type = AuthActionTypes.LogoutAction;

}


export type AuthActions = Login | LogoutAction;
