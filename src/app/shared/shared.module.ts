import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogSimpleComponent } from '../material/dialog-simple/dialog-simple.component';
import {MaterialAppModule} from '../material/material-app.module';
import { SortableTableComponent } from '../ui/sortable-table/sortable-table.component';
import { CrossTableComponent } from './cross-table/cross-table.component';
import { LogoutFormComponent } from './logout-form/logout-form.component';
import {LoginFormComponent} from './login-form/login-form.component';
import {FormsModule} from '@angular/forms';

import { TradesHistoryComponent } from './trades-history/trades-history.component';

import { LineChartComponent } from './line-chart/line-chart.component';

import {UiModule} from '../ui/ui.module';


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
    LogoutFormComponent,
    LoginFormComponent,
    TradesHistoryComponent,
    LineChartComponent
  ],
  entryComponents: [DialogSimpleComponent, LoginFormComponent, LogoutFormComponent]
})
export class SharedModule { }
