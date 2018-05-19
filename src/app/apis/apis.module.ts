import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ApisPublicService} from "./apis-public.service";
import {ApiMarketCapService} from "./api-market-cap.service";
import {ApisBooksService} from "./apis-books.service";
import {ApisPrivateService} from "./apis-private.service";
import {MongoService} from "./mongo.service";
import {ApiCryptoCompareService} from "./api-crypto-compare.service";


@NgModule({
  imports: [],
  declarations: [],
  providers: [
    ApisPublicService,
    ApiMarketCapService,
    ApisBooksService,
    ApisPrivateService,
    MongoService,
    ApiCryptoCompareService
  ]
})
export class ApisModule { }
