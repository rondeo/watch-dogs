import {Component, Input, OnChanges, OnInit} from '@angular/core';

import {VOMarketCap} from '../../../amodels/app-models';
import {ApiMarketCapService} from '../../../adal/apis/api-market-cap.service';
import {Observable} from 'rxjs/internal/Observable';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-mc-data',
  templateUrl: './mc-data.component.html',
  styleUrls: ['./mc-data.component.css']
})
export class McDataComponent implements OnChanges {

  @Input() coin: string;
  coinMC$: Observable<VOMarketCap>;

  constructor(
    private marketCap: ApiMarketCapService
  ) {
  }

  ngOnChanges(evt) {
    if (!this.coin) this.coinMC$ = null;
    else this.coinMC$ = this.marketCap.ticker$().pipe(map(MC => MC ? MC[this.coin] : null));
  }

}
