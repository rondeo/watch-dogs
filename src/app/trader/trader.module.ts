import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule, Routes} from '@angular/router';
import {MaterialAppModule} from '../material/material-app.module';
import {TraderOutletComponent} from './trader-outlet/trader-outlet.component';

import {SoketConnectorService} from '../sockets/soket-connector.service';
import {TraderSocketComponent} from './trader-socket/trader-socket.component';
import {ApisModule} from '../apis/apis.module';

import {AnalyzeCoinComponent} from './analyze-coin/analyze-coin.component';
import {UiModule} from '../ui/ui.module';
import {WidgetsModule} from '../widgets/widgets.module';
import {CommonMarketsComponent} from './common-markets/common-markets.component';
import {LiveTraderComponent} from './live-trader/live-trader.component';
import {DirectivesModule} from '../directives/directives.module';
import {PipesModule} from '../pipes/pipes.module';
import { ScanMarketsComponent } from './scan-markets/scan-markets.component';
import { MarketDetailsComponent } from './market-details/market-details.component';
import { NotesHistoryComponent } from './notes-history/notes-history.component';
import { OrderReportsComponent } from './order-reports/order-reports.component';
import { FollowMarketComponent } from './follow-market/follow-market.component';
import {TestModule} from '../test/test.module';

const routes: Routes = [
  {
    path: 'trader', component: TraderOutletComponent,
    children: [
      {path: '', redirectTo: 'market/USDT_BTC', pathMatch: 'full'},
      {path: 'live-trader/:exchange/:market', component: LiveTraderComponent},
      {path: 'analyze-coin/:coin', component: AnalyzeCoinComponent},
      {path: 'analyze-coin/:coin/:exchange', component: AnalyzeCoinComponent},
      {path: 'common-markets', component: CommonMarketsComponent},
      {path: 'scan-markets', component: ScanMarketsComponent},
      {path: 'order-reports', component: OrderReportsComponent},
      {path: 'follow-market', component: FollowMarketComponent},
      {path: 'follow-market/:market', component: FollowMarketComponent}
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
