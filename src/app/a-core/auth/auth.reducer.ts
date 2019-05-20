import { Action } from '@ngrx/store';
import {AuthActions, AuthActionTypes} from './auth.actions';
import {User} from '../../amodels/app-models';

export interface AuthState {
  loggedIn: boolean,
  user: User
}

export const initialAuthState: AuthState = {
  loggedIn: false,
  user: undefined
};

export function authReducer(state = initialAuthState,
                            action: AuthActions): AuthState {
  switch (action.type) {

    case AuthActionTypes.LoginAction:
      return {...state};
    case AuthActionTypes.LogoutAction:
        return {...state};

    default:
      return state;
  }
}
