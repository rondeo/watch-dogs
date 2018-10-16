import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {VOCandle} from '../../models/api-models';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';

import {ApisPublicService} from '../../apis/apis-public.service';
import {MatSnackBar} from '@angular/material';
import {VOOrder, VOOrderExt} from '../../models/app-models';
import {EnumOverlay} from '../../ui/candlesticks/candlesticks.component';
import * as moment from 'moment';
import * as _ from 'lodash';
import {MarketsHistoryService} from '../../app-services/market-history/markets-history.service';
import {Subscription} from 'rxjs/Subscription';
import {TradesHistoryService} from '../../app-services/tests/trades-history.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {StorageService} from '../../services/app-storage.service';
import {CandlesService} from '../../app-services/candles/candles.service';

@Component({
  selector: 'app-live-trader',
  templateUrl: './live-trader.component.html',
  styleUrls: ['./live-trader.component.css']
})

export class LiveTraderComponent implements OnInit, OnDestroy {

  exchange: string;
  market: string;

  closes: number[];
  highs: number[];
  lows: number[];
  refreshSignal: number;
  overlays: EnumOverlay[] = [];

  candles: VOCandle[];

  fishes:VOOrderExt[] =[];

  volumes: number[];

  triggers1: number[];

  alerts:{exchange:string, market:string, name: string, value1:string, value2:string}[] = [];

  constructor(
    private route: ActivatedRoute,
    private apiPublic: ApisPublicService,
    private snackBar: MatSnackBar,
    private marketsHistory: MarketsHistoryService,
   private candleService: CandlesService,
   // private tradesHistoryService: TradesHistoryService,
    private marketCap: ApiMarketCapService,
    private storage: StorageService
  ) {
  }

  ngOnInit() {

    this.route.params.subscribe(params => {
      this.exchange = params.exchange;
      this.market = params.market;
      console.log(params);
     //  this.getData();
    });
    this.subscribe();

  }

  ngOnDestroy() {
    this.unsubscribe();
  }

  interval
  isRequesting = false;

  sub1: Subscription;
  sub2: Subscription;
  sub3: Subscription;

  subscribe() {
    const ar = this.market.split('_');

    /*const hist = this.candleService.getCandlesHist(this.exchange, this.market);
    hist.candles$().subscribe(candles=>{
      if(!candles) return;
      //console.log(' NEW CANDLES ', _.last(candles));
      this.candles = _.clone(candles);

      this.volumes = candles.map(function (item) {
        return  item.close > item.open?item.Volume: -item.Volume;

      });
      this.drawSignals();
    });
*/


    const ctr = this.marketsHistory.getOrdersHistory(this.exchange, this.market);

    this.sub1 = ctr.ordersVolumeAlerts$(20).subscribe(diff => {
      // console.warn('diff  ', diff);
      this.snackBar.open(' Volume '+ this.exchange +' ' + this.market + ' ' + diff + '%', 'x')
    });
    this.marketCap.getTicker().then(MC=>{
      const coinPrice = MC[ar[1]].price_usd;
      const coinAmount = 20000 / coinPrice;


       this.sub3 = ctr.sharksHistory$(200).subscribe(res=>{
         if(!res) return;
        // console.log(' sharksHistory$ ',res);
         this.fishes = _.clone(res).reverse();
         this.drawSignals();

       });

      this.sub2 = ctr.sharksAlert$(coinAmount).subscribe(orders=>{
        console.log('new fishes ', orders);
        //  this.drawSignals();
       // this.fishes = _.uniqBy(this.fishes.reverse().concat(orders).reverse().slice(0,100), 'uuid');
        // this.storage.upsert('fishes', this.fishes);

      })
    })
  }

  async drawSignals(){
    const candles = this.candles;
    let fishes: VOOrderExt[] = _.clone(this.fishes).reverse();

    if(!fishes.length || ! candles.length) return;
    const startTime = candles[0].to;
    const length = candles.length;
    let endTime =  _.last(candles).to;
    fishes = fishes.filter(function (item) {
      return item.timestamp > startTime;
    });

    const lastFishTime = _.last(fishes).timestamp;

    if(lastFishTime > endTime) endTime = lastFishTime;

    const step = (endTime - startTime)/length;
    endTime+=step;
    const ordersAr = [];
    for(let i = startTime; i< endTime; i+=step){
      const fAr = [];
      while(fishes.length && fishes[0].timestamp < i)fAr.push(fishes.shift());
      ordersAr.push(fAr);
    }
    const signals = ordersAr.map(function (far) {
      let val = 0;
      if(!far.length) return 0;
      far.forEach(function (item) {
        if (item.action === 'BUY') val+=item.amountUS;
        else val -= item.amountUS;
      });
      return val;
    });
    console.log(_.last(signals));
    this.triggers1 = signals;
  }

  unsubscribe() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub1.unsubscribe();
  }

  /*getData() {
    clearInterval(this.interval);
    this.isRequesting = true;

    this.interval = setInterval(() => this.getData(), 60 * 1000);

    const api: ApiPublicAbstract = this.apiPublic.getExchangeApi(this.exchange);
    if (!api) throw new Error(' no api for ' + this.exchange);


    const ar = this.market.split('_');
    api.getCandlesticks(ar[0], ar[1], 100).then(res => {
      const highs = [];
      const closes = [];
      const lows = [];
      res.forEach(function (item) {
        closes.push(Math.round(item.close * 1e8));
        lows.push(Math.round(item.low * 1e8));
        highs.push(Math.round(item.high * 1e8));
      });

      this.closes = closes;
      this.highs = highs;
      this.lows = lows;
      this.candles = res;
      setTimeout(() => {
        this.isRequesting = false;
      }, 500);

    }, err => {
      this.isRequesting = false;
      this.snackBar.open('Error communication', 'x', {extraClasses: 'error'})
    });

    /!* api.downloadMarketHistory(ar[0], ar[1]).subscribe(res =>{
      this.ordersHistory = res;
     })*!/
  }*/

  onResSupChange(evt) {
    const ar = this.overlays.slice(0);
    const ind = ar.indexOf(EnumOverlay.SUPPORT_RESISTANCE);
    if (evt.checked && ind === -1) {

      ar.push(EnumOverlay.SUPPORT_RESISTANCE)
      this.overlays = ar;
    } else {
      if (ind !== -1) ar.splice(ind, 1)
    }
    this.overlays = ar;
  }

}
