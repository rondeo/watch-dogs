import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BalancesMainComponent } from './balances-main/balances-main.component';
import {RouterModule, Routes} from "@angular/router";
import {MyBalancesComponent} from "./my-balances/my-balances.component";
import {MaterialAppModule} from "../material/material-app.module";
import {BrowserModule} from "@angular/platform-browser";
import {FormsModule} from "@angular/forms";
import {MyPrivateServiceService} from "./my-private-service.service";




const routes: Routes = [
  {
    path: 'my-balances', component: BalancesMainComponent,
    children: [

      {path: 'exchange/:exchange', component:MyBalancesComponent}


    ]
  }
];



@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    MaterialAppModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    BalancesMainComponent,
    MyBalancesComponent
  ],
  providers:[MyPrivateServiceService]
})
export class BalancesModule { }
