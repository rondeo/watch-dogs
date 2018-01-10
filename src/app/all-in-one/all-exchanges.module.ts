import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllOverviewComponent } from './all-overview/all-overview.component';
import { AllMainComponent } from './all-main/all-main.component';
import {RouterModule, Routes} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {MaterialAppModule} from '../material/material-app.module';
import { AllBalancesComponent } from './all-balances/all-balances.component';
import {AllCoinsService} from './all-coins.service';
import { AllSearchComponent } from './all-search/all-search.component';
import { AllGainersLosersComponent } from './all-gainers-losers/all-gainers-losers.component';
import { AllCompareComponent } from './all-compare/all-compare.component';
import { AllV2Component } from './all-v2/all-v2.component';
import {V2DataComponent} from './v2-data/v2-data.component';
import {V2Service} from './v2.service';
import { V2ExchangeComponent } from './v2-exchange/v2-exchange.component';
import { V2SearchComponent } from './v2-search/v2-search.component';
import { CoinsListComponent } from './coins-list/coins-list.component';
import {HttpClientModule} from "@angular/common/http";

const routes: Routes = [
  {
    path: 'all-in-one', component: AllMainComponent,
    children: [
      {path: '', redirectTo: 'search', pathMatch: 'full'},
      {path: 'data/:exchange', component: AllOverviewComponent},
      {path: 'balances', component:AllBalancesComponent},
      {path: 'search', component:AllSearchComponent},
      {path: 'search/:coin', component:AllSearchComponent},
      {path: 'gainers-losers', component:AllGainersLosersComponent},
      {path: 'compare/:symbol', component:AllCompareComponent}
    /*
      {path: 'coin-markets/:symbol', component: BittrexMarketsComponent},
      {path: 'balances', component: BittrexBalancesComponent},
      {path: 'buy-sell/:symbol', component: BittrexBuySellComponent}*/
    ]
  },
  {path: 'all-in-one-v2', component: AllV2Component,
    children: [
      {path: '', redirectTo: 'data', pathMatch: 'full'},
      {path: 'data', component:V2DataComponent},
      {path: 'exchange/:exchange', component:V2ExchangeComponent},
      {path: 'symbol/:symbol', component:V2DataComponent},
      {path: 'search', component:V2SearchComponent},
      {path: 'search/:symbol', component:V2SearchComponent},
      {path: 'coin/:symbol', component:V2SearchComponent},
      {path: 'coins', component:CoinsListComponent}
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
    RouterModule.forChild(routes)
  ],
  declarations: [
    AllOverviewComponent,
    AllMainComponent,
    AllBalancesComponent,
    AllSearchComponent,
    AllGainersLosersComponent,
    AllCompareComponent,
    AllV2Component,
    V2DataComponent,
    V2ExchangeComponent,
    V2SearchComponent,
    CoinsListComponent
  ],
  providers:[
    AllCoinsService,
    V2Service
  ]

})
export class AllExchangesModule { }
