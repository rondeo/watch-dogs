import {Component, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {VOMarketCap} from '../../models/app-models';
import {MarketCapService} from '../services/market-cap.service';
import {StorageService} from '../../services/app-storage.service';
import {VOMC} from '../../apis/models';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';

@Component({
  selector: 'app-selected-coins',
  templateUrl: './selected-coins.component.html',
  styleUrls: ['./selected-coins.component.css']
})
export class SelectedCoinsComponent implements OnInit {
  selectedCoins: VOMC[] = [];
  private allCoinsData: VOMC[];
  constructor(
    private marketCap: ApiMarketCapService,
    private storage: StorageService
  ) {
  }

  ngOnInit() {
    this.marketCap.getCoinsArWithSelected().subscribe(res => {
      this.allCoinsData = res;
      this.selectedCoins = _.filter(res, {selected: true});
    })

  }


}
