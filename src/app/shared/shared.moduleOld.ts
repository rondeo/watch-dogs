import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogSimpleComponent } from '../material/dialog-simple/dialog-simple.component';
import {MaterialAppModule} from '../material/material-app.module';
import { SortableTableComponent } from '../ui/sortable-table/sortable-table.component';
import { CrossTableComponent } from '../ui/cross-table/cross-table.component';
import {LoginFormComponent} from '../material/login-form/login-form.component';
import {FormsModule} from '@angular/forms';

import { TradesHistoryComponent } from '../widgets/trades-history/trades-history.component';

import { LineChartComponent } from '../ui/line-chart/line-chart.component';

import {UiModule} from '../ui/ui.module';
import { LoginExchangeComponent } from '../material/login-exchange/login-exchange.component';

/*
@NgModule({
  exports:[
    SortableTableComponent,
    TradesHistoryComponent,
    LineChartComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MaterialAppModule,
    UiModule
  ],
  declarations: [
    DialogSimpleComponent,
    SortableTableComponent,
    CrossTableComponent,
    LoginFormComponent,
    TradesHistoryComponent,
    LineChartComponent,
    LoginExchangeComponent
  ],
  entryComponents: [
    DialogSimpleComponent,
    LoginFormComponent,
    LoginExchangeComponent
  ]
})*/
export class SharedModuleOld { }
