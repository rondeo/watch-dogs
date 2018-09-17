import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {VOCandle} from '../../models/api-models';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';

import {ApisPublicService} from '../../apis/apis-public.service';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-live-trader',
  templateUrl: './live-trader.component.html',
  styleUrls: ['./live-trader.component.css']
})
export class LiveTraderComponent implements OnInit {

  exchange: string;
  market: string;

  lasts: number[];
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
      const lasts = res.map(function (item) {
        return Math.round(item.close * 1e8);
      });

      this.lasts = lasts;
      this.candles = res;
      setTimeout(() => {
        this.isRquesting = false;
      }, 500);

    }, err => {
      this.isRquesting = false;
      this.snackBar.open('Error communication', 'x', {extraClasses: 'error'})
    })
  }

}
