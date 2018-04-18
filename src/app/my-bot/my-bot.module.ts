import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BotRunComponent} from './bot-run/bot-run.component';
import {RouterModule, Routes} from "@angular/router";
import {MyGainersLosersComponent} from "../my-exchange/my-gainers-losers/my-gainers-losers.component";
import {BrowserModule} from "@angular/platform-browser";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialAppModule} from "../material/material-app.module";
import {SharedModule} from "../shared/shared.module";
import {BotServiceService} from "./services/bot-service.service";
import {BotFollowCoinComponent} from './bot-follow-coin/bot-follow-coin.component';
import {BotBuyCoinComponent} from './bot-buy-coin/bot-buy-coin.component';
import {CollectMarketDataService} from "./services/collect-market-data.service";
import {FrontDeskService} from "./services/front-desk.service";
import {CoinDayComponent} from './coin-day/coin-day.component';
import {ChartsModule} from "ng2-charts";
import {MatDatepickerModule} from "@angular/material";
import {MatMomentDateModule} from "@angular/material-moment-adapter";
import {MatMomentDatetimeModule} from "@mat-datetimepicker/moment";
import {MatDatetimepickerModule} from "@mat-datetimepicker/core";
import {Component, OnInit} from '@angular/core';
import {ApisModule} from "../apis/apis.module";
import { CoinGraphComponent } from './coin-graph/coin-graph.component';

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
      {path: 'coin-day/:coin', component: CoinDayComponent}
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
    RouterModule.forChild(routes)
  ],
  declarations: [
    BotRunComponent,
    BotFollowCoinComponent,
    BotBuyCoinComponent,
    CoinDayComponent,
    Outlet,
    CoinGraphComponent

  ],
  providers: [
    BotServiceService,
    CollectMarketDataService,
    FrontDeskService
  ]
})
export class MyBotModule {
}
