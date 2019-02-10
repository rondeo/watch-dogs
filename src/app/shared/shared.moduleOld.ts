import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogSimpleComponent } from '../com/material/dialog-simple/dialog-simple.component';
import {MaterialAppModule} from '../com/material/material-app.module';
import { SortableTableComponent } from '../com/ui/sortable-table/sortable-table.component';
import { CrossTableComponent } from '../com/ui/cross-table/cross-table.component';
import {LoginFormComponent} from '../com/material/login-form/login-form.component';
import {FormsModule} from '@angular/forms';

import { TradesHistoryComponent } from '../com/widgets/trades-history/trades-history.component';

import { LineChartComponent } from '../com/ui/line-chart/line-chart.component';

import {UiModule} from '../com/ui/ui.module';
import { LoginExchangeComponent } from '../com/material/login-exchange/login-exchange.component';

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
