import { Component, OnInit } from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOMarketCap} from '../../models/app-models';
import * as moment from 'moment';

@Component({
  selector: 'app-btc-tether',
  templateUrl: './btc-tether.component.html',
  styleUrls: ['./btc-tether.component.css']
})
export class BtcTetherComponent implements OnInit {

  btcMC:VOMarketCap = new VOMarketCap();
  usdtMC:VOMarketCap = new VOMarketCap();
  date: string;
  constructor(
    private marketCap: ApiMarketCapService
  ) { }

  ngOnInit() {
    this.marketCap.ticker$().subscribe(MC =>{
      this.btcMC = MC['BTC'];
      this.usdtMC = MC['USDT'];
      this.date = moment(this.btcMC.last_updated * 1000).format('LT');
    })
  }





}
