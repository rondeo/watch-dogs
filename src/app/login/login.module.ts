import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {RouterModule} from '@angular/router';
import { ConfirmComponent } from './confirm/confirm.component';
import { ConfirmResetPasswordComponent } from './confirm-reset-password/confirm-reset-password.component';
import {MaterialAppModule} from '../aui/material/material-app.module';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MaterialAppModule,
    ReactiveFormsModule,
    RouterModule
  ],
  declarations: [
    LoginComponent,
    ConfirmComponent,
    ConfirmResetPasswordComponent,

  ],
  entryComponents: []
})
export class LoginModule { }
