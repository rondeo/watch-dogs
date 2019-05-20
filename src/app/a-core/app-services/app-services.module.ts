import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MarketsHistoryService} from './market-history/markets-history.service';
import {TradesHistoryService} from './tests/trades-history.service';
import {CandlesService} from './candles/candles.service';
import {ScanMarketsService} from './scanner/scan-markets.service';
import {BtcUsdtService} from './alerts/btc-usdt.service';
import {FollowOrdersService} from '../apis/open-orders/follow-orders.service';
import {FavoritesService} from './favorites.service';
import {AppBotsService} from '../../app-bots/app-bots.service';


@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  providers: [
    AppBotsService,
    MarketsHistoryService,
    TradesHistoryService,
    CandlesService,
    ScanMarketsService,
    BtcUsdtService,
    FollowOrdersService,
    FavoritesService
  ]
})
export class AppServicesModule {
}
