/**
 * Created by Vlad on 4/3/2017.
 */
import { Routes } from '@angular/router';


import {ExchangeSsComponent} from './exchange-ss/exchange-ss.component';


import {LoginComponent} from './login/login/login.component';
import {ConfirmComponent} from './login/confirm/confirm.component';

import {SSCoinsAvailableComponent} from './shape-shift/ss-coins-available/ss-coins-available.component';

import {ConfirmResetPasswordComponent} from './login/confirm-reset-password/confirm-reset-password.component';

import {CoinsExchangesComponent} from './market-cap/coins-exchanges/coins-exchanges.component';


export const rootRouterConfig: Routes = [

  { path: '', redirectTo: 'market-cap/all-coins', pathMatch: 'full' },
  { path: 'exchange-ss', component:ExchangeSsComponent },
  { path: 'coins-exchanges/:list', component: CoinsExchangesComponent},

  { path: 'shape-shift-market-cap', component: SSCoinsAvailableComponent},

  { path: 'login/:topic', component: LoginComponent },
  { path: 'login-confirm/:session', component:ConfirmComponent },
  { path: 'confirm-reset-password/:session', component:ConfirmResetPasswordComponent }


];