import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KrakenComponent } from './kraken/kraken.component';
import { BitfinexComponent } from './bitfinex/bitfinex.component';
import {PoloniexTickerComponent} from './poloniex-ticker/poloniex-ticker.component';
import {BittrexMarketComponent} from './bittrex/bittrex-market.component';
import {CoinExchangeMarketComponent} from './coin-exchange-market/coin-exchange-market.component';
import {ChMarketComponent} from './ch-market/ch-market.component';
import {FormsModule} from '@angular/forms';
import {HitBtcMarketComponent} from './hit-btc-market/hit-btc-market.component';
import {YoBitMarketComponent} from './yo-bit-market/yo-bit-market.component';
import {CoinbaseCurrenciesComponent} from './coinbase-currencies/coinbase-currencies.component';
import {MaterialAppModule} from '../material/material-app.module';
import {SharedModule} from '../shared/shared.module';
import { BittrexAvailableComponent } from './bittrex-available/bittrex-available.component';
import {RouterModule} from '@angular/router';
import { PoloniexDataComponent } from './poloniex-data/poloniex-data.component';
import { NovaexchangeComponent } from './novaexchange/novaexchange.component';
import { CryptopiaComponent } from './cryptopia/cryptopia.component';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MaterialAppModule,
    SharedModule,
    RouterModule
  ],
  declarations: [
    KrakenComponent,
    BitfinexComponent,
    PoloniexTickerComponent,
    BittrexMarketComponent,
    CoinExchangeMarketComponent,
    ChMarketComponent,
    HitBtcMarketComponent,
    YoBitMarketComponent,
    CoinbaseCurrenciesComponent,
    BittrexAvailableComponent,
    PoloniexDataComponent,
    NovaexchangeComponent,
    CryptopiaComponent
  ]
})
export class ExchangesModule { }
