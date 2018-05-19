import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MaterialAppModule} from '../material/material-app.module';
import {RouterModule} from '@angular/router';
import { ConfirmComponent } from './confirm/confirm.component';
import { ConfirmResetPasswordComponent } from './confirm-reset-password/confirm-reset-password.component';



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
