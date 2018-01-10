import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BittrexMainComponent} from './bittrex-main/bittrex-main.component';
import {RouterModule, Routes} from '@angular/router';
import {FormsModule} from '@angular/forms';

import {BittrexDataComponent} from './bittrex-data/bittrex-data.component';
import {BrowserModule} from '@angular/platform-browser';
import {BittrexPrivateService} from './bittrex-private.service';
import {MaterialAppModule} from '../material/material-app.module';
import { BittrexLoginComponent } from './bittrex-login/bittrex-login.component';
import { BittrexBalancesComponent } from './bittrex-balances/bittrex-balances.component';
import { MarketsSummaryComponent } from './markets-summary/markets-summary.component';
import {MarketsSummaryDialog} from './markets-summary/markets-summary.dialog';
import { BittrexMarketsComponent } from './bittrex-markets/bittrex-markets.component';
import { BittrexBuySellComponent } from './bittrex-buy-sell/bittrex-buy-sell.component';


import { BotListComponent } from './bot-list/bot-list.component';
import { BotEditComponent } from './bot-edit/bot-edit.component';
import {BotTestService} from "./bot-test.service";

import { BittrexTransferComponent } from './bittrex-transfer/bittrex-transfer.component';
import { OrdersHistoryComponent } from './orders-history/orders-history.component';
import { OpenOrdersComponent } from './open-orders/open-orders.component';
import { MarketHistoryComponent } from './market-history/market-history.component';
import { MyGainersLosersComponent } from './my-gainers-losers/my-gainers-losers.component';
import {MarketViewComponent} from "../shared/market-view/market-view.component";
import {ChatService} from "./chat-servica";
import { MarketBooksComponent } from './market-books/market-books.component';
import {BooksService} from "../services/books-service";




const routes: Routes = [
  {
    path: 'my-bittrex', component: BittrexMainComponent,
    children: [
      {path: '', redirectTo: 'data', pathMatch: 'full'},
      {path: 'history/:market', component: MarketHistoryComponent},
      {path: 'data', component: BittrexDataComponent},

      {path: 'coin-markets/:symbols', component: BittrexMarketsComponent},
      {path: 'balances', component: BittrexBalancesComponent},
      {path: 'exchange/:action/:symbol', component: BittrexBuySellComponent},
      {path: 'transfer/:symbol', component: BittrexTransferComponent},
      {path: 'bot-list', component: BotListComponent},
      {path: 'bot-edit/:id', component: BotEditComponent},
      {path: 'orders-history', component:  OrdersHistoryComponent},
      {path: 'open-orders', component:  OpenOrdersComponent},
      {path: 'gainers-losers', component:  MyGainersLosersComponent},
      {path: 'buy-sell/:market', component:  BittrexBuySellComponent}

    ]
  }
];


@NgModule({
  exports: [],
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    MaterialAppModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    BittrexMainComponent,
    BittrexDataComponent,
    BittrexLoginComponent,
    BittrexBalancesComponent,
    MarketsSummaryComponent,
    MarketsSummaryDialog,
    BittrexMarketsComponent,
    BittrexBuySellComponent,
    BotListComponent,
    BotEditComponent,
    BittrexTransferComponent,
    OrdersHistoryComponent,
    OpenOrdersComponent,
    MarketHistoryComponent,
    MyGainersLosersComponent,
    MarketBooksComponent
  ],
  providers:[
    BittrexPrivateService,
    BotTestService,
    ChatService,
    BooksService
  ],
  entryComponents: [
    BittrexLoginComponent,
   MarketViewComponent
  ]
})
export class BittrexModule {
}
