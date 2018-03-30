import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SharedModule} from "../shared/shared.module";
import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {RouterModule, Routes} from "@angular/router";
import {MaterialAppModule} from "../material/material-app.module";
import {ChartsModule} from "ng2-charts";
import {TraderOutletComponent} from "./trader-outlet/trader-outlet.component";
import {TraderMainComponent} from "./trader-main/trader-main.component";
import {SoketConnectorService} from "../sockets/soket-connector.service";
import { TraderSocketComponent } from './trader-socket/trader-socket.component';

const routes: Routes = [
  {
    path: 'trader', component: TraderOutletComponent,
    children: [
      {path: '', redirectTo: 'market/USDT_BTC', pathMatch: 'full'},
      {path: 'market/:market', component: TraderMainComponent}
    ]
  }
];


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    MaterialAppModule,
    ChartsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    TraderOutletComponent,
    TraderMainComponent,
    TraderSocketComponent
  ],
  providers:[SoketConnectorService]
})
export class TraderModule { }
