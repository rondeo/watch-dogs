import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChange} from '@angular/core';
import * as  moment from 'moment';
import {VOLineGraph} from '../../ui/line-graph/line-graph.component';
import {ApisPublicService} from '../../apis/apis-public.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {VOCandleMin, VOGraphs} from '../../ui/candlesticks/candlesticks.component';
import {MatSnackBar} from '@angular/material';
import {VOCandle} from '../../models/api-models';

@Component({
  selector: 'app-coin-candles',
  templateUrl: './coin-candles.component.html',
  styleUrls: ['./coin-candles.component.css']
})
export class CoinCandlesComponent implements OnInit, OnChanges, OnDestroy {

  @Input() market: string;
  @Input() exchange: string;

  @Output() candles: EventEmitter<VOCandle[]>  = new EventEmitter()

  myGraps: VOGraphs;
  private interval;
  isRquesting = false;

  constructor(
    private apiPublic: ApisPublicService,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnChanges(evt: { [val: string]: SimpleChange }) {
    // this.showExchanges();
    this.getData();
  }

  ngOnInit() {

    // this.showExchanges();
  }

  getData() {
    clearInterval(this.interval);
    this.isRquesting = true;
    this.interval = setInterval(() => this.getData(), 60 * 1000);
    const api: ApiPublicAbstract = this.apiPublic.getExchangeApi(this.exchange);
    if (!api) throw new Error(' no api for ' + this.exchange);;

    const ar = this.market.split('_');
    api.getCandlesticks(ar[0], ar[1]).then(res => {

      this.candles.emit(res);
      const candles: VOCandleMin[] = res.map(function (item) {
        return {
          c: item.close,
          h: item.high,
          l: item.low,
          o: item.open,
          t: item.from,
          v: item.Volume
        };
      });
      setTimeout(() => {
        this.isRquesting = false;
      }, 500);
      this.myGraps = {
        labelsX: null,
        candles: candles
      }
    }, err => {
      this.isRquesting = false;
      this.snackBar.open('Error communication', 'x', {extraClasses: 'error'})
    })
  }

  ngOnDestroy() {
    clearInterval(this.interval)
  }


  onRefreshClick() {
    this.getData();
  }

  onMarketClick() {
    const api: ApiPublicAbstract = this.apiPublic.getExchangeApi(this.exchange);
    if (!api) return;
    const ar = this.market.split('_');
    const url = api.getMarketUrl(ar[0], ar[1]);
    window.open(url, this.exchange);
  }

}
