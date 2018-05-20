import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogSimpleComponent } from '../material/dialog-simple/dialog-simple.component';
import {MaterialAppModule} from '../material/material-app.module';
import { SortableTableComponent } from '../ui/sortable-table/sortable-table.component';
import { CrossTableComponent } from './cross-table/cross-table.component';
import { LogoutFormComponent } from './logout-form/logout-form.component';
import {LoginFormComponent} from './login-form/login-form.component';
import {FormsModule} from '@angular/forms';
import { MarketViewComponent } from './market-view/market-view.component';
import { TradesHistoryComponent } from './trades-history/trades-history.component';

import { LineChartComponent } from './line-chart/line-chart.component';
import {CoinDayComponent} from './coin-day/coin-day.component';
import {UiModule} from '../ui/ui.module';
import { MarketSnapshotComponent } from './market-snapshot/market-snapshot.component';


@NgModule({
  exports:[
    SortableTableComponent,
    TradesHistoryComponent,
    LineChartComponent,
    CoinDayComponent,
    MarketSnapshotComponent
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
    MarketViewComponent,
    TradesHistoryComponent,
    LineChartComponent,
    CoinDayComponent,
    MarketSnapshotComponent
  ],
  entryComponents: [DialogSimpleComponent, LoginFormComponent, LogoutFormComponent]
})
export class SharedModule { }
