/**
 * Created by Vlad on 4/3/2017.
 */
import { Routes } from '@angular/router';

/*
import { AboutComponent } from './about/about.component';
import { HomeComponent } from './home/home.component';
import { RepoBrowserComponent } from './github/repo-browser/repo-browser.component';
import { RepoListComponent } from './github/repo-list/repo-list.component';
import { RepoDetailComponent } from './github/repo-detail/repo-detail.component';
import { ContactComponent } from './contact/contact.component';
*/


/*import {WalletsMainComponent} from './wallets/wallets-main/wallets-main.component';
import {MyWalletsComponent} from './wallets/my-wallets/my-wallets.component';*/
import {ExchangeSsComponent} from './exchange-ss/exchange-ss.component';


import {ChMarketComponent} from './exchanges/ch-market/ch-market.component';

import {LoginComponent} from './login/login/login.component';
import {ConfirmComponent} from './login/confirm/confirm.component';






import {SSCoinsAvailableComponent} from './shape-shift/ss-coins-available/ss-coins-available.component';
import {PoloniexTickerComponent} from './exchanges/poloniex-ticker/poloniex-ticker.component';



import {ConfirmResetPasswordComponent} from './login/confirm-reset-password/confirm-reset-password.component';
import {HitBtcMarketComponent} from './exchanges/hit-btc-market/hit-btc-market.component';
import {YoBitMarketComponent} from './exchanges/yo-bit-market/yo-bit-market.component';
import {CoinbaseCurrenciesComponent} from './exchanges/coinbase-currencies/coinbase-currencies.component';
import {CoinExchangeMarketComponent} from './exchanges/coin-exchange-market/coin-exchange-market.component';
import {KrakenComponent} from './exchanges/kraken/kraken.component';
import {BitfinexComponent} from './exchanges/bitfinex/bitfinex.component';
import {SearchCoinComponent} from './search-coin/search-coin.component';

import {PoloniexDataComponent} from './exchanges/poloniex-data/poloniex-data.component';





import {CoinsExchangesComponent} from './market-cap/coins-exchanges/coins-exchanges.component';
import {NovaexchangeComponent} from './exchanges/novaexchange/novaexchange.component';
import {CryptopiaComponent} from './exchanges/cryptopia/cryptopia.component';
import {CoinsListComponent} from "./all-in-one/coins-list/coins-list.component";




export const rootRouterConfig: Routes = [



  { path: 'exchanges/search', component: SearchCoinComponent },
  {path: 'coinslist', component:CoinsListComponent, outlet: 'popup'},

  { path: '', redirectTo: 'market-cap/all-coins', pathMatch: 'full' },
 // { path: 'home', component: HomeComponent },
 // { path: 'login', component: LoginMain },
 // { path: 'about', component: AboutComponent },
  { path: 'exchange-ss', component:ExchangeSsComponent },

  { path: 'coins-exchanges/:list', component: CoinsExchangesComponent},

  { path: 'shape-shift-market-cap', component: SSCoinsAvailableComponent},

  { path: 'hit-btc/market', component: HitBtcMarketComponent },
  { path: 'yo-bit/market', component:  YoBitMarketComponent },


  { path: 'changelly', component: ChMarketComponent },
  { path: 'poloniex/data', component: PoloniexDataComponent },
  { path: 'poloniex/filter', component: PoloniexTickerComponent },

  { path: 'coinbase/currencies', component: CoinbaseCurrenciesComponent },
  { path: 'coin-exchange/markets', component: CoinExchangeMarketComponent },
  { path: 'exchanges/kraken', component: KrakenComponent },
  { path: 'exchanges/bitfinex', component: BitfinexComponent },
  { path: 'exchanges/novaexchange', component: NovaexchangeComponent },

  { path: 'exchanges/cryptopia', component: CryptopiaComponent},

 /* { path: 'wallets', component: WalletsMainComponent },

  { path: 'my-wallets', component: MyWalletsComponent },*/

  { path: 'login/:topic', component: LoginComponent },
  { path: 'login-confirm/:session', component:ConfirmComponent },
  { path: 'confirm-reset-password/:session', component:ConfirmResetPasswordComponent }

 /* { path: 'github', component: RepoBrowserComponent,
    children: [
      { path: '', component: RepoListComponent },
      { path: ':org', component: RepoListComponent,
        children: [
          { path: '', component: RepoDetailComponent },
          { path: ':repo', component: RepoDetailComponent }
        ]
      }]
  },
  { path: 'contact', component: ContactComponent }*/
];