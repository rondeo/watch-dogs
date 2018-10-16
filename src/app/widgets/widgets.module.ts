import {NgModule} from '@angular/core';
import {CoinDayComponent} from './coin-day/coin-day.component';
import {MarketBooksComponent} from './market-books/market-books.component';
import {TradesExchangeSnapshotComponent} from './trades-exchange-snapshot/trades-exchange-snapshot.component';
import {UiModule} from '../ui/ui.module';
import {CommonModule} from '@angular/common';
import {MaterialAppModule} from '../material/material-app.module';
import { BooksForAmountComponent } from './books-for-amount/books-for-amount.component';
import { AmountCoinComponent } from './amount-coin/amount-coin.component';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {BotsRunningComponent} from './bots-running/bots-running.component';
import {TradesHistoryComponent} from './trades-history/trades-history.component';

import { CoinDayTriggersComponent } from './coin-day-triggers/coin-day-triggers.component';
import { BooksAllExchangesComponent } from './books-all-exchanges/books-all-exchanges.component';
import { OpenOrdersComponent } from './open-orders/open-orders.component';
import { OrdersHistoryComponent } from './orders-history/orders-history.component';
import {CoinDayTriggers2Component} from './coin-day-triggers-2/coin-day-triggers-2.component';
import { TradesAllExchangesComponent } from './trades-all-exchanges/trades-all-exchanges.component';
import { BtcTetherComponent } from './btc-tether/btc-tether.component';
import {ValueColorDirective} from '../directives/value-color.directive';
import {DirectivesModule} from '../directives/directives.module';
import { BalanceMarketComponent } from './balance-market/balance-market.component';
import {PipesModule} from '../pipes/pipes.module';
import { CandleVolumeAlertComponent } from './alerts/candle-volume-alert/candle-volume-alert.component';
import { SharksListComponent } from './alerts/sharks-list/sharks-list.component';
import { CandlesPatternComponent } from './alerts/candles-pattern/candles-pattern.component';
import { MarketCandlesComponent } from './candles-market/market-candles.component';
import { ScannerComponent } from './scanner/scanner.component';



@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MaterialAppModule,
    UiModule,
    DirectivesModule,
    PipesModule
  ],
  exports: [
    BtcTetherComponent,
    CoinDayComponent,
    TradesExchangeSnapshotComponent,
    MarketBooksComponent,
    BooksForAmountComponent,
    AmountCoinComponent,
    BotsRunningComponent,
    TradesHistoryComponent,
    CoinDayTriggersComponent,
    BooksAllExchangesComponent,
    OpenOrdersComponent,
    OrdersHistoryComponent,
    CoinDayTriggers2Component,
    TradesAllExchangesComponent,
    BalanceMarketComponent,
    CandleVolumeAlertComponent,
    SharksListComponent,
    CandlesPatternComponent,
    MarketCandlesComponent,
    ScannerComponent
  ],
  declarations:[
    CoinDayComponent,
    TradesExchangeSnapshotComponent,
    MarketBooksComponent,
    BooksForAmountComponent,
    AmountCoinComponent,
    BotsRunningComponent,
    TradesHistoryComponent,
    CoinDayTriggersComponent,
    BooksAllExchangesComponent,
    OpenOrdersComponent,
    OrdersHistoryComponent,
    CoinDayTriggers2Component,
    TradesAllExchangesComponent,
    BtcTetherComponent,
    BalanceMarketComponent,
    CandleVolumeAlertComponent,
    SharksListComponent,
    CandlesPatternComponent,
    MarketCandlesComponent,
    ScannerComponent
  ]
})
export class WidgetsModule { }
