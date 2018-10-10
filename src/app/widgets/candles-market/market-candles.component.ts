import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ApisPublicService} from '../../apis/apis-public.service';
import {VOCandle} from '../../models/api-models';

@Component({
  selector: 'app-market-candles',
  templateUrl: './market-candles.component.html',
  styleUrls: ['./market-candles.component.css']
})
export class MarketCandlesComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;
  myCandles: VOCandle[];
  volumes: number[];
  interval = '30m';

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
    this.apisPublic.getExchangeApi(this.exchange).downloadCandles(this.market, this.interval, 200)
      .then(res=>{
      this.myCandles = res;
      this.volumes = res.map(function (o) {
        return o.open > o.close?-o.Volume:o.Volume;
      })
    })
  }

  onGoClick(){
    this.downloadCandles();
  }
}
