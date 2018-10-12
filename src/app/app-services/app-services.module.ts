import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AppBotsService} from './app-bots-services/app-bots.service';
import {MarketsHistoryService} from './market-history/markets-history.service';
import {TradesHistoryService} from './tests/trades-history.service';
import {CandlesService} from './candles/candles.service';
import {ScanMarketsService} from './scanner/scan-markets.service';
import {BtcTetherComponent} from '../widgets/btc-tether/btc-tether.component';
import {BtcUsdtService} from './alerts/btc-usdt.service';
import {MarketAlertsService} from './alerts/market-alerts.service';


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
    MarketAlertsService,
    BtcUsdtService
  ]
})
export class AppServicesModule {
}
