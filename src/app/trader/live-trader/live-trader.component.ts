import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {VOCandle} from '../../models/api-models';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';

import {ApisPublicService} from '../../apis/apis-public.service';
import {MatSnackBar} from '@angular/material';
import {VOOrder} from '../../models/app-models';
import {EnumOverlay} from '../../ui/candlesticks/candlesticks.component';
import * as moment from 'moment';

@Component({
  selector: 'app-live-trader',
  templateUrl: './live-trader.component.html',
  styleUrls: ['./live-trader.component.css']
})

export class LiveTraderComponent implements OnInit {

  exchange: string;
  market: string;

  closes: number[];
  highs: number[];
  lows: number[];

  refreshSignal:number;

  overlays:EnumOverlay[] = [];

  candles: VOCandle[];

  constructor(
    private route: ActivatedRoute,
    private apiPublic: ApisPublicService,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit() {

    this.route.params.subscribe(params => {
      this.exchange = params.exchange;
      this.market = params.market;
      console.log(params);
      this.getData();
    })

  }

  interval
  isRquesting = false;

  getData() {
    clearInterval(this.interval);
    this.isRquesting = true;
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
        this.isRquesting = false;
      }, 500);

    }, err => {
      this.isRquesting = false;
      this.snackBar.open('Error communication', 'x', {extraClasses: 'error'})
    });

   /* api.downloadMarketHistory(ar[0], ar[1]).subscribe(res =>{
     this.ordersHistory = res;
    })*/
  }
  onResSupChange(evt){
    const ar = this.overlays.slice(0);
    const ind= ar.indexOf(EnumOverlay.SUPPORT_RESISTANCE);
    if(evt.checked && ind === -1){

    ar.push(EnumOverlay.SUPPORT_RESISTANCE)
      this.overlays = ar;
    } else {
      if(ind !== -1) ar.splice(ind, 1)
    }
    this.overlays = ar;
  }

}
