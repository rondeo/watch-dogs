import {Component, OnInit} from '@angular/core';
import {MarketCapService} from '../services/market-cap.service';
import {VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {ActivatedRoute, Router} from '@angular/router';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
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
  allCoins: any[];

  sorted: any[];

  sortBy: string = 'percent_change_24h';

  btcMC: any = VOMCAGREGATED;

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

    this.downlaodMarketCap(false);

    this.route.params.subscribe(params => {
      if (params.exchange !== this.exchange) {
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
    if (this.exchange === 'all') {
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

  onRefreshClick() {
    this.downlaodMarketCap(true);
  }

  onTopChange(evt) {
    this.sortData();
    this.saveState();
  }

  async downlaodMarketCap(isRefresh) {
    const MC = await this.apiMarketCap.downloadTicker(isRefresh).toPromise();
    const coinDay = await this.apiMarketCap.getCoinsDay(isRefresh);
    // console.log(coinDay);

    const ma = await ApiMarketCapService.movingAfarageFromCoinDay(coinDay);

    /*
    *  symbol,
    *  price03hD,
        price1hD,
        price2hD,
        price4hD,
        price24hD,
        rank24hD
    * */

    const agregated = ma.map(function (item) {
      const mc: VOMarketCap = MC[item.symbol] || new VOMarketCap();
      return {
        symbol: item.symbol,
        tobtc_change_05h: +item.price03hD.toFixed(2),
        tobtc_change_1h: +item.price1hD.toFixed(2),
        tobtc_change_2h: +item.price2hD.toFixed(2),
        tobtc_change_3h: +item.price4hD.toFixed(2),
        tobtc_change_24h: +item.price24hD.toFixed(2),
        rankChange24h: +item.rank24hD.toFixed(2),
        rank: mc.rank,
        price_usd: mc.price_usd,
        percent_change_1h: mc.percent_change_1h,
        percent_change_24h: mc.percent_change_24h,
        percent_change_7d: mc.percent_change_7d
      }
    })


    // console.log(agregated);

    this.btcMC = _.find(agregated, {symbol: 'BTC'});

    this.allCoins = agregated
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
      case '100_200':
        allCoins = allCoins.filter(o => o.rank < 200 && o.rank > 100);
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
      if (rankUpA > rankUpB) return -1;
      else return 1
    });

    sorted = this.filterExhangeCoins(sorted);
    this.sorted = _.take(sorted, 50);

  }

  filterExhangeCoins(allCoins: VOMCAgregated[]): VOMCAgregated[] {
    const exchangeCoins = this.exchangeCoins || [];
    if (exchangeCoins.length) {
      return allCoins.filter(function (item) {
        return exchangeCoins.indexOf(item.symbol) !== -1
      });
    }
    return allCoins;
  }


  onToBTCClick() {

    this.sorted = this.filterExhangeCoins(this.allCoins).filter(function (item: VOMCAgregated) {
      return item.tobtc_change_05h > 0 && item.tobtc_change_1h > 0 && item.tobtc_change_2h > 0 && item.tobtc_change_3h > 0
    }).sort(function (a, b) {
      return b.rankChange24h - a.rankChange24h;
    }).slice(0, 50);
  }

}
