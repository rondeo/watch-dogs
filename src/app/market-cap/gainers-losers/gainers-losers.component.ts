import {Component, OnInit} from '@angular/core';
import {MarketCapService} from '../services/market-cap.service';
import {VOMarketCap, VOMCDisplay} from '../../models/app-models';
import * as _ from 'lodash';
import {ActivatedRoute, Router} from '@angular/router';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';

import {MovingAverage} from '../../com/moving-average';
import {MatCheckboxChange} from '@angular/material';
import {VOCandle, VOMarketCapSelected, VOMCObj} from '../../models/api-models';
import * as  moment from 'moment';
import {MATH} from '../../com/math';
import {NewsService} from '../../apis/news/news.service';
import {ApiCryptoCompareService} from '../../apis/api-crypto-compare.service';


@Component({
  selector: 'app-gainers-losers',
  templateUrl: './gainers-losers.component.html',
  styleUrls: ['./gainers-losers.component.css']
})
export class GainersLosersComponent implements OnInit {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiPublic: ApisPublicService,
    private apiMarketCap: ApiMarketCapService,
    private service: MarketCapService,
    private news: NewsService,
    private cryptoCompare: ApiCryptoCompareService,
    private apisPublic: ApisPublicService
  ) {

  }


  asc_desc: 'asc' | 'desc' = 'asc';
  top = 'top300';
  exchange: string;
  MC: VOMCObj;
  coinsAvailable: VOMarketCap[];
  sortBy = 'percent_change_24h';

  exchangeCoins: string[] = [];
  exchgangeCoinsTop350: string[] = [];
  exchanges: string[];

  coin: string;
  base = 'BTC';
  market: string;
  selectedExchanges: string[] = [];

  onItemClick(evt) {
   //  console.log(evt);
    this.coin = evt.symbol;
    const market = this.base + '_' + this.coin;
    this.router.navigate(['/market-cap/gainers-losers', {exchange:this.exchange, market}], {replaceUrl: true});
  }

  onSymbolClick(mc: VOMarketCap) {
    this.router.navigateByUrl('/market-cap/coin-exchanges/' + mc.id);
  }
  ngOnInit() {
    this.exchanges = this.apiPublic.allExhanges;
    this.route.params.subscribe(params => {
      this.market = params.market;
      this.exchange = params.exchange;
      if(this.market ==='undefined') this.market = null;
      this.loadExchange();
    });

    this.subscribe();
  }

  async onExcgangeChange(evt) {
    this.router.navigate(['/market-cap/gainers-losers', {exchange:this.exchange, market: this.market}],
      {replaceUrl: true});
  }

  async loadExchange() {
    if (!this.exchange){
      this.exchangeCoins = [];
      this.sortData();
      return;
    }

    const api: ApiPublicAbstract = this.apiPublic.getExchangeApi(this.exchange);
    if (!api) {
      this.exchangeCoins = [];
      this.sortData();
      return;
    }

    this.exchangeCoins = await api.getAllCoins();

    this.sortData();

  }

  onTopChange(evt) {
    this.sortData();
  }

  subscribe() {
    this.apiMarketCap.ticker$().subscribe(MC => {
      this.MC = MC;
      this.sortData();
    });
  }
  onFilterClick() {
    this.sortData();
  }

  sortData() {

    if (!this.MC) return;
    // console.log('sort');

    let allCoins = Object.values(this.MC);

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
      case '200_300':
        allCoins = allCoins.filter(o => o.rank < 300 && o.rank > 200);
        break;
      case 'from80_120':
        allCoins = allCoins.filter(o => o.rank < 120 && o.rank > 80);
        break;
    }


    allCoins = this.filterExhangeCoins(allCoins);
    let sorted = _.orderBy(allCoins, this.sortBy, this.asc_desc);
    this.coinsAvailable = sorted;
  }

  onClickHeader(criteria: string): void {
    // console.log(criteria);
    if (this.sortBy === criteria) {
      this.asc_desc = (this.asc_desc === 'asc') ? 'desc' : 'asc';
    }

    this.sortBy = criteria;
    this.sortData();
  }

  filterExhangeCoins(allCoins: any[]): any[] {
    const exchangeCoins = this.exchangeCoins || [];
    if (exchangeCoins.length) {
      return allCoins.filter(function (item) {
        return exchangeCoins.indexOf(item.symbol) !== -1;
      });
    }
    return allCoins;
  }

  onExchangesChange(evt: MatCheckboxChange, exchange: string) {
    if (evt.checked) {
      if (this.selectedExchanges.indexOf(exchange) === -1) this.selectedExchanges.push(exchange);
    } else {
      if (this.selectedExchanges.indexOf(exchange) !== -1) this.selectedExchanges
        .splice(this.selectedExchanges.indexOf(exchange), 1);
    }
    this.filterselectedExchanges();
  }

  filterselectedExchanges() {
    if (this.exchange && this.selectedExchanges.indexOf(this.exchange) !== -1) this.selectedExchanges = this.selectedExchanges
      .splice(this.selectedExchanges.indexOf(this.exchange), 1);

    const apisPublic: ApiPublicAbstract[] = this.selectedExchanges.map((exchange) => {
      return this.apiPublic.getExchangeApi(exchange);
    });
    let sorted = []; // this.sorted;
    //   console.log(sorted);
    Promise.all(apisPublic.map((api: ApiPublicAbstract) => {
      return api.getAllCoins();
    })).then(coinsAll => {
      if (coinsAll.length) {
        const coins = _.intersection(...coinsAll);
        sorted = sorted.filter(function (item) {
          return coins.indexOf(item.symbol) !== -1;
        });
      }
     // this.setOut(sorted);
    });
  }

}
