/**
 * Created by Vlad on 7/3/2017.
 */
import {NgModule} from '@angular/core';
import {
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatDialogModule,
  MatGridListModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatSidenavModule,
  MatSlideToggleModule,
  MatRadioModule,
  MatToolbarModule,
  MatTabsModule,
  MatSelectModule,
  MatSnackBarModule,
  MatProgressSpinnerModule,
  MatChipsModule,
  MatSliderModule,
  MatTooltipModule, MatIconModule

} from '@angular/material';

import {DialogSimpleComponent} from './dialog-simple/dialog-simple.component';
import {LoginFormComponent} from './login-form/login-form.component';
import {LoginExchangeComponent} from './login-exchange/login-exchange.component';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { DialogInputComponent } from './dialog-input/dialog-input.component';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatGridListModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatToolbarModule,
    MatTabsModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSliderModule,
    MatTooltipModule,
    MatIconModule
  ],
  exports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatGridListModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatToolbarModule,
    MatTabsModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSliderModule,
    MatTooltipModule,
    DialogInputComponent,
    MatIconModule

  ],
  declarations: [
    DialogSimpleComponent,
    LoginFormComponent,
    LoginExchangeComponent,
    DialogInputComponent
  ],
  entryComponents: [
    DialogSimpleComponent,
    LoginFormComponent,
    LoginExchangeComponent,
    DialogInputComponent
  ]
})

export class MaterialAppModule {
}
