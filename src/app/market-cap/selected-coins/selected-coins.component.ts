import {Component, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {VOMarketCap} from '../../models/app-models';
import {MarketCapService} from '../services/market-cap.service';
import {StorageService} from '../../services/app-storage.service';
import {VOMC} from '../../apis/models';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ActivatedRoute, Router} from '@angular/router';

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
    private storage: StorageService,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.initAsync();
  }

  async initAsync() {
    this.allCoinsData = await this.marketCap.getCoinsArWithSelected();
    this.selectedCoins = _.filter(this.allCoinsData, {selected: true});
  }

  onSymbolSelected(evt) {
    console.log(evt);
    this.router.navigateByUrl('/trader/analyze-coin/' + evt);

  }


}
