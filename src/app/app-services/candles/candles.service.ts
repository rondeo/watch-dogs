import {Injectable} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {OrdersHistory} from '../market-history/orders-history';
import {CandlesHist} from './candles-hist';
import {CandlesData} from './candles-data';
import * as _ from 'lodash';
import {Observable} from 'rxjs/Observable';
import {VOCandle} from '../../models/api-models';

@Injectable()
export class CandlesService {
  collection: { [id: string]: CandlesData } = {};
  candlesInterval = '1m';
  canlesLength = 240;
  overlap = 20;
  userExclude: string[] = ['BTC_ETC','BTC_BCN', 'BTC_STORM', 'BTC_GRS', 'BTC_SC', 'BTC_DENT', 'BTC_NPXS', 'BTC_NCASH', 'BTC_EOS', 'BTC_ETH', 'BTC_PAX', 'BTC_XMR', 'BTC_BCH', 'BTC_BCC'];


  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService
  ) {
  }

  removeAllCandles(){
    Object.values(this.collection).forEach(function (o) {
      o.removeAllCandles();
    })
  }
  async removeCandles(exchange: string, market: string) {
    let ctr: CandlesData = this.collection[exchange];
    return ctr.removeCandles( market);
  }

  async subscribeForAll() {
    const exchange = 'binance';
    const data = await this.apisPublic.getExchangeApi(exchange).getMarkets();
    let markets = Object.keys(data);
    markets = markets.filter(function (o) {
      return o.indexOf('BTC') === 0;
    });

    markets = _.difference(markets, this.userExclude);

    const res = markets.map((o) => {
      return this.subscribe(exchange, o);
    });
    return Promise.all(res);
  }

  getAllSubscriptions(): Observable<{exchange: string, market: string, candles:VOCandle[]}>[]{
    const candles: CandlesData[] = Object.values(this.collection);
    let out = [] = [];
     candles.forEach(function (o) {
       out = out.concat(o.getAllSubscriptions());
    });
    return out;
  }

  async subscribe(exchange: string, market: string):Promise<Observable<{ exchange: string, market: string, candles: VOCandle[] }>> {
    let ctr: CandlesData = this.collection[exchange];
    if (!ctr) {
      ctr = new CandlesData(
        this.apisPublic.getExchangeApi(exchange),
        this.storage,
        this.candlesInterval,
        this.canlesLength,
        this.overlap
      );
      this.collection[exchange] = ctr;
    }
    return ctr.subscribe(market);
  }

  unsubscribe(exchange: string, market: string, interval: string) {
    let ctr: CandlesData = this.collection[exchange];
    ctr.subscribe(market);
  }


  async getCandles(exchange: string, market: string) {
    let ctr: CandlesData = this.collection[exchange];
    if(!ctr) return null;
    const data = ctr.getCandles(market);
    if(!data) return this.apisPublic.getExchangeApi(exchange).downloadCandles(market, this.candlesInterval, this.canlesLength);
    return data;
  }
}
