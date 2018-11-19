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
  }

  onCandlesIntrvalChange() {
    this.downloadCandles();
  }

}
