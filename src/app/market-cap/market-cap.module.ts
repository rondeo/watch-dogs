import {NgModule, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';

import {AllCoinsTableComponent} from './all-coins-table/all-coins-table.component';
import {SelectedCoinsComponent} from './selected-coins/selected-coins.component';
import {MatButton, MatCard} from '@angular/material';
import {MaterialAppModule} from '../material/material-app.module';
import {RouterModule, Routes} from '@angular/router';
import {GainersLosersComponent} from './gainers-losers/gainers-losers.component';
import {ExchangesListComponent} from './exchanges-list/exchanges-list.component';
import {GlAllExchangesComponent} from './gl-all-exchanges/gl-all-exchanges.component';
import {GlKnownExchangesComponent} from './gl-known-exchanges/gl-known-exchanges.component';

import {CoinsExchangesComponent} from './coins-exchanges/coins-exchanges.component';
import {FormsModule} from '@angular/forms';
import {MarketCapMainComponent} from './market-cap-main/market-cap-main.component';

import {UiModule} from '../ui/ui.module';
import {DirectivesModule} from '../directives/directives.module';
import {WidgetsModule} from '../widgets/widgets.module';


const routes: Routes = [
  {
    path: 'market-cap', component: MarketCapMainComponent,
    children: [
      {path: '', redirectTo: 'selected', pathMatch: 'full'},
      {path: 'all-coins', component: AllCoinsTableComponent},
      {path: 'selected', component: SelectedCoinsComponent},
      {path: 'gainers-losers', redirectTo: 'gainers-losers/all', pathMatch: 'full'},
      {path: 'gainers-losers/:exchange', component: GainersLosersComponent},
      {path: 'coin-exchanges/:coinId', component: CoinsExchangesComponent},
      {path: 'exchanges-list', component: ExchangesListComponent}
    ]
  }
];


@NgModule({
  imports: [
    CommonModule,
    MaterialAppModule,
    UiModule,
    FormsModule,
    DirectivesModule,
    WidgetsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    SelectedCoinsComponent,
    AllCoinsTableComponent,
    GainersLosersComponent,
    ExchangesListComponent,
    GlAllExchangesComponent,
    GlKnownExchangesComponent,
    CoinsExchangesComponent,
    MarketCapMainComponent
  ]
})
export class MarketCapModule {
}
