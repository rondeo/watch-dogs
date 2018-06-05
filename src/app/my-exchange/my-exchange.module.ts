import {Component, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';

import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {MaterialAppModule} from "../material/material-app.module";
import {RouterModule, Routes} from "@angular/router";
import { MyMarketsComponent } from './my-markets/my-markets.component';
import {ConnectorApiService} from "./services/connector-api.service";

import { MyBuySellComponent } from './my-buy-sell/my-buy-sell.component';


import {TradingHistoryComponent} from "./trading-history/trading-history.component";
import { MyOrdersHistoryComponent } from './my-orders-history/my-orders-history.component';
import { AllMainCoinsComponent } from './all-main-coins/all-main-coins.component';
import {SharedModule} from "../shared/shared.module";
import {UiModule} from '../ui/ui.module';
import {MyExchangeService} from './services/my-exchange.service';
import { BuySellCoinComponent } from './buy-sell-coin/buy-sell-coin.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {MyExchangeBalncesComponent} from './my-balnce/my-exchange-balnces.component';


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
      {path: '', redirectTo: 'balances/bittrex', pathMatch: 'full'},
      {path: 'balances/:exchange', component: MyExchangeBalncesComponent},
      {path: 'markets/:exchange', component: MyMarketsComponent},

     // {path: 'orders-history', component:  MyOrdersHistoryComponent},
      {path: 'buy-sell/:exchage/:market', component: MyBuySellComponent},
      {path: 'buy-sell-coin/:exchange/:coin', component: BuySellCoinComponent}

    ]
  }
];



@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    MaterialAppModule,

    SharedModule,
    UiModule,
    WidgetsModule,
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
    BuySellCoinComponent
  ],
  providers:[
    ConnectorApiService,
    MyExchangeService
  ]

})
export class MyExchangeModule { }
