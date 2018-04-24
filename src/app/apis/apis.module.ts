import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ApisPublicService} from "./apis-public.service";
import {ApiMarketCapService} from "./api-market-cap.service";
import {ApisBooksService} from "./apis-books.service";
import {ApisPrivateService} from "./apis-private.service";


@NgModule({
  imports: [],
  declarations: [],
  providers: [
    ApisPublicService,
    ApiMarketCapService,
    ApisBooksService,
    ApisPrivateService
  ]
})
export class ApisModule { }
