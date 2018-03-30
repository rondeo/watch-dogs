import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogSimpleComponent } from './dialog-simple/dialog-simple.component';
import {MaterialAppModule} from '../material/material-app.module';
import { SortableTableComponent } from './sortable-table/sortable-table.component';
import { CrossTableComponent } from './cross-table/cross-table.component';
import { LogoutFormComponent } from './logout-form/logout-form.component';
import {LoginFormComponent} from './login-form/login-form.component';
import {FormsModule} from '@angular/forms';
import { MarketViewComponent } from './market-view/market-view.component';
import { TradesHistoryComponent } from './trades-history/trades-history.component';
import { BubbleChartComponent } from './bubble-chart/bubble-chart.component';
import { LineChartComponent } from './line-chart/line-chart.component';


@NgModule({
  exports:[
    SortableTableComponent,
    TradesHistoryComponent,
    BubbleChartComponent,
    LineChartComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MaterialAppModule
  ],
  declarations: [
    DialogSimpleComponent,
    SortableTableComponent,
    CrossTableComponent,
    LogoutFormComponent,
    LoginFormComponent,
    MarketViewComponent,
    TradesHistoryComponent,
    BubbleChartComponent,
    LineChartComponent
  ],
  entryComponents: [DialogSimpleComponent, LoginFormComponent, LogoutFormComponent]
})
export class SharedModule { }
