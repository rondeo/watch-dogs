import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {VOCandle} from '../../models/api-models';
import {DialogInputComponent} from '../../material/dialog-input/dialog-input.component';
import {MatDialog} from '@angular/material';
import * as _ from 'lodash';
import {StorageService} from '../../services/app-storage.service';
import * as  moment from 'moment';

@Component({
  selector: 'app-market-candles',
  templateUrl: './market-candles.component.html',
  styleUrls: ['./market-candles.component.css']
})
export class MarketCandlesComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;
  candles: VOCandle[];
  volumes: number[];
  candlesInterval = '1m';
  inBrowser = false;

  constructor(
    private apisPublic: ApisPublicService,
    private dialog: MatDialog,
    private storage: StorageService
  ) {
  }

  ngOnInit() {
  }

  ngOnChanges() {
    this.downloadCandles();
  }

  onStarClick(){
    const market = this.market + ' add to favorites';
    const ref = this.dialog.open(DialogInputComponent, {data: {message: market,}});
    const sub = ref.afterClosed().toPromise().then(res => {
      if (res) {
        const note = res.note;
        const date = moment().format('DD HH:mm');
        this.saveFavorites({date, market, note})
      }
    });

  }

  async saveFavorites(obj: {market: string, note:string, date: string}) {

    let data = (await this.storage.select('favorite-markets')) || [];
    data = data.filter(function (item) {
      return !!item.market && item.market !== obj.market;
    });
    data.unshift(obj);
    return this.storage.upsert('favorite-markets', data);
  }

  downloadCandles() {
    if (!this.exchange || !this.market) return;

    this.apisPublic.getExchangeApi(this.exchange).downloadCandles(this.market, this.candlesInterval, 200)
      .then(candles => {
        if (!candles) {
          this.candles = null;
          this.volumes = null;
          return;
        }

        this.candles = candles;
        this.volumes = candles.map(function (o) {
          return o.open > o.close ? -o.Volume : o.Volume;
        });
      });
    if (this.inBrowser) {
      const url = 'https://www.binance.com/en/trade/pro/' + this.market.split('_').reverse().join('_');
      //   api.getMarketUrl(ar[0], ar[1]);
      window.open(url, this.exchange);
    }
  }

  onCandlesIntrvalChange() {
    this.downloadCandles();
  }

}
