import {NgModule} from '@angular/core';
import {CoinDayComponent} from './coin-day/coin-day.component';
import {MarketBooksComponent} from './market-books/market-books.component';
import {MarketSnapshotComponent} from './market-snapshot/market-snapshot.component';
import {UiModule} from '../ui/ui.module';
import {SharedModule} from '../shared/shared.module';
import {CommonModule} from '@angular/common';
import {MaterialAppModule} from '../material/material-app.module';
import { BooksForAmountComponent } from './books-for-amount/books-for-amount.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialAppModule,
    UiModule,
    SharedModule
  ],
  exports: [
    CoinDayComponent,
    MarketSnapshotComponent,
    MarketBooksComponent,
    BooksForAmountComponent
  ],
  declarations:[
    CoinDayComponent,
    MarketSnapshotComponent,
    MarketBooksComponent,
    BooksForAmountComponent
  ]
})
export class WidgetsModule { }