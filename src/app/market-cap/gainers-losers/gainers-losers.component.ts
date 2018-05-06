import {Component, OnInit} from '@angular/core';
import {MarketCapService} from '../market-cap.service';
import {VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {Router} from '@angular/router';
import {ApiMarketCapService} from "../../apis/api-market-cap.service";

@Component({
  selector: 'app-gainers-losers',
  templateUrl: './gainers-losers.component.html',
  styleUrls: ['./gainers-losers.component.css']
})
export class GainersLosersComponent implements OnInit {

  asc_desc = 'desc';
  top:string = 'top300';

  allCoins: VOMarketCap[];

  sorted: VOMarketCap[];


  sortBy: string = 'percent_change_24h';

  constructor(
    private router: Router,
    private marketCap: MarketCapService,
    private apiMarketCap: ApiMarketCapService
  ) {
  }


  onSymbolClick(mc: VOMarketCap) {

    // let symbols:string[] = _.map(this.consAvailable,'symbol');

    this.router.navigateByUrl('/market-cap/coin-exchanges/' + mc.id);
  }

  private missingImages: string[] = [];
  private misingImagesTimeout;

  ngOnInit() {

    this.downlaodTicker();

    /*this.marketCap.coinsAr$.subscribe(res => {
      this.allCoins = res;

      this.sortData();
    });
    this.marketCap.refresh();*/
  }

  onSymbolSelected(symbol: string) {
    console.log(symbol);
  }


  onTopChange(evt){
    this.top = evt.value;
    this.sortData();
  }

  async downlaodTicker() {
    const ticker = await this.apiMarketCap.downloadTicker().toPromise();

    console.log(ticker);
    this.allCoins = Object.values(ticker);
    this.sortData();
  }

  onFilterClick() {

    this.sortData();
  }

  sortData() {
    if (!this.allCoins) return;

    var allCoins:VOMarketCap[] = this.allCoins;
    switch (this.top) {
      case 'top100':
        allCoins = allCoins.filter(o=>o.rank < 100);
        break;
      case 'top200':
        allCoins = allCoins.filter(o=>o.rank < 200);
        break;
      case 'after100':
        allCoins = allCoins.filter(o=>o.rank > 100);
        break;
      case 'after200':
        allCoins = allCoins.filter(o=>o.rank > 200);
        break;

    }

    //let cap = this.data.filter(function (item) { return item.volume_usd_24h > this.limit && item.rank < this.rank;}, {limit:this.capLimit, rank:this.rank});

    let sorted = _.orderBy(allCoins, this.sortBy, this.asc_desc);

    // console.log(sorted);
    this.sorted = _.take(sorted, 100);
  }


  onTableclick(event) {

    // console.log(event.srcElement);
    var target = event.target || event.srcElement || event.currentTarget;
    var idAttr = target.attributes.data;

    if (idAttr && idAttr.nodeValue) console.log(idAttr.nodeValue);

    // var value = idAttr.id;
  }


  onClickHeader(criteria: string): void {
   // console.log(criteria);
    if (this.sortBy === criteria) {
      this.asc_desc = (this.asc_desc === 'asc') ? 'desc' : 'asc';
    }

    this.sortBy = criteria;
    this.sortData();
  }

}
