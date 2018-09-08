import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {Router, RouterModule} from '@angular/router';
import {rootRouterConfig} from './app.routes';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';




import {AppComponent} from './app.component';
//import { TestComponent } from '../../arch/test/test.component';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';
//import 'rxjs/add/observable/throw';
//import 'rxjs/operator/publishLast';
//import 'rxjs/add/operator/shareReplay';
import 'rxjs/add/operator/do';
import "rxjs/add/operator/concat";

//import {AuthHttp, AuthModule, provideAuth, AuthConfig} from './libs/angular2-jwt';

import {MaterialAppModule} from './material/material-app.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ExchangeSsComponent} from './exchange-ss/exchange-ss.component';
import {ExchangeSsService} from './exchange-ss/exchange-ss.service';

import {ApiServerService} from './api-server.service';
import {SendAlertService} from './exchange-ss/send-alert.service';
import {EmailServiceModule} from './email-service/email-service.module';
import {AuthHttpService} from './services/auth-http.service';
import {LoginModule} from './login/login.module';
import {ShapeShiftModule} from './shape-shift/shape-shift.module';
import {MarketCapService} from './market-cap/services/market-cap.service';


import {MarketCapModule} from './market-cap/market-cap.module';

import {AllCoinsTableComponent} from './market-cap/all-coins-table/all-coins-table.component';


import {StorageService} from './services/app-storage.service';

import {SlackService} from "./services/slack.service";
import {HttpClientModule} from "@angular/common/http";
import {WebsocketService} from "./shared/websocket-service";
import {MyExchangeModule} from "./my-exchange/my-exchange.module";
import {MyBotModule} from "./my-bot/my-bot.module";
import {DatabaseService} from "./services/database.service";
import {TraderModule} from "./trader/trader.module";
import {AllInOneModule} from "./all-in-one/all-in-one.module";
import {UiModule} from "./ui/ui.module";
import {UserLoginService} from './services/user-login.service';
import {ShowExternalPageService} from './services/show-external-page.service';
import {AppServicesModule} from './app-services/app-services.module';
import {WidgetsModule} from './widgets/widgets.module';
import { ValueColorDirective } from './directives/value-color.directive';




//import {WebsocketService} from "./shared/websocket-service";

declare const Buffer: any;


@NgModule({
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MarketCapModule,
    MaterialAppModule,
    BrowserModule,
    EmailServiceModule,
    LoginModule,
    ShapeShiftModule,
    MyExchangeModule,
    MyBotModule,
    TraderModule,
    AllInOneModule,
    UiModule,
    AppServicesModule,
    WidgetsModule,
    // AuthModule,
    RouterModule.forRoot(rootRouterConfig, {useHash: true})
  ],
  declarations: [
    AppComponent,
    ExchangeSsComponent
  ],
  providers: [
    DatabaseService,
    WebsocketService,
    AuthHttpService,
    SlackService,
    ExchangeSsService,

    SendAlertService,
    MarketCapService,
    StorageService,
    UserLoginService,
    ShowExternalPageService
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
export class AppModule {
}
