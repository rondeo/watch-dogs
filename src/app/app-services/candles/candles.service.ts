import {Injectable} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {OrdersHistory} from '../market-history/orders-history';
import {CandlesHist} from './candles-hist';
import {CandlesData} from './candles-data';
import * as _ from 'lodash';
import {Observable} from 'rxjs/Observable';
import {VOCandle} from '../../models/api-models';
import {Subject} from 'rxjs/Subject';

@Injectable()
export class CandlesService {
  collection: { [id: string]: CandlesData } = {};
  candlesInterval = '1m';
  canlesLength = 240;
  overlap = 20;
  first20coins = 'ETH,LTC,EOS,XRP,BCH,BNB,ADA,NXT,TRX,DOGE,DASH,XMR,XEM,ETC,NEO,ZEC,OMG,XTZ,VET,XLM';
  userExclude = 'BCN,STORM,GRS,SC,DENT,NPXS,NCASH,PAX,BCC,FUN,TUSD,HOT,AMB,TRIG';

  candlesSub: Subject<{exchange: string, market: string, candles: VOCandle[]}> = new Subject<{exchange: string, market: string, candles: VOCandle[]}>()

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService
  ) {
  }

  async downloadCandles(exchange: string, markets: string[] , i, candlesInterval:string, canlesLength: number, sub: Subject<any>) {
    i++;
    if(i >= markets.length) {
      sub.complete();
      return;
    }
    const market = markets[i];
    const api = this.apisPublic.getExchangeApi(exchange);
    const candles = await api.downloadCandles(market, candlesInterval, canlesLength);
    sub.next({exchange, market, candles});
    setTimeout(()=>this.downloadCandles(exchange, markets, i, candlesInterval, canlesLength, sub), 1000);
  }

  async scanOnce(candlesInterval: string, canlesLength: number){
    const exchange = 'binance';
    const markets =  await this.getValidMarkets(exchange);
    const i = -1;
    const sub: Subject<any> = new Subject<any>();
    this.downloadCandles(exchange,markets,i,candlesInterval, canlesLength, sub);
    return sub;
  }
  removeAllCandles() {
    Object.values(this.collection).forEach(function (o) {
      o.removeAllCandles();
    })
  }

  async removeCandles(exchange: string, market: string) {
    let ctr: CandlesData = this.collection[exchange];
    console.log(ctr);
    if(!!ctr) return ctr.removeCandles(market);
  }

 async getValidMarkets(exchange){
    const data = await this.apisPublic.getExchangeApi(exchange).getMarkets();
   let markets = Object.keys(data);
   markets = markets.filter(function (o) {
     return o.indexOf('BTC') === 0;
   });

   const userExclude = (this.userExclude + ',' + this.first20coins).split(',').map(function (o) {
     return 'BTC_' + o;
   });

   const runtimeExclude = await this.storage.select('exclude-markets-' + exchange);
   markets = _.difference(markets, userExclude);

   markets = _.difference(markets, _.map(runtimeExclude,'market'));

  /* const preference =  ((await this.storage.select('markets-favorite')) || []).map(function (o) {
     return o.market;
   });

   markets = preference.concat(markets);
   markets = _.uniq(markets);*/
   return markets;

 }
  async subscribeForAll() {
    const exchange= 'binance';
   const markets = await this.getValidMarkets(exchange);
    const res = markets.map((o) => {
      return this.subscribe(exchange, o);
    });
    return Promise.all(res);
  }

  statsSub: Subject<string> = new Subject();

  getAllSubscriptions(): Observable<{ exchange: string, market: string, candles: VOCandle[] }>[] {
    const candles: CandlesData[] = Object.values(this.collection);
    let out = [] = [];

    candles.forEach(function (o) {
      out = out.concat(o.getAllSubscriptions());
    });
    return out;
  }

  async subscribe(exchange: string, market: string): Promise<Observable<{ exchange: string, market: string, candles: VOCandle[] }>> {
    let ctr: CandlesData = this.collection[exchange];
    if (!ctr) {
      ctr = new CandlesData(
        this.apisPublic.getExchangeApi(exchange),
        this.storage,
        this.candlesInterval,
        this.canlesLength,
        this.overlap
      );

       ctr.statsSub.subscribe(stats => {
        this.statsSub.next(stats);
      })
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
    if (!ctr) return null;
    const data = ctr.getCandles(market);
    if (!data) return this.apisPublic.getExchangeApi(exchange).downloadCandles(market, this.candlesInterval, this.canlesLength);
    return data;
  }

  stop() {
    Object.values(this.collection).forEach(function (o) {
      o.destroy();
    });
    this.collection= {};
  }
}