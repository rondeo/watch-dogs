import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {MaterialAppModule} from "../material/material-app.module";
import {RouterModule, Routes} from "@angular/router";




import { MyMainComponent } from './my-main/my-main.component';
import { MyMarketsComponent } from './my-markets/my-markets.component';
import {ConnectorApiService} from "./services/connector-api.service";
import { MyGainersLosersComponent } from './my-gainers-losers/my-gainers-losers.component';
import { MyBuySellComponent } from './my-buy-sell/my-buy-sell.component';
import {MarketSelectComponent} from "./market-select/market-select.component";
import { MyBooksComponent } from './my-books/my-books.component';
import { MarketHistoryLineComponent } from './market-history-line/market-history-line.component';
import {ChartsModule} from "ng2-charts";
import { MarketHistoryTableComponent } from './market-history-table/market-history-table.component';
import {TradingHistoryComponent} from "./trading-history/trading-history.component";
import { RefreshButtonComponent } from './refresh-button/refresh-button.component';
import { MyOrdersHistoryComponent } from './my-orders-history/my-orders-history.component';
import { AllMainCoinsComponent } from './all-main-coins/all-main-coins.component';
import {SharedModule} from "../shared/shared.module";
import {GainersService} from "./my-exchange-bot/bot/gainers.service";
import { MyExchangeBotComponent } from './my-exchange-bot/my-exchange-bot.component';
import {MyTradingService} from "./my-exchange-bot/bot/my-trading.service";
import {MarketCollectorService} from "./my-exchange-bot/bot/market-collector.service";
import {BuyCoinService} from "./my-exchange-bot/bot/buy-coin.service";
import {FollowCoinService} from "./my-exchange-bot/bot/follow-coin.service";
import {UiModule} from '../ui/ui.module';
import {MyExchangeService} from './services/my-exchange.service';
import { BuySellCoinComponent } from './buy-sell-coin/buy-sell-coin.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {MyExchangeBalncesComponent} from './my-balnce/my-exchange-balnces.component';


const routes: Routes = [
  {
    path: 'my-exchange', component: MyMainComponent,
    children: [
      {path: '', redirectTo: 'balances/bittrex', pathMatch: 'full'},
      {path: 'balances/:exchange', component: MyExchangeBalncesComponent},
      {path: 'markets/:exchange', component: MyMarketsComponent},
      {path: 'gainers-losers', component:  MyGainersLosersComponent},
     // {path: 'orders-history', component:  MyOrdersHistoryComponent},
      {path: 'buy-sell/:exchage/:market', component: MyBuySellComponent},
      {path: 'buy-sell-coin/:exchange/:coin', component: BuySellCoinComponent},

      {path: 'bot', component: MyExchangeBotComponent}

     /* {path: 'data', component: BittrexDataComponent},

      {path: 'coin-markets/:symbols', component: BittrexMarketsComponent},
      {path: 'balances', component: BittrexBalancesComponent},
      {path: 'exchange/:status/:symbol', component: BittrexBuySellComponent},
      {path: 'transfer/:symbol', component: BittrexTransferComponent},
      {path: 'bot-list', component: BotListComponent},
      {path: 'bot-edit/:id', component: BotEditComponent},
      {path: 'orders-history', component:  OrdersHistoryComponent},
      {path: 'open-orders', component:  OpenOrdersComponent},

      {path: 'buy-sell/:market', component:  BittrexBuySellComponent}*/

    ]
  }
];



@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    MaterialAppModule,
    ChartsModule,
    SharedModule,
    UiModule,
    WidgetsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    MyMainComponent,
    MyExchangeBalncesComponent,
    MyMarketsComponent,
    MyGainersLosersComponent,
    MyBuySellComponent,
    //MyOrdersHistoryComponent,
    MarketSelectComponent,
    MyBooksComponent,
    MarketHistoryLineComponent,
    MarketHistoryTableComponent,
    TradingHistoryComponent,
    RefreshButtonComponent,
    MyOrdersHistoryComponent,
    AllMainCoinsComponent,
    MyExchangeBotComponent,
    BuySellCoinComponent
  ],
  providers:[
    ConnectorApiService,
    GainersService,
    MyTradingService,
    MarketCollectorService,
    BuyCoinService,
    FollowCoinService,
    MyExchangeService
  ]

})
export class MyExchangeModule { }
