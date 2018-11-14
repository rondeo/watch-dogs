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

  pageId = 'marketcap-ganers-losers'
  asc_desc = 'desc';
  top: string = 'top300';
  exchange: string;
  MC: VOMCObj;
  coinsAvailable:VOMarketCap[];
  sortBy: string = 'percent_change_24h';

  isToBTC: boolean;


  exchangeCoins: string[] = [];
  exchgangeCoinsTop350: string[] = [];
  exchanges: string[];

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



  onMarketInput(evt) {
    if (evt.code === 'Enter') this.showCandles();
    //  console.log(evt, this.userMarket);
  }

  onCandlesIntrvalChange() {
    this.showCandles();
  }


  mediaFrom: string;
  mediaTo: string;

  twitterPoints: string;
  redditPoints: string;
  facebookPoints: string;

  showMedia() {
    if(!this.coin) return;
    this.cryptoCompare.getSocialStats(this.coin).then(res => {
      if(!res){
        this.mediaFrom = '';
        this.mediaTo = '';
        this.twitterPoints = '';
        this.redditPoints = '';
        this.facebookPoints = '';
        return;
      }
      this.mediaFrom = res.timeFrom;
      this.mediaTo = res.timeTo;
      this.twitterPoints = res.TwPoints;
      this.redditPoints = res.RdPoints;
      this.facebookPoints = res.FbPoints;

    })
  }

  candlesInterval = '1h';
  inBrowser = false;
  coin: string;
  base = 'BTC';
  market: string;

  candles: VOCandle[];
  volumes:number[];
  onItemClick(evt){
    console.log(evt);
    this.coin = evt.symbol;
    this.market = this.base+ '_'+ this.coin;
    this.showCandles();
    if (this.inBrowser) this.openMarket();
    this.showMedia();
  }


  openMarket() {
    if(!this.market) return;
    const api = this.apisPublic.getExchangeApi('binance');
    const url = 'https://www.binance.com/en/trade/pro/' + this.market.split('_').reverse().join('_');//   api.getMarketUrl(ar[0], ar[1]);
    window.open(url, 'binance');
  }

  async showCandles() {
    if(!this.market) return;
    let candles = await this.cryptoCompare.downloadCandles(this.market, this.candlesInterval, 200);
    if (!candles) {
      this.candles = null;
      this.volumes = null;
      return;
    }

    this.candles = candles;
    this.volumes = candles.map(function (o) {
      return o.open > o.close ? -o.Volume : o.Volume;
    });
  }


  onSymbolClick(mc: VOMarketCap) {
    this.router.navigateByUrl('/market-cap/coin-exchanges/' + mc.id);
  }

  private missingImages: string[] = [];
  private misingImagesTimeout;

/*
  private setOut(ar: VOMCDisplay[]) {
    this.sortedAndFiltered = _.take(ar, 50);
  }*/

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
    this.isToBTC = localStorage.getItem('isToBtc') === 'true';
    this.exchanges = this.apiPublic.allExhanges;

    const lastState = localStorage.getItem(this.pageId);
    if (lastState) {
      const state = JSON.parse(lastState);
      this.sortBy = state.sortBy || this.sortBy;
      this.asc_desc = state.asc_desc || this.asc_desc;
      this.top = state.top || this.top;

    }

    this.route.params.subscribe(params => {
      // console.log(params.exchange)
      // if (params.exchange !== this.exchange) {

      if (params.exchange === 'last') {
        const last = localStorage.getItem('GainersLosersComponent-exchange') || 'all';
        this.router.navigateByUrl('/market-cap/gainers-losers/' + last);
      } else {
        if (params.exchange !== this.exchange) this.exchange = params.exchange;
        localStorage.setItem('GainersLosersComponent-exchange', this.exchange);
        this.loadExchange();
      }
      //}


    });

    this.subscribe();

  //  this.ctrDownlaodCoinsDay();
  }

  allMarkets;

  tooltipMessage: string = 'exchanges list';

  async onMouseOver(item) {
    const symbol = item.symbol;
    if (!this.allMarkets) this.allMarkets = await this.apiPublic.getAllMarkets();
    const result = this.allMarkets.filter(function (item) {
      return !!item['BTC_' + symbol];
    }).map(function (item) {
      return item['BTC_' + symbol].exchange;
    });
    this.tooltipMessage = result.toString();
  }

  onSymbolSelected(symbol: string) {
    console.log(symbol);
  }

  async onExcgangeChange(evt) {
    this.router.navigateByUrl('/market-cap/gainers-losers/' + this.exchange, {replaceUrl: true});
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

    this.exchangeCoins = await api.getAllCoins();

    this.sortData();

  }

  onTopChange(evt) {
    this.sortData();
    this.saveState();
  }

  subscribe(){
    this.apiMarketCap.ticker$().subscribe(MC=>{
      this.MC = MC;
      this.sortData();
    })
  }


  showMarket(market: string) {
  }

  onFilterClick() {

    this.sortData();
  }

  sortData() {

    if (!this.MC) return;
    // console.log('sort');

    var allCoins = Object.values(this.MC);

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
    }


    allCoins = this.filterExhangeCoins(allCoins);

    /* this.exchgangeCoinsTop350 = allCoins.map(function (item) {
       return item.symbol;
     });*/

    // console.log(allCoins);
    // let cap = this.data.filter(function (item) { return item.volume_usd_24h > this.limit && item.rank < this.rank;}, {limit:this.capLimit, rank:this.rank});
    let sorted = _.orderBy(allCoins, this.sortBy, this.asc_desc);

    // console.log(sorted);

    this.coinsAvailable = sorted;
    //  this.sortedAndFiltered = this.sorted;
   //  this.filterselectedExchanges();
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

  filterExhangeCoins(allCoins: any[]): any[] {
    const exchangeCoins = this.exchangeCoins || [];
    if (exchangeCoins.length) {
      return allCoins.filter(function (item) {
        return exchangeCoins.indexOf(item.symbol) !== -1
      });
    }
    return allCoins;
  }

  selectedExchanges: string[] = [];

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
    let sorted = [];//this.sorted;
    //   console.log(sorted);
    Promise.all(apisPublic.map((api: ApiPublicAbstract) => {
      return api.getAllCoins();
    })).then(coinsAll => {
      if (coinsAll.length) {
        const coins = _.intersection(...coinsAll);
        sorted = sorted.filter(function (item) {
          return coins.indexOf(item.symbol) !== -1;
        })
      }
     // this.setOut(sorted);
    })
  }


 /* onToBtcChange(evt) {
    if (this.isToBTC) this.allCoins = this.convertToBTC(this.allCoinsOrig);
    else this.allCoins = JSON.parse(JSON.stringify(this.allCoinsOrig));

    this.sortData();

    localStorage.setItem('isToBtc', this.isToBTC ? 'true' : 'false');

  }
*/
  onNewsClick(coin: VOMarketCap, num: number) {

    this.news.getNews(coin.name).then(res => {
      console.log(res);
    });


  }

  openBTCMarketClick(coin:VOMarketCap){
    if(this.exchange && this.exchange !== 'all'){
      const api = this.apiPublic.getExchangeApi(this.exchange);
      if(api){
        const url = api.getMarketURL('BTC_'+coin.symbol);
        window.open(url, this.exchange);
      }
    }
  }

}
