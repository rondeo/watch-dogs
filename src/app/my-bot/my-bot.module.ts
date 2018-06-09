import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {BrowserModule} from "@angular/platform-browser";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialAppModule} from "../material/material-app.module";

import {ChartsModule} from "ng2-charts";
import {MatDatepickerModule} from "@angular/material";
import {MatMomentDateModule} from "@angular/material-moment-adapter";
import {MatMomentDatetimeModule} from "@mat-datetimepicker/moment";
import {MatDatetimepickerModule} from "@mat-datetimepicker/core";
import {Component, OnInit} from '@angular/core';
import {ApisModule} from "../apis/apis.module";

import { BotSellCoinComponent } from './bot-sell-coins/bot-sell-coin.component';

import {UiModule} from "../ui/ui.module";
import { SellCoinComponent } from './sell-coin/sell-coin.component';

@Component({
  template: `
      <div>
          <hr/>
          <router-outlet></router-outlet>
          <hr/>
      </div>
  `
})
export class Outlet implements OnInit {

  constructor() {
  }

  ngOnInit() {
  }
}

const routes: Routes = [
  {
    path: 'my-bot', component: Outlet,
    children: [
      {path: '', redirectTo: 'follow-coin', pathMatch: 'full'},
      {path: 'sell-coins', component: BotSellCoinComponent}
    ]
  }
];

@NgModule({
  imports: [
    ApisModule,
    ChartsModule,
    CommonModule,
    BrowserModule,
    FormsModule,
    MaterialAppModule,
    MatDatepickerModule,
    MatMomentDateModule,
    ReactiveFormsModule,
    MatMomentDatetimeModule,
    MatDatetimepickerModule,
    UiModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    Outlet,
    BotSellCoinComponent,
    SellCoinComponent

  ],
  providers: [
  ]
})
export class MyBotModule {
}
