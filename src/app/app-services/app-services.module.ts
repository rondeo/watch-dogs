import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AppBotsService} from './app-bots-services/app-bots.service';


@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  providers:[
    AppBotsService
  ]
})
export class AppServicesModule { }
