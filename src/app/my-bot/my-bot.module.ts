import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BotMainComponent } from './bot-main/bot-main.component';
import { BotRunComponent } from './bot-run/bot-run.component';
import {RouterModule, Routes} from "@angular/router";
import {MyGainersLosersComponent} from "../my-exchange/my-gainers-losers/my-gainers-losers.component";


import {BrowserModule} from "@angular/platform-browser";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialAppModule} from "../material/material-app.module";
import {SharedModule} from "../shared/shared.module";
import {BotServiceService} from "./services/bot-service.service";
import { BotFollowCoinComponent } from './bot-follow-coin/bot-follow-coin.component';
import { BotBuyCoinComponent } from './bot-buy-coin/bot-buy-coin.component';
import {CollectMarketDataService} from "./services/collect-market-data.service";
import {FrontDeskService} from "./services/front-desk.service";
import { CoinDayComponent } from './coin-day/coin-day.component';
import {CoinDayService} from "./services/coin-day.service";
import {ChartsModule} from "ng2-charts";
import {MatDatepickerModule} from "@angular/material";
import {MatMomentDateModule} from "@angular/material-moment-adapter";
import {MatMomentDatetimeModule} from "@mat-datetimepicker/moment";
import {MatDatetimepickerModule} from "@mat-datetimepicker/core";


const routes: Routes = [
  {
    path: 'my-bot', component: BotMainComponent,
    children: [
      {path: '', redirectTo: 'list', pathMatch: 'full'},
      {path: 'follow-coin', component: BotFollowCoinComponent},
      {path: 'buy-coin/:exchange', component: BotBuyCoinComponent},
      {path: 'run/:exchange/:market', component: BotRunComponent},
      {path: 'coin-day/:coin', component: CoinDayComponent}
    ]
  }

];


@NgModule({
  imports: [
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
    BotMainComponent,
    BotRunComponent,
    BotFollowCoinComponent,
    BotBuyCoinComponent,
    CoinDayComponent
  ],
  providers:[
    BotServiceService,
    CollectMarketDataService,
    FrontDeskService,
    CoinDayService
  ]
})
export class MyBotModule { }
