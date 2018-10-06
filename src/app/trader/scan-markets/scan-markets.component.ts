import {Component, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {VOMarketCap} from '../../models/app-models';
import {VOCandle} from '../../models/api-models';
import {MATH} from '../../com/math';
import * as _ from 'lodash';
import {MatSnackBar} from '@angular/material';
import * as moment from 'moment';
import {StorageService} from '../../services/app-storage.service';

@Component({
  selector: 'app-scan-markets',
  templateUrl: './scan-markets.component.html',
  styleUrls: ['./scan-markets.component.css']
})
export class ScanMarketsComponent implements OnInit {

  coin: string;
  exchange: string = 'binance';
  market: string;

  lastVolume: number;
  medianVolume: number;
  meanVolume: number;
  lastHighPrice: number;
  maxPrice: number;
  coinsAvailable: VOMarketCap[];

  notifications: any[];

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private snackBar: MatSnackBar,
    private storage: StorageService
  ) {
  }

  ngOnInit() {
    this.initAsync();
  }
  downloadNext(i) {
    i++;
    if (i >= this.coinsAvailable.length) i = 0;
    const coin = this.coinsAvailable[i];
    this.coin = coin.symbol;

    this.market = 'BTC_' + coin.symbol;
    this.downloadCandles(this.market);
    setTimeout(() => {
      this.downloadNext(i)
    }, 30000)
  }

  async initAsync() {
    this.notifications = await this.storage.select('scan-notifications') || [];
    const MC = await this.marketCap.getTicker();
    const from100_200 = Object.values(MC).filter(function (o) {
      return o.rank > 100 && o.rank < 200;
    });
    // console.log(from100_200);

    const api = this.apisPublic.getExchangeApi('binance');
    const allMarkets = await api.getMarkets();
    // console.log(allMarkets);

    const available = from100_200.filter(function (o) {
      return !!allMarkets['BTC_' + o.symbol];
    });

    // console.log(available);
    this.coinsAvailable = available;
    this.downloadNext(-1);

  }

  async downloadCandles(market: string) {
    const api = this.apisPublic.getExchangeApi(this.exchange);
    const candles = await api.downloadCandles(market, '30m', 200);
    // console.log(candles);
    console.log(moment().format('HH:mm') + market);
    this.analyze(candles);
  }

  openLink(msg: string, isRed = false) {
    msg = this.market + '  ' + msg;
    const color = isRed ? 'red' : '';
    const ref = this.snackBar.open(msg, 'OPEN', {duration: 15000, extraClasses: color});
    ref.onAction().subscribe(() => {
      const api = this.apisPublic.getExchangeApi(this.exchange)
      const ar = this.market.split('_');
      const url = api.getMarketUrl(ar[0], ar[1]);
      window.open(url, this.exchange);
    });
  }

  notify(data: any) {

    const notifications =  this.notifications;
    notifications.unshift(data);
    this.notifications = notifications;
    if (notifications.length > 200) notifications.pop();

    this.storage.upsert('scan-notifications', notifications)


  }

  analyze(candles: VOCandle[]) {
    const n = candles.length;
    const last = _.last(candles);

    const sortedVol = _.orderBy(candles, 'Volume').reverse();

    const volInd = sortedVol.indexOf(last);

    const prelast = candles[n - 2];
    if ((last.to - last.from) !== (prelast.to - prelast.from)) console.error(' not full last ', last, prelast)


    const vols = candles.map(function (o) {
      return o.Volume;
    });

    const closes = candles.map(function (o) {
      return o.close;
    });

    const lastHigh = last.high;
    const lastV = last.Volume;

    const maxPrice = _.max(closes);

    const medV = MATH.median(vols);
    const meanV = _.mean(vols);

    let msg = '';
    let isRed = false;
    this.lastHighPrice = lastHigh;
    this.maxPrice = MATH.percent(lastHigh, maxPrice);

    this.meanVolume = MATH.percent(lastV, meanV);
    this.medianVolume = MATH.percent(lastV, medV);

    this.lastVolume = lastV;

    if (lastHigh >= maxPrice && lastV > meanV) {
      isRed = true;
      const market = this.market;
      const time = moment().format('HH:mm');
      const volumeD = this.meanVolume;
      const volumeMedD = this.medianVolume;
      const priceD = this.maxPrice;
      this.notify( {time, market, volInd, volumeD, volumeMedD, priceD});
     // console.log(lastHigh, lastV);
     // console.log(maxPrice, medV, meanV);
    }
   //  this.openLink(msg, isRed)

    /*const percent = MATH.percent(lastV, medV);
    console.log(percent);


    if (percent > 200) {
      const sorted = _.orderBy(candles, 'Volume').reverse();

      const lastCandle = candles[n - 2];

      const index = sorted.indexOf(lastCandle);
      const o_c = lastCandle.close - lastCandle.open;
      const h_l = lastCandle.high - lastCandle.low;

      const percUP = MATH.percent(lastCandle.close, lastCandle.open);
      const body = Math.abs(MATH.percent(Math.abs(o_c), h_l));

      console.log(percUP, body, index);

    }*/
  }

  onCoinSelected(coin: VOMarketCap) {
    const symbol = coin.symbol;
    this.coin = symbol;
    this.market = 'BTC_' + symbol;
    this.downloadCandles(this.market);

  }

  onMarketClick() {
    const api = this.apisPublic.getExchangeApi(this.exchange)
    const ar = this.market.split('_');
    const url = api.getMarketUrl(ar[0], ar[1]);
    window.open(url, this.exchange);
  }

  candles: VOCandle[];

  volumes: number[];
  onDatasetClick(obj){


    const item = obj.item;
    const prop = obj.prop;
    const market = item.market;
    if(prop == 'priceD') this.notifications = _.reject(this.notifications, {market:market});
    if(prop === 'market'){
      // console.log(candles);
      // console.log(market);

      const api = this.apisPublic.getExchangeApi(this.exchange)
      api.downloadCandles(market, '30m', 200).then(res => {
      //  console.log(res);
        this.candles = res;
        this.volumes = res.map(function (o) {
          return o.open >o.close?-o.Volume:o.Volume;
        })

      });
      const ar = market.split('_');
      const url = api.getMarketUrl(ar[0], ar[1]);
      window.open(url, this.exchange);

    }



    console.log(item, prop);

  }

}
