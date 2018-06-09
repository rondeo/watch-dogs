import {NgModule} from '@angular/core';
import {CoinDayComponent} from './coin-day/coin-day.component';
import {MarketBooksComponent} from './market-books/market-books.component';
import {MarketSnapshotComponent} from './market-snapshot/market-snapshot.component';
import {UiModule} from '../ui/ui.module';
import {CommonModule} from '@angular/common';
import {MaterialAppModule} from '../material/material-app.module';
import { BooksForAmountComponent } from './books-for-amount/books-for-amount.component';
import { AmountCoinComponent } from './amount-coin/amount-coin.component';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {BotsRunningComponent} from './bots-running/bots-running.component';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MaterialAppModule,
    UiModule
  ],
  exports: [
    CoinDayComponent,
    MarketSnapshotComponent,
    MarketBooksComponent,
    BooksForAmountComponent,
    AmountCoinComponent,
    BotsRunningComponent
  ],
  declarations:[
    CoinDayComponent,
    MarketSnapshotComponent,
    MarketBooksComponent,
    BooksForAmountComponent,
    AmountCoinComponent,
    BotsRunningComponent
  ]
})
export class WidgetsModule { }