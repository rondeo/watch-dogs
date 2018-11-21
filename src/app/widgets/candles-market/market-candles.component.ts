import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {VOCandle} from '../../models/api-models';

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
    private apisPublic: ApisPublicService
  ) { }

  ngOnInit() {
  }

  ngOnChanges(){
      this.downloadCandles();
  }

  downloadCandles(){
    if(!this.exchange || ! this.market) return;

    this.apisPublic.getExchangeApi(this.exchange).downloadCandles(this.market, this.candlesInterval, 200)
      .then(candles=>{
        if(!candles){
          this.candles = null;
          this.volumes = null;
          return;
        }
      this.candles = candles;
        this.volumes = candles.map(function (o) {
          return o.open > o.close ? -o.Volume : o.Volume;
        });
    })


    if(this.inBrowser) {
      const url = 'https://www.binance.com/en/trade/pro/' + this.market.split('_').reverse().join('_');//   api.getMarketUrl(ar[0], ar[1]);
      window.open(url, this.exchange);
    }
  }

  onCandlesIntrvalChange() {
    this.downloadCandles();
  }

}
