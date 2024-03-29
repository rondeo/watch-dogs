import {Component, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../../a-core/apis/api-market-cap.service';
import {VOAlert, VOMarketCap, VOOrder} from '../../../amodels/app-models';
import * as moment from 'moment';
import * as _ from 'lodash';
import {ApisPublicService} from '../../../a-core/apis/api-public/apis-public.service';

import {StorageService} from '../../../a-core/services/app-storage.service';

import {VOCandle} from '../../../amodels/api-models';

import {BtcUsdtService} from '../../../a-core/app-services/alerts/btc-usdt.service';
import {MatSnackBar} from '@angular/material';
import {filter, map} from 'rxjs/operators';

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
    private snackBar: MatSnackBar,
    private marketCap: ApiMarketCapService
  ) {

  }

  ngOnInit() {
    this.btcMC$ = this.marketCap.ticker$()
      .pipe(
        filter(obj => !!obj),
        map(OBJ => OBJ['BTC'] )
      );
    this.usdtMC$ = this.marketCap.ticker$()
      .pipe(
        filter(obj => !!obj),
        map(OBJ => OBJ['USDT'] )
      );

/*   /!* this.btcMC$ = this.btcusdt.btcMC$
      .pipe(
        map(res => {
          console.log(res);
          return res
        })
      );*!/
    this.usdtMC$ = this.btcusdt.usdtMC$;*/
    this.btcusdt.alertSub$.subscribe(alert => {
      const message = 'BTC ' + alert.PD + ' ' + alert.P + ' V ' + alert.VD + ' ' + alert.trades.toString();
      this.snackBar.open(message, 'x', {panelClass: 'error'});
    });
  }

}
