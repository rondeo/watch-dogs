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
import * as moment from 'moment';

@Injectable()
export class CandlesService {
  collection: { [id: string]: CandlesData } = {};
  candlesInterval = '1m';
  canlesLength = 240;
  overlap = 20;
  first20coins = 'BTC,ETH,TUSD,PAX';//'ETH,LTC,EOS,XRP,BCH,BNB,ADA,NXT,TRX,DOGE,DASH,XMR,XEM,ETC,NEO,ZEC,OMG,XTZ,VET,XLM';
  deadMarkets = 'VEN,BCN,HSR,ICN,TRIG,CHAT,RPX';
  candlesDatas: CandlesData[];

  // userExclude = 'BCN,STORM,GRS,SC,DENT,NPXS,NCASH,PAX,BCC,FUN,TUSD,HOT,AMB,TRIG';

  candlesSub: Subject<{ exchange: string, market: string, candles: VOCandle[] }> = new Subject<{ exchange: string, market: string, candles: VOCandle[] }>()

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService
  ) {
  }

  async init() {
    const subscribed = (await this.storage.select('subscribed-candles')) || [];
    this.candlesDatas = subscribed.map((item: { exchange: string, markets: string[], interval: string }) => {
      const ctr = new CandlesData(
        this.apisPublic.getExchangeApi(item.exchange),
        this.storage,
        item.interval
      );
      ctr.candlesSub.subscribe(data => {
        this.candlesSub.next(data);
      });
      item.markets.forEach(function (market) {
        ctr.subscribe(market);
      })
      return ctr;
    })
  }

  timeout;

  saveSubscribed() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      const data = this.candlesDatas.map(function (item) {
        return {
          exchange: item.exchange,
          markets: item.subscribedMarkets,
          interval: item.candlesInterval
        }
      })

      this.storage.upsert('subscribed-candles', data);
    }, 5000)
  }

  async downloadCandles(exchange: string, markets: string[], i, candlesInterval: string, canlesLength: number, sub: Subject<any>) {
    i++;
    if (i >= markets.length) {
      this.currentTimeout = 0;
      sub.complete();
      return;
    }
    const market = markets[i];
    const api = this.apisPublic.getExchangeApi(exchange);
    let candles = await api.downloadCandles(market, candlesInterval, canlesLength);
    candles.forEach(function (item) {
      item.time = moment(item.to).format('HH:mm');
    });
    candles = await this.saveNewCandles(exchange, market, candlesInterval, candles);
    sub.next({exchange, market, candles});
    this.currentTimeout = setTimeout(() => this.downloadCandles(exchange, markets, i, candlesInterval, canlesLength, sub), 2000);

  }

  async saveNewCandles(exchange: string, market: string, candlesInterval: string, newCandles: VOCandle[]) {
    const id = exchange + market + candlesInterval;

    let oldCandels: VOCandle[] = await this.storage.select(id);
    let candles;
    if (oldCandels) {
      const first = _.first(newCandles);
      oldCandels = oldCandels.filter(function (o) {
        return o.to < first.to
      });
      candles = oldCandels.concat(newCandles);
      candles = _.takeRight(candles, 120);
    } else candles = newCandles;

    await this.storage.upsert(id, candles);
    return candles;
  }

  currentTimeout;
  scanOnce(candlesInterval: string, canlesLength: number) {
    const exchange = 'binance';
    console.log(moment().format('HH:mm') + ' scan');
    if (this.currentTimeout) throw new Error('scan in process');

    this.currentTimeout = 1;
    const sub: Subject<any> = new Subject<any>();
    this.getValidMarkets(exchange).then(markets => {
      const i = -1;
      this.downloadCandles(exchange, markets, i, candlesInterval, canlesLength, sub);
    });

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
    if (!!ctr) return ctr.removeCandles(market);
  }

  async getValidMarkets(exchange) {
    const data = await this.apisPublic.getExchangeApi(exchange).getMarkets();
    let markets = Object.keys(data);
    markets = markets.filter(function (o) {
      return o.indexOf('BTC') === 0;
    });

    const userExclude = (this.deadMarkets + ',' + this.first20coins).split(',').map(function (o) {
      return 'BTC_' + o;
    });

    const runtimeExclude = await this.storage.select('exclude-markets-' + exchange);
    markets = _.difference(markets, userExclude);

    markets = _.difference(markets, _.map(runtimeExclude, 'market'));

    /* const preference =  ((await this.storage.select('markets-favorite')) || []).map(function (o) {
       return o.market;
     });

     markets = preference.concat(markets);
     markets = _.uniq(markets);*/
    return markets;

  }

  /*async subscribeForAll() {
    const exchange= 'binance';
   const markets = await this.getValidMarkets(exchange);
    const res = markets.map((o) => {
      return this.subscribe(exchange, o);
    });
    return Promise.all(res);
  }
*/
  statsSub: Subject<string> = new Subject();

  getAllSubscriptions(): Observable<{ exchange: string, market: string, candles: VOCandle[] }>[] {
    const candles: CandlesData[] = Object.values(this.collection);
    let out = [] = [];

    candles.forEach(function (o) {
      out = out.concat(o.getAllSubscriptions());
    });
    return out;
  }

  subscribe(exchange: string, market: string, candlesInterval: string): Observable<{ exchange: string, market: string, candles: VOCandle[] }> {
    let cdata: CandlesData = _.find(this.candlesDatas, {exchange: exchange, candlesInterval: candlesInterval});
    if (cdata) cdata.subscribe(market);
    else {
      cdata = new CandlesData(
        this.apisPublic.getExchangeApi(exchange),
        this.storage,
        candlesInterval
      );
      cdata.subscribe(market);
      cdata.candlesSub.subscribe(data => {
        this.candlesSub.next(data);
      })
    }

    return this.candlesSub.asObservable();
  }

  unsubscribe(exchange: string, market: string, interval: string) {
    let ctr: CandlesData = this.collection[exchange];
    ctr.subscribe(market);
  }

  async getCandles(exchange: string, market: string, candlesInterval: string) {
    const id = exchange + market + candlesInterval;
    let candles = await this.storage.select(id);
    return candles;
    /* if(candles) {
       return candles;
     }
     const api = this.apisPublic.getExchangeApi(exchange);
     candles = await api.downloadCandles(market, candlesInterval, 120);
     return this.saveNewCandles(exchange, market, this.candlesInterval, candles);*/
  }

  stop() {
    clearInterval(this.currentTimeout);
    this.currentTimeout = 0;
    /* Object.values(this.collection).forEach(function (o) {
       o.destroy();
     });
     this.collection= {};*/
  }
}
