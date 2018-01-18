import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {MaterialAppModule} from "../material/material-app.module";
import {RouterModule, Routes} from "@angular/router";



/*
import {OrdersHistoryComponent} from "../bittrex/orders-history/orders-history.component";
import {BittrexMarketsComponent} from "../bittrex/bittrex-markets/bittrex-markets.component";
import {BittrexBuySellComponent} from "../bittrex/bittrex-buy-sell/bittrex-buy-sell.component";
import {BotListComponent} from "../bittrex/bot-list/bot-list.component";
import {OpenOrdersComponent} from "../bittrex/open-orders/open-orders.component";
import {BotEditComponent} from "../bittrex/bot-edit/bot-edit.component";
import {MyGainersLosersComponent} from "../bittrex/my-gainers-losers/my-gainers-losers.component";

import {BittrexBalancesComponent} from "../bittrex/bittrex-balances/bittrex-balances.component";
import {MarketHistoryComponent} from "../bittrex/market-history/market-history.component";
import {BittrexMainComponent} from "../bittrex/bittrex-main/bittrex-main.component";
import {BittrexTransferComponent} from "../bittrex/bittrex-transfer/bittrex-transfer.component";
import {BittrexDataComponent} from "../bittrex/bittrex-data/bittrex-data.component";
*/



import { MyMainComponent } from './my-main/my-main.component';
import { MyBalnceComponent } from './my-balnce/my-balnce.component';
import { MyMarketsComponent } from './my-markets/my-markets.component';
import {ConnectorApiService} from "./services/connector-api.service";

const routes: Routes = [
  {
    path: 'my-exchange/:exchange', component: MyMainComponent,
    children: [
      {path: '', redirectTo: 'markets', pathMatch: 'full'},
      {path: 'balance', component: MyBalnceComponent},
      {path: 'markets', component: MyMarketsComponent}
     /* {path: 'data', component: BittrexDataComponent},

      {path: 'coin-markets/:symbols', component: BittrexMarketsComponent},
      {path: 'balances', component: BittrexBalancesComponent},
      {path: 'exchange/:action/:symbol', component: BittrexBuySellComponent},
      {path: 'transfer/:symbol', component: BittrexTransferComponent},
      {path: 'bot-list', component: BotListComponent},
      {path: 'bot-edit/:id', component: BotEditComponent},
      {path: 'orders-history', component:  OrdersHistoryComponent},
      {path: 'open-orders', component:  OpenOrdersComponent},
      {path: 'gainers-losers', component:  MyGainersLosersComponent},
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
    RouterModule.forChild(routes)
  ],
  declarations: [
    MyMainComponent,
    MyBalnceComponent,
    MyMarketsComponent
  ],
  providers:[
    ConnectorApiService
  ]

})
export class MyExchangeModule { }
