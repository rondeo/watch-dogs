import {Component, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOAlert, VOMarketCap, VOOrder} from '../../models/app-models';
import * as moment from 'moment';
import * as _ from 'lodash';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';

import {StorageService} from '../../services/app-storage.service';

import {VOCandle} from '../../models/api-models';

import {BtcUsdtService} from '../../app-services/alerts/btc-usdt.service';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-btc-tether',
  templateUrl: './btc-tether.component.html',
  styleUrls: ['./btc-tether.component.css']
})

export class BtcTetherComponent implements OnInit {
  btcMC$;
  usdtMC$;
  constructor(
    private btcusdt: BtcUsdtService,
    private snackBar: MatSnackBar

  ) {

  }

  ngOnInit() {
    this.btcMC$ = this.btcusdt.btcMC$;
    this.usdtMC$ = this.btcusdt.usdtMC$;
    this.btcusdt.alertSub.subscribe(alert => {
      this.snackBar.open(alert, 'x', {panelClass: 'error'});
    });
    this.btcusdt.start();
  }

}
