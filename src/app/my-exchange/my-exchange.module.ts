import {Component, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';

import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {MaterialAppModule} from "../material/material-app.module";
import {RouterModule, Routes} from "@angular/router";
import { MyMarketsComponent } from './my-markets/my-markets.component';
import {ConnectorApiService} from "../../../archive/services/connector-api.service";

import { MyBuySellComponent } from './my-buy-sell/my-buy-sell.component';


import {TradingHistoryComponent} from "./trading-history/trading-history.component";
import { MyOrdersHistoryComponent } from './my-orders-history/my-orders-history.component';
import { AllMainCoinsComponent } from './all-main-coins/all-main-coins.component';
import {UiModule} from '../ui/ui.module';
import {MyExchangeService} from '../../../archive/services/my-exchange.service';
import { BuySellCoinComponent } from './buy-sell-coin/buy-sell-coin.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {MyExchangeBalncesComponent} from './my-balnce/my-exchange-balnces.component';
import {PipesModule} from '../pipes/pipes.module';
import {DirectivesModule} from '../directives/directives.module';
import {BuySellPanelComponent} from './buy-sell-panel/buy-sell-panel.component';
import { ConfirmStopLossComponent } from './confirm-stop-loss/confirm-stop-loss.component';
import {TraderModule} from '../trader/trader.module';

@Component({
  selector: 'app-my-main',
  template: `<router-outlet></router-outlet>`
})
export class MyMainComponent{

}
const routes: Routes = [
  {
    path: 'my-exchange', component: MyMainComponent,
    children: [
      {path: '', redirectTo: 'balances', pathMatch: 'full'},
      {path: 'balances', component: MyExchangeBalncesComponent},
      {path: 'balances/:exchange', component: MyExchangeBalncesComponent},
      {path: 'markets/:exchange', component: MyMarketsComponent},
     // {path: 'orders-coindatas', component:  MyOrdersHistoryComponent},
      {path: 'buy-sell', component: MyBuySellComponent},
      {path: 'buy-sell/:exchange/:market', component: MyBuySellComponent},
      {path: 'buy-sell-coin/:exchange/:coin', component: BuySellCoinComponent},
      {path: 'buy-sell-panel/:exchange/:market', component:  BuySellPanelComponent}
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    MaterialAppModule,
    UiModule,
    WidgetsModule,
    DirectivesModule,
    PipesModule,
    TraderModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    MyMainComponent,
    MyExchangeBalncesComponent,
    MyMarketsComponent,
    MyBuySellComponent,
    TradingHistoryComponent,
    MyOrdersHistoryComponent,
    AllMainCoinsComponent,
    BuySellCoinComponent,
    BuySellPanelComponent,
    ConfirmStopLossComponent
  ],
  providers:[
    ConnectorApiService,
    MyExchangeService
  ],
  entryComponents: [
    ConfirmStopLossComponent
  ]

})
export class MyExchangeModule { }
