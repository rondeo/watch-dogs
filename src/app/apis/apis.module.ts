import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ApisPublicService} from "./api-public/apis-public.service";
import {ApiMarketCapService} from "./api-market-cap.service";
import {ApisPrivateService} from "./api-private/apis-private.service";
import {MongoService} from "./mongo.service";
import {ApiCryptoCompareService} from "./api-crypto-compare.service";

import {NewsService} from './news/news.service';



@NgModule({
  imports: [],
  declarations: [],
  providers: [
    ApisPublicService,
    ApiMarketCapService,
    ApisPrivateService,
    MongoService,
    ApiCryptoCompareService,
    NewsService
  ]
})

export class ApisModule { }
