import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {ApisPublicService} from '../../../adal/apis/api-public/apis-public.service';
import {VOCandle} from '../../../amodels/api-models';
import {DialogInputComponent} from '../../material/dialog-input/dialog-input.component';
import {MatDialog} from '@angular/material';
import * as _ from 'lodash';
import {StorageService} from '../../../adal/services/app-storage.service';
import * as  moment from 'moment';
import {FavoritesService} from '../../../adal/app-services/favorites.service';
import {CandlesAnalys1} from '../../../adal/app-services/scanner/candles-analys1';
import {MACDOutput} from '../../../trader/libs/techind/moving_averages/MACD';

@Component({
  selector: 'app-market-candles',
  templateUrl: './market-candles.component.html',
  styleUrls: ['./market-candles.component.css']
})
export class MarketCandlesComponent implements OnInit, OnChanges {

  @Input() candlesInterval = '15m';
  @Input() exchange: string;
  @Input() market: string;
  @Output() onCandles: EventEmitter< VOCandle[]> = new EventEmitter<VOCandle[]>();
  @Output() onStochRSI: EventEmitter< { stochRSI: number; k: number; d: number }[]> = new EventEmitter();
  @Output() onMACD: EventEmitter< MACDOutput[]> = new EventEmitter();
  candles:VOCandle[];
  volumes: number[];
  closes: number[];

  inBrowser = false;

  constructor(
    private apisPublic: ApisPublicService

  ) {
  }

  ngOnInit() {
  }

  ngOnChanges() {
    this.downloadCandles();
  }

  onStarClick(){
    if(!this.market) return;
   // this.favorites.addMarket(this.market);
  }

  downloadCandles() {
    if (!this.exchange || !this.market) return;

    this.apisPublic.getExchangeApi(this.exchange).downloadCandles(this.market, this.candlesInterval, 200)
      .then(candles => {
        this.onCandles.emit(candles);
        if (!candles) {
          this.candles = null;
          this.volumes = null;
          return;
        }
        this.candles = candles;
        this.closes = CandlesAnalys1.closes(candles);
        this.volumes = candles.map(function (o) {
          return o.open > o.close ? -o.Volume : o.Volume;
        });
      });
    if (this.inBrowser) {
      const url = this.apisPublic.getExchangeApi(this.exchange).getMarketUrl2(this.market);
      // const url = 'https://www.binance.com/en/trade/pro/' + this.market.split('_').reverse().join('_');
      //   api.getMarketUrl(ar[0], ar[1]);
      window.open(url, this.exchange);
    }
  }

  onCandlesIntrvalChange() {
    this.downloadCandles();
  }

  onStochRsi($event: { stochRSI: number; k: number; d: number }[]) {
    this.onStochRSI.emit($event)
  }

  onMacd($event: MACDOutput[]) {
    this.onMACD.emit($event);
  }
}
