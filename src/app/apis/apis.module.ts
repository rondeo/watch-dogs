import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ApiAllPublicService} from "./api-all-public.service";
import {ApiMarketCapService} from "./api-market-cap.service";

@NgModule({
  imports: [],
  declarations: [],
  providers: [
    ApiAllPublicService,
    ApiMarketCapService
  ]
})
export class ApisModule { }
