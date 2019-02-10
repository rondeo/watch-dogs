import {Component, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {VOMarketCap} from '../../amodels/app-models';
import {MarketCapService} from '../services/market-cap.service';
import {StorageService} from '../../adal/services/app-storage.service';

import {ApiMarketCapService} from '../../adal/apis/api-market-cap.service';
import {ActivatedRoute, Router} from '@angular/router';


@Component({
  selector: 'app-selected-coins',
  templateUrl: './selected-coins.component.html',
  styleUrls: ['./selected-coins.component.css']
})
export class SelectedCoinsComponent implements OnInit {
  selectedCoins: any[] = [];
  private allCoinsData: any[];

  constructor(
    private marketCap: ApiMarketCapService,
    private storage: StorageService,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.initAsync();
  }

  async initAsync() {
    this.allCoinsData = await this.marketCap.getCoinsArWithSelected();

    this.selectedCoins = this.allCoinsData.filter(function (item) {
      return item.selected;
    });
  }

  onSymbolSelected(evt) {
    console.log(evt);
    this.router.navigateByUrl('/trader/analyze-coin/' + evt);

  }


}
