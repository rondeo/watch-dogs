import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BotMainComponent } from './bot-main/bot-main.component';
import { BotRunComponent } from './bot-run/bot-run.component';
import { BotsListComponent } from './bots-list/bots-list.component';
import { BotEditComponent } from './bot-edit/bot-edit.component';
import {MyBalnceComponent} from "../my-exchange/my-balnce/my-balnce.component";
import {MyMarketsComponent} from "../my-exchange/my-markets/my-markets.component";
import {RouterModule, Routes} from "@angular/router";
import {MyGainersLosersComponent} from "../my-exchange/my-gainers-losers/my-gainers-losers.component";
import {MyMainComponent} from "../my-exchange/my-main/my-main.component";
import {MyBuySellComponent} from "../my-exchange/my-buy-sell/my-buy-sell.component";
import {AllMainCoinsComponent} from "../my-exchange/all-main-coins/all-main-coins.component";
import {BrowserModule} from "@angular/platform-browser";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialAppModule} from "../material/material-app.module";
import {SharedModule} from "../shared/shared.module";
import { BotNewComponent } from './bot-new/bot-new.component';
import {BotServiceService} from "./services/bot-service.service";
import { BotFollowCoinComponent } from './bot-follow-coin/bot-follow-coin.component';
import { BotBuyCoinComponent } from './bot-buy-coin/bot-buy-coin.component';
import { BotSellCoinComponent } from './bot-sell-coin/bot-sell-coin.component';
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
      {path: 'list', component: BotsListComponent},
      {path: 'follow-coin', component: BotFollowCoinComponent},
      {path: 'buy-coin/:exchange', component: BotBuyCoinComponent},
      {path: 'run/:exchange/:market', component: BotRunComponent},
      {path: 'edit/:exchange/:market', component: BotEditComponent},
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
    BotsListComponent,
    BotEditComponent,
    BotNewComponent,
    BotFollowCoinComponent,
    BotBuyCoinComponent,
    BotSellCoinComponent,
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
