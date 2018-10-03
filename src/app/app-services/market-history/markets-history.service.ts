import {Injectable} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {OrdersHistory} from './orders-history';
import {StorageService} from '../../services/app-storage.service';

@Injectable()
export class MarketsHistoryService {

  collection: { [id: string]: OrdersHistory } = {};
  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService
  ) {
  }

  getOrdersHistory(exchange: string, market: string):OrdersHistory {
    const id = exchange + market;
    let ctr: OrdersHistory = this.collection[id];
    if (!ctr) {
      const api = this.apisPublic.getExchangeApi(exchange);
      ctr = new OrdersHistory(api, market, this.storage);
      this.collection[id] = ctr;

      this.marketCap.getTicker().then(MC => {

        const ar = market.split('_');
        ctr.coinPrice = MC[ar[1]].price_usd;
        ctr.start();
      })
    }
    return ctr;
  }


}
