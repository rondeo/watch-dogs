import {Component, OnInit} from '@angular/core';
import {ApisPublicService} from '../../apis/apis-public.service';
import {VOMarket} from '../../models/app-models';

@Component({
  selector: 'app-common-markets',
  templateUrl: './common-markets.component.html',
  styleUrls: ['./common-markets.component.css']
})
export class CommonMarketsComponent implements OnInit {

  exchanges: { exchange: string, selected: boolean }[];
  private allMarkets: { [symbol: string]: VOMarket }[]

  constructor(
    private apiPublic: ApisPublicService
  ) {
  }

  ngOnInit() {
    this.initAsync();

  }

  async initAsync() {
    this.allMarkets = await this.apiPublic.getAllMarkets();
    console.log(this.allMarkets);
    this.exchanges = this.allMarkets.map(function (item) {
      return {
        exchange: Object.values(item)[0].exchange,
        selected: true
      };
    });
  }


}
