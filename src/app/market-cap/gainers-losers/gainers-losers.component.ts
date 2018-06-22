import {Component, OnInit} from '@angular/core';
import {MarketCapService} from '../services/market-cap.service';
import {VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {ActivatedRoute, Router} from '@angular/router';
import {ApiMarketCapService} from "../../apis/api-market-cap.service";
import {ApisPublicService} from "../../apis/apis-public.service";
import {ApiPublicAbstract} from "../../apis/api-public/api-public-abstract";
import {VOMCAGREGATED, VOMCAgregated} from '../../models/api-models';


@Component({
  selector: 'app-gainers-losers',
  templateUrl: './gainers-losers.component.html',
  styleUrls: ['./gainers-losers.component.css']
})
export class GainersLosersComponent implements OnInit {

  pageId = 'marketcap-ganers-losers'
  asc_desc = 'desc';
  top: string = 'top300';
  exchange: string;
  allCoins: VOMCAgregated[];

  sorted: VOMCAgregated[];

  sortBy: string = 'percent_change_24h';


  btcMC:VOMCAgregated = VOMCAGREGATED;

  exchangeCoins: string[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiPublic: ApisPublicService,
    private apiMarketCap: ApiMarketCapService,
    private service: MarketCapService
  ) {
  }

  onSymbolClick(mc: VOMarketCap) {
    this.router.navigateByUrl('/market-cap/coin-exchanges/' + mc.id);
  }

  private missingImages: string[] = [];
  private misingImagesTimeout;


  saveState() {
    const state = {
      sortBy: this.sortBy,
      asc_desc: this.asc_desc,
      exchange: this.exchange,
      top: this.top
    }
    localStorage.setItem(this.pageId, JSON.stringify(state));
  }

  ngOnInit() {
    const lastState = localStorage.getItem(this.pageId);
    if (lastState) {
      const state = JSON.parse(lastState);
      this.sortBy = state.sortBy || this.sortBy;
      this.asc_desc = state.asc_desc || this.asc_desc;
      this.top = state.top || this.top;
    }

    this.downlaodTicker();

    this.route.params.subscribe(params => {
      if(params.exchange !== this.exchange) {
        this.exchange = params.exchange;

      }
      this.loadExchange();

    })




  }

  onSymbolSelected(symbol: string) {
    console.log(symbol);
  }

  async onExcgangeChange(evt) {
    // this.service.setCurentExchange(this.exchange);
    // this.exchange = evt.value;
    this.router.navigateByUrl('/market-cap/gainers-losers/' + this.exchange);
    // this.loadExchange();
   //  this.saveState();

  }

  async loadExchange() {
    if (!this.exchange) return;
    if (this.exchange === 'all'){
      this.exchangeCoins = [];
      this.sortData();
      return;
    }
    const api: ApiPublicAbstract = this.apiPublic.getExchangeApi(this.exchange);
    if (!api) {
      this.exchangeCoins = [];
      this.sortData();
      return
    }

    api.getAllCoins().subscribe(coins => {
      // console.log(coins);
      this.exchangeCoins = Object.keys(coins);
      this.sortData();
    })

  }

  onRefreshClick(){
    this.downlaodTicker();
  }

  onTopChange(evt) {
    this.sortData();
    this.saveState();
  }

  async downlaodTicker() {
    const ticker = await this.apiMarketCap.getDataWithRankChange();
    this.btcMC = ticker['BTC']
     console.log(ticker);
    this.allCoins = Object.values(ticker);
    if (this.exchange) this.loadExchange();
    else this.sortData();
  }

  onFilterClick() {

    this.sortData();
  }

  sortData() {

    if (!this.allCoins) return;
    // console.log('sort');

    var allCoins: VOMCAgregated[] = this.allCoins;

    switch (this.top) {
      case 'top100':
        allCoins = allCoins.filter(o => o.rank < 100);
        break;
      case 'top200':
        allCoins = allCoins.filter(o => o.rank < 200);
        break;
      case 'after100':
        allCoins = allCoins.filter(o => o.rank > 100);
        break;
      case 'after200':
        allCoins = allCoins.filter(o => o.rank > 200);
        break;
    }


    allCoins = this.filterExhangeCoins(allCoins);

    // let cap = this.data.filter(function (item) { return item.volume_usd_24h > this.limit && item.rank < this.rank;}, {limit:this.capLimit, rank:this.rank});
    let sorted = _.orderBy(allCoins, this.sortBy, this.asc_desc);

    // console.log(sorted);
    this.sorted = _.take(sorted, 50);
  }

  onClickHeader(criteria: string): void {
    // console.log(criteria);
    if (this.sortBy === criteria) {
      this.asc_desc = (this.asc_desc === 'asc') ? 'desc' : 'asc';
    }

    this.sortBy = criteria;
    this.sortData();
    this.saveState();
  }

  onUpClick() {
    if (!this.allCoins) return;
    var allCoins: VOMCAgregated[] = this.allCoins;
    let sorted = allCoins.sort(function (a, b) {
      const rankUpA = a.rankPrev - a.rank;
      const rankUpB = b.rankPrev - b.rank;
      if(rankUpA > rankUpB) return -1;
      else return 1
    });

    sorted = this.filterExhangeCoins(sorted);
    this.sorted = _.take(sorted, 50);

  }

  filterExhangeCoins(allCoins:VOMCAgregated[]): VOMCAgregated[]{
    const exchangeCoins = this.exchangeCoins || [];
    if (exchangeCoins.length) {
      return allCoins.filter(function (item) {
        return exchangeCoins.indexOf(item.symbol) !== -1
      });
    }
    return allCoins;
  }


  onToBTCClick() {

    this.sorted = this.allCoins.filter(function (item: VOMCAgregated) {
      return item.tobtc_change_05h > 0 && item.tobtc_change_1h > 0  && item.tobtc_change_2h > 0  && item.tobtc_change_3h > 0
    }).sort(function (a, b) {
      return b.rankChange24h - a.rankChange24h;
    }).slice(0, 50);
  }

}
