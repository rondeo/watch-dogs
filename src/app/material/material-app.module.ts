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
  MatTooltipModule

} from '@angular/material';
import {SortableTableComponent} from '../ui/sortable-table/sortable-table.component';
import {DialogSimpleComponent} from './dialog-simple/dialog-simple.component';
import {LoginFormComponent} from './login-form/login-form.component';
import {LoginExchangeComponent} from './login-exchange/login-exchange.component';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';



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
    MatTooltipModule


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
    MatTooltipModule

  ],
  declarations: [
    DialogSimpleComponent,
    LoginFormComponent,
    LoginExchangeComponent
  ],
  entryComponents: [
    DialogSimpleComponent,
    LoginFormComponent,
    LoginExchangeComponent
  ]
})

export class MaterialAppModule {
}
