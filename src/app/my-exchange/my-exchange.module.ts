import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {MaterialAppModule} from "../material/material-app.module";
import {RouterModule, Routes} from "@angular/router";




import { MyMainComponent } from './my-main/my-main.component';
import { MyBalnceComponent } from './my-balnce/my-balnce.component';
import { MyMarketsComponent } from './my-markets/my-markets.component';
import {ConnectorApiService} from "./services/connector-api.service";
import { MyGainersLosersComponent } from './my-gainers-losers/my-gainers-losers.component';
import { MyBuySellComponent } from './my-buy-sell/my-buy-sell.component';
import { MyOrdersHistoryComponent } from './my-orders-history/my-orders-history.component';


const routes: Routes = [
  {
    path: 'my-exchange/:exchange', component: MyMainComponent,
    children: [
      {path: '', redirectTo: 'markets', pathMatch: 'full'},
      {path: 'balance', component: MyBalnceComponent},
      {path: 'markets', component: MyMarketsComponent},
      {path: 'gainers-losers', component:  MyGainersLosersComponent},
      {path: 'orders-history', component:  MyOrdersHistoryComponent},
      {path: 'buy-sell/:market', component: MyBuySellComponent}

     /* {path: 'data', component: BittrexDataComponent},

      {path: 'coin-markets/:symbols', component: BittrexMarketsComponent},
      {path: 'balances', component: BittrexBalancesComponent},
      {path: 'exchange/:action/:symbol', component: BittrexBuySellComponent},
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
    RouterModule.forChild(routes)
  ],
  declarations: [
    MyMainComponent,
    MyBalnceComponent,
    MyMarketsComponent,
    MyGainersLosersComponent,
    MyBuySellComponent,
    MyOrdersHistoryComponent
  ],
  providers:[
    ConnectorApiService
  ]

})
export class MyExchangeModule { }
