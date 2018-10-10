import { Injectable } from '@angular/core';
import {ApisPublicService} from '../../apis/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ScannerMarkets} from './scanner-markets';

@Injectable()
export class ScanMarketsService {

  scanners:{[index:string]: ScannerMarkets} = {};
  constructor(
    private apisPublic: ApisPublicService,
    private storage: StorageService,
    private marketCap: ApiMarketCapService
  ) { }

  getScanner(exchange: string): ScannerMarkets{
    if(!this.scanners[exchange]) {
      this.scanners[exchange] = new ScannerMarkets(this.apisPublic.getExchangeApi(exchange), this.storage, this.marketCap);
    }
   return this.scanners[exchange];
  }

}
