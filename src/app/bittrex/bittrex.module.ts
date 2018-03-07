import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BittrexMainComponent} from './bittrex-main/bittrex-main.component';
import {RouterModule, Routes} from '@angular/router';
import {FormsModule} from '@angular/forms';


import {BrowserModule} from '@angular/platform-browser';
import {BittrexPrivateService} from './bittrex-private.service';
import {MaterialAppModule} from '../material/material-app.module';
import { BittrexLoginComponent } from './bittrex-login/bittrex-login.component';




import { BotListComponent } from './bot-list/bot-list.component';
import { BotEditComponent } from './bot-edit/bot-edit.component';
import {BotTestService} from "./bot-test.service";


import {MarketViewComponent} from "../shared/market-view/market-view.component";
import {ChatService} from "./chat-servica";

import {BooksService} from "../services/books-service";
import {OrdersManagerService} from "../services/orders-manager.service";




const routes: Routes = [
  {
    path: 'my-bittrex', component: BittrexMainComponent,
    children: [
      {path: '', redirectTo: 'data', pathMatch: 'full'},





      {path: 'bot-list', component: BotListComponent},
      {path: 'bot-edit/:id', component: BotEditComponent},



    ]
  }
];


@NgModule({
  exports: [],
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    MaterialAppModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    BittrexMainComponent,
    BittrexLoginComponent,

    BotListComponent,
    BotEditComponent,

  ],
  providers:[
    BittrexPrivateService,
    BotTestService,
    ChatService,
    BooksService,
    OrdersManagerService
  ],
  entryComponents: [
    BittrexLoginComponent,
   MarketViewComponent
  ]
})
export class BittrexModule {
}
