import { Injectable } from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {OrdersHistory} from '../market-history/orders-history';
import {CandlesHist} from './candles-hist';

@Injectable()
export class CandlesService {
  collection: { [id: string]: CandlesHist } = {};
  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService
  ) { }

  getCandlesHist(exchange: string, market): CandlesHist{
    const id = exchange+'_'+market;
    let hist: CandlesHist = this.collection[id]
    if(!hist) {
      hist = new CandlesHist(exchange, market, this.apisPublic, this.storage);
      const MC = this.marketCap.getTicker().then(MC => {
        const coinPrice = MC[market.split('_')[1]].price_usd;
        hist.coinPriceUS = coinPrice;
        hist.start();
      })
      this.collection[id] = hist
    }
    return hist;
  }

}
