import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BotRunComponent} from './bot-run/bot-run.component';
import {RouterModule, Routes} from "@angular/router";
import {MyGainersLosersComponent} from "../my-exchange/my-gainers-losers/my-gainers-losers.component";
import {BrowserModule} from "@angular/platform-browser";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialAppModule} from "../material/material-app.module";
import {SharedModule} from "../shared/shared.module";

import {BotFollowCoinComponent} from './bot-follow-coin/bot-follow-coin.component';
import {BotBuyCoinComponent} from './bot-buy-coin/bot-buy-coin.component';
import {CollectMarketDataService} from "./services/collect-market-data.service";
import {CoinDayComponent} from './coin-day/coin-day.component';
import {ChartsModule} from "ng2-charts";
import {MatDatepickerModule} from "@angular/material";
import {MatMomentDateModule} from "@angular/material-moment-adapter";
import {MatMomentDatetimeModule} from "@mat-datetimepicker/moment";
import {MatDatetimepickerModule} from "@mat-datetimepicker/core";
import {Component, OnInit} from '@angular/core';
import {ApisModule} from "../apis/apis.module";
import { CoinGraphComponent } from './coin-graph/coin-graph.component';
import { BotSellCoinComponent } from './bot-sell-coin/bot-sell-coin.component';
import {BotSellCoinService} from "./services/bot-sell-coin.service";
import {UsdtBtcService} from "./services/usdt-btc.service";
import {UiModule} from "../ui/ui.module";

@Component({
  template: `
      <div>
          <hr/>
          <router-outlet></router-outlet>
          <hr/>
      </div>
  `
})
class Outlet implements OnInit {

  constructor() {
  }

  ngOnInit() {
  }
}

const routes: Routes = [
  {
    path: 'my-bot', component: Outlet,
    children: [
      {path: '', redirectTo: 'follow-coin', pathMatch: 'full'},
      {path: 'follow-coin', component: BotFollowCoinComponent},
      {path: 'coin-graph/:coin', component: CoinGraphComponent},
      {path: 'buy-coin/:exchange', component: BotBuyCoinComponent},
      {path: 'run/:exchange/:market', component: BotRunComponent},
      {path: 'coin-day/:coin', component: CoinDayComponent},
      {path: 'sell-coins', component: BotSellCoinComponent}
    ]
  }
];

@NgModule({
  imports: [
    ApisModule,
    ChartsModule,
    CommonModule,
    BrowserModule,
    FormsModule,
    MaterialAppModule,
    SharedModule,
    MatDatepickerModule,
    MatMomentDateModule,
    ReactiveFormsModule,
    MatMomentDatetimeModule,
    MatDatetimepickerModule,
    UiModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    BotRunComponent,
    BotFollowCoinComponent,
    BotBuyCoinComponent,
    CoinDayComponent,
    Outlet,
    CoinGraphComponent,
    BotSellCoinComponent

  ],
  providers: [
    CollectMarketDataService,
    BotSellCoinService,
    UsdtBtcService
  ]
})
export class MyBotModule {
}
