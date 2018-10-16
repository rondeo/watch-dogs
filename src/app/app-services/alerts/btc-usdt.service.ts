import {Injectable} from '@angular/core';
import * as moment from 'moment';
import {Observable} from 'rxjs/Observable';
import {VOCandle} from '../../models/api-models';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {VOAlert, VOMarketCap, VOOrder} from '../../models/app-models';
import * as _ from 'lodash';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {Subject} from 'rxjs/Subject';
import {MATH} from '../../com/math';

@Injectable()
export class BtcUsdtService {

  alertSub: Subject<string> = new Subject();


  oneMinuteCandlesSub: BehaviorSubject<VOCandle[]>;
  btcMC$: BehaviorSubject<VOMarketCap> = new BehaviorSubject(new VOMarketCap());
  usdtMC$: BehaviorSubject<VOMarketCap> = new BehaviorSubject(new VOMarketCap());

 //  startTime = '2018-10-10T19:30';
  count = 0;
  candlesStats: any[] = [];
  tradesStats: any[] = [];

  trades: VOOrder[] = [];

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private storage: StorageService
  ) {

  }

  async start(){
    this.init();
    await this.oneMinuteCandles$();
    this.interval = setInterval(() => {
      this.next()
    }, 30000);
  }

  init() {
    this.marketCap.ticker$().subscribe(MC => {
      MC['BTC']['time'] = moment(MC['BTC'].last_updated * 1000).format('LT')
      this.btcMC$.next(MC['BTC']);
      this.usdtMC$.next(MC['USDT']);
    });

    this.storage.select('trades-stats-bitfinex-usdt_btc').then(stats => {
      this.tradesStats = stats || [];
    });
  }

  stop() {
    clearInterval(this.interval);  }

  interval;

  async oneMinuteCandles$(): Promise<Observable<VOCandle[]>> {
    if (this.oneMinuteCandlesSub) return this.oneMinuteCandlesSub;
    const candles = await this.apisPublic
      .getExchangeApi('bitfinex').downloadCandles('USDT_BTC', '1m', 200);//, moment().valueOf());
    this.oneMinuteCandlesSub = new BehaviorSubject(candles);
    return this.oneMinuteCandlesSub;
  }

  lastcandlesStats: any;
  async next() {
     //const trades: VOOrder[] = await this.downlaodTrades();
    let candles: VOCandle[] = await this.downloadNewCandles();
    if(_.last(candles).Volume < candles[candles.length -2].Volume)
    candles = candles.slice(0, -1);
    const last3: VOCandle[] = _.takeRight(candles, 3);

    const volumes = _.map(candles, 'Volume');
    const medV = MATH.median(volumes);

    const lastV = (last3[0].Volume + last3[1].Volume + last3[2].Volume) / 3;

    const PV3 = MATH.percent(lastV, medV);

    if(this.lastcandlesStats === PV3) return;
    this.lastcandlesStats = PV3;
    const startPrice = last3[0].open;
    const endPrice = last3[2].close;
    const PD3 = MATH.percent(endPrice, startPrice);

    if (PD3 < -0.3) this.alertSub.next(' BTC ' + PD3 + '% ' + 'V: ' + PV3);
    else if(PV3 > 10000) this.alertSub.next(' BTC ' + PD3 + '% ' + 'V: ' + PV3);

    this.candlesStats.push({PV3,PD3});
    if(this.candlesStats.length > 200)this.candlesStats.shift();
    this.storage.upsert('candlesStats', this.candlesStats);

    if(this.tradesStats.length > 200) this.tradesStats.shift();
    this.storage.upsert('test-trades', this.tradesStats);

   //  console.log('PD3 ' + PD3 + ' PV3  ' + PV3);



    //console.log(trades, candles);
  }

  async downlaodTrades() {
    const trades: VOOrder[] = await this.apisPublic.getExchangeApi('bitfinex')
      .downloadMarketHistory('USDT', 'BTC').toPromise();
   /* const from = trades[0].timestamp;
    const oldTrades = this.trades.filter(function (o) {
      return o.timestamp < from;
    });
    this.trades = _.takeRight(oldTrades.concat(trades), 500);*/
    return trades;
  }

  async getMinuteCandles(): Promise<VOCandle[]> {
    return Promise.resolve(this.oneMinuteCandlesSub.getValue())
  }

  async downloadNewCandles() {
    this.count++;
    let oldcandles: VOCandle[] = await this.getMinuteCandles();
    const newcandles: VOCandle[] = await this.apisPublic.getExchangeApi('bitfinex')
      .downloadCandles('USDT_BTC', '1m', 2);//, moment(this.startTime).add(this.count, 'minutes').valueOf());

    //console.log(newcandles);
    newcandles.forEach(function (o) {
      o.time = moment(o.to).format('HH:mm');
    });
    const t = newcandles[0].to;
    // console.log(oldcandles.length);
    oldcandles = oldcandles.filter(function (o) {
      return o.to < t;
    });
    //  console.log(oldcandles.length);

    const candles = _.takeRight(oldcandles.concat(newcandles), 200);
    // console.log(candles.length);
    this.oneMinuteCandlesSub.next(candles);
    return candles;
  }


}
