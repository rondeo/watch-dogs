import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AppBotsService} from './app-bots-services/app-bots.service';
import {MarketsHistoryService} from './market-history/markets-history.service';
import {TradesHistoryService} from './tests/trades-history.service';
import {CandlesService} from './candles/candles.service';


@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  providers:[
    AppBotsService,
    MarketsHistoryService,
    TradesHistoryService,
    CandlesService
  ]
})
export class AppServicesModule { }
