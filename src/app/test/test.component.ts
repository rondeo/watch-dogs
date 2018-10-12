import { Component, OnInit } from '@angular/core';
import {BtcUsdtService} from '../app-services/alerts/btc-usdt.service';
import {VOCandle} from '../models/api-models';
import * as _ from 'lodash';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {

  candles: VOCandle[];
  constructor(
    private alerts: BtcUsdtService
  ) {

  }

  ngOnInit() {
   this.initAsync();
  }

  async initAsync() {
    (await this.alerts.oneMinuteCandles$()).subscribe(candles =>{

      this.candles = _.clone(candles);
    })
  }

  onStopClick() {
    this.alerts.stop();
  }
}
