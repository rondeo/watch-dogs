import { Component, OnInit } from '@angular/core';
import {HitBtcService, VOHitBtc} from '../services/hit-btc.service';

@Component({
  selector: 'app-hit-btc-market',
  templateUrl: './hit-btc-market.component.html',
  styleUrls: ['./hit-btc-market.component.css']
})
export class HitBtcMarketComponent implements OnInit {

  marketsAr:VOHitBtc[];

  constructor(private service:HitBtcService) { }

  ngOnInit() {

    this.service.getMarkets().subscribe(res=>{
      this.marketsAr = res
    })
  }

}
