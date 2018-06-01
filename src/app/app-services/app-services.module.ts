import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AppBuySellService} from './app-buy-sell-services/app-buy-sell.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  providers:[
    AppBuySellService
  ]
})
export class AppServicesModule { }
