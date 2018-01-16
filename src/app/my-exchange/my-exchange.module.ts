import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyExchangeMainComponent } from './my-exchange-main/my-exchange-main.component';




import {OrdersHistoryComponent} from "../bittrex/orders-history/orders-history.component";
import {BittrexMarketsComponent} from "../bittrex/bittrex-markets/bittrex-markets.component";
import {BittrexBuySellComponent} from "../bittrex/bittrex-buy-sell/bittrex-buy-sell.component";
import {BotListComponent} from "../bittrex/bot-list/bot-list.component";
import {OpenOrdersComponent} from "../bittrex/open-orders/open-orders.component";
import {BotEditComponent} from "../bittrex/bot-edit/bot-edit.component";
import {MyGainersLosersComponent} from "../bittrex/my-gainers-losers/my-gainers-losers.component";
import {RouterModule, Routes} from "@angular/router";
import {BittrexBalancesComponent} from "../bittrex/bittrex-balances/bittrex-balances.component";
import {MarketHistoryComponent} from "../bittrex/market-history/market-history.component";
import {BittrexMainComponent} from "../bittrex/bittrex-main/bittrex-main.component";
import {BittrexTransferComponent} from "../bittrex/bittrex-transfer/bittrex-transfer.component";
import {BittrexDataComponent} from "../bittrex/bittrex-data/bittrex-data.component";
import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {MaterialAppModule} from "../material/material-app.module";

const routes: Routes = [
  {
    path: 'my-exchange', component: MyExchangeMainComponent,
    children: [
      {path: '', redirectTo: 'data', pathMatch: 'full'},
      {path: 'balance/:exchange', component: MarketHistoryComponent},
      {path: 'data', component: BittrexDataComponent},
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
    MyExchangeMainComponent
  ]
})
export class MyExchangeModule { }
