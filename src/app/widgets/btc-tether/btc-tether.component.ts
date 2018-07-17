import { Component, OnInit } from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOMarketCap} from '../../models/app-models';

@Component({
  selector: 'app-btc-tether',
  templateUrl: './btc-tether.component.html',
  styleUrls: ['./btc-tether.component.css']
})
export class BtcTetherComponent implements OnInit {

  btcMC:VOMarketCap = new VOMarketCap();
  usdtMC:VOMarketCap = new VOMarketCap();
  constructor(
    private marketCap: ApiMarketCapService
  ) { }

  ngOnInit() {
    this.initAsync();
  }

  async initAsync(){
    const MC =  await this.marketCap.getData();
    this.btcMC = MC['BTC'];
    this.usdtMC = MC['USDT'];
  }



}
