import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule, Routes} from '@angular/router';
import {TraderOutletComponent} from './trader-outlet/trader-outlet.component';
import {SoketConnectorService} from '../a-core/sockets/soket-connector.service';
import {TraderSocketComponent} from './trader-socket/trader-socket.component';
import {ApisModule} from '../a-core/apis/apis.module';
import {AnalyzeCoinComponent} from './analyze-coin/analyze-coin.component';
import {UiModule} from '../aui/comps/ui.module';
import {CommonMarketsComponent} from './common-markets/common-markets.component';
import {LiveTraderComponent} from './live-trader/live-trader.component';
import { ScanMarketsComponent } from './scan-markets/scan-markets.component';
import { MarketDetailsComponent } from './market-details/market-details.component';
import { NotesHistoryComponent } from './notes-history/notes-history.component';
import { OrderReportsComponent } from './order-reports/order-reports.component';
import { FollowMarketComponent } from './follow-market/follow-market.component';
import {TestModule} from '../test/test.module';
import {WidgetsModule} from '../aui/widgets/widgets.module';
import {DirectivesModule} from '../aui/directives/directives.module';
import {PipesModule} from '../aui/pipes/pipes.module';
import {MaterialAppModule} from '../aui/material/material-app.module';

const routes: Routes = [
  {
    path: 'trader', component: TraderOutletComponent,
    children: [
      {path: '', redirectTo: 'market/USDT_BTC', pathMatch: 'full'},
      {path: 'live-trader/:exchange/:market', component: LiveTraderComponent},
      {path: 'live-trader', component: LiveTraderComponent},
      {path: 'common-markets', component: CommonMarketsComponent},
      {path: 'scan-markets', component: ScanMarketsComponent},
      {path: 'order-reports', component: OrderReportsComponent},
      {path: 'follow-market', component: FollowMarketComponent}
    ]
  }
];


@NgModule({

  exports: [TraderSocketComponent],
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    MaterialAppModule,
    ApisModule,
    UiModule,
    WidgetsModule,
    DirectivesModule,
    PipesModule,
    RouterModule.forChild(routes),
    TestModule
  ],
  declarations: [
    TraderOutletComponent,
    TraderSocketComponent,
    AnalyzeCoinComponent,
    CommonMarketsComponent,
    LiveTraderComponent,
    ScanMarketsComponent,
    MarketDetailsComponent,
    NotesHistoryComponent,
    OrderReportsComponent,
    FollowMarketComponent
  ],
  providers: [SoketConnectorService],
  entryComponents:[
    MarketDetailsComponent,
    NotesHistoryComponent
  ]
})
export class TraderModule {
}
