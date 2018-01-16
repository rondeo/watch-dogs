import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpModule } from '@angular/http';
import {Router, RouterModule} from '@angular/router';
import {rootRouterConfig} from './app.routes';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';

import { AppComponent } from './app.component';
//import { TestComponent } from '../../arch/test/test.component';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';
//import 'rxjs/add/observable/throw';
//import 'rxjs/operator/publishLast';
//import 'rxjs/add/operator/shareReplay';
import 'rxjs/add/operator/do';

//import {AuthHttp, AuthModule, provideAuth, AuthConfig} from './libs/angular2-jwt';


import {MaterialAppModule} from './material/material-app.module';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from './shared/shared.module';
import { ExchangeSsComponent } from './exchange-ss/exchange-ss.component';
import {ExchangeSsService} from './exchange-ss/exchange-ss.service';

import {ApiServerService} from './api-server.service';
import {Login2Component} from './login2/login2.component';
import {SendAlertService} from './exchange-ss/send-alert.service';
import {EmailServiceModule} from './email-service/email-service.module';
import {AuthHttpService} from './services/auth-http.service';
import {LoginModule} from './login/login.module';
import {ShapeShiftModule} from './shape-shift/shape-shift.module';
import {MarketCapService} from './market-cap/market-cap.service';
import {PoloniexService} from './exchanges/services/poloniex.service';

import {MarketCapModule} from './market-cap/market-cap.module';

import {AllCoinsTableComponent} from './market-cap/all-coins-table/all-coins-table.component';



import {StorageService} from './services/app-storage.service';
import {KrakenService} from './exchanges/services/kraken.service';
import {ExchangesModule} from './exchanges/exchanges.module';
import {BitfinexService} from './exchanges/services/bitfinex.service';

import {ChangellyService} from './exchanges/services/changelly.service';
import {CoinEchangeService} from './exchanges/services/coin-echange.service';
import {BittrexService} from './exchanges/services/bittrex.service';
import {CoinbaseService} from './exchanges/services/coinbase.service';
import {YoBitService} from './exchanges/services/yo-bit.service';
import {SearchCoinComponent} from './search-coin/search-coin.component';
import {HitBtcService} from './exchanges/services/hit-btc.service';
import {SearchCoinService} from './exchanges/search-coin.service';
import {NovaexchangeService} from './exchanges/services/novaexchange.service';
import {BittrexModule} from './bittrex/bittrex.module';
import {AllExchangesModule} from './all-in-one/all-exchanges.module';
import {CompareService} from './services/compare.service';
import {SlackService} from "./services/slack.service";
import {HttpClientModule} from "@angular/common/http";
import {BalancesModule} from "./balances/balances.module";
import { WebsocketService} from "./shared/websocket-service";
import {ApiServiceService} from "./exchanges/api-service.service";

//import {WebsocketService} from "./shared/websocket-service";

declare const Buffer:any;


@NgModule({
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    HttpModule,
    MarketCapModule,
    SharedModule,
    MaterialAppModule,
    BrowserModule,
    EmailServiceModule,
    LoginModule,
    ShapeShiftModule,
    ExchangesModule,
    BittrexModule,
    AllExchangesModule,
    BalancesModule,
   // AuthModule,
    RouterModule.forRoot(rootRouterConfig, { useHash: true })
  ],
  declarations: [
    AppComponent,
    // TestComponent,
 /*   AboutComponent,
    RepoBrowserComponent,
    RepoListComponent,
    RepoDetailComponent,
    HomeComponent,
    ContactComponent,*/
    ExchangeSsComponent,
    Login2Component,
    SearchCoinComponent
  ],
  providers: [
    WebsocketService,
    //DataService,
    //AuthHttp,
  //  GithubService,
    AuthHttpService,

    SlackService,
    ExchangeSsService,
    ApiServerService,
    SendAlertService,
    MarketCapService,
    PoloniexService,
    StorageService,
    KrakenService,
    BitfinexService,
    SearchCoinService,
    ChangellyService,
    CoinEchangeService,
    BittrexService,
    CoinbaseService,
    YoBitService,
    HitBtcService,
    NovaexchangeService,
    CompareService
   // WebsocketService

   // provideAuth({
     // headerName: 'Authorization',
    //  headerPrefix: 'Bearer',
    //  tokenName: 'token',
     // tokenGetter: (() => localStorage.getItem('id_token')),
    //  globalHeaders: [{ 'Content-Type': 'application/json' }],
    // noJwtError: true
     // authError:(why:string)=>{ console.warn(why) }
   // })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
