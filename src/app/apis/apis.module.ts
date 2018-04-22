import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ApiAllPublicService} from "./api-all-public.service";
import {ApiMarketCapService} from "./api-market-cap.service";
import {ApisBooksService} from "./apis-books.service";


@NgModule({
  imports: [],
  declarations: [],
  providers: [
    ApiAllPublicService,
    ApiMarketCapService,
    ApisBooksService
  ]
})
export class ApisModule { }
