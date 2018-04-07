import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {MaterialAppModule} from '../material/material-app.module';

import {V2DataComponent} from './v2-data/v2-data.component';
import {V2ExchangeComponent} from './v2-exchange/v2-exchange.component';
import {V2SearchComponent} from './v2-search/v2-search.component';
import {HttpClientModule} from "@angular/common/http";
import {ApisModule} from "../apis/apis.module";
import { AllInOneOutletComponent } from './all-in-one-outlet/all-in-one-outlet.component';

const routes: Routes = [
  {
    path: 'all-in-one', component: AllInOneOutletComponent,
    children: [
      {path: '', redirectTo: 'data', pathMatch: 'full'},
      {path: 'data', component: V2DataComponent},
      {path: 'exchange/:exchange', component: V2ExchangeComponent},
      {path: 'symbol/:symbol', component: V2DataComponent},
      {path: 'search', component: V2SearchComponent},
      {path: 'search/:symbol', component: V2SearchComponent},
      {path: 'coin/:symbol', component: V2SearchComponent}
    ],
  }

];


@NgModule({
  // exports:[],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
    MaterialAppModule,
    ApisModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    V2DataComponent,
    V2ExchangeComponent,
    V2SearchComponent,
    AllInOneOutletComponent
  ],
  providers: [
  ]

})
export class AllInOneModule {
}
