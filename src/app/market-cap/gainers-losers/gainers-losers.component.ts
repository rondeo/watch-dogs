import {Component, OnInit} from '@angular/core';
import {MarketCapService} from '../services/market-cap.service';
import {VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {ActivatedRoute, Router} from '@angular/router';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';

import {MovingAverage} from '../../com/moving-average';
import {MatCheckboxChange} from '@angular/material';
import {VOMarketCapSelected} from '../../models/api-models';
import * as  moment from 'moment';
import {MATH} from '../../com/math';


class VOMCDisplay extends VOMarketCap{
  rankD: number;
  price_btcD: number
}


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


  btcMC: any = new VOMCDisplay();
  allCoins: VOMCDisplay[];
  sorted: VOMCDisplay[];
  sortedAndFiltered: VOMCDisplay[];


  sortBy: string = 'percent_change_24h';



  exchangeCoins: string[] = [];
  exchgangeCoinsTop350: string[] = [];
  exchanges: string[];

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


  private setOut(ar:VOMCDisplay[]){
    this.sortedAndFiltered =  _.take(ar, 50);
  }

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

    this.exchanges = this.apiPublic.allExhanges;
    const lastState = localStorage.getItem(this.pageId);
    if (lastState) {
      const state = JSON.parse(lastState);
      this.sortBy = state.sortBy || this.sortBy;
      this.asc_desc = state.asc_desc || this.asc_desc;
      this.top = state.top || this.top;
    }

    this.downlaodCoinsDay();

    this.route.params.subscribe(params => {
      if (params.exchange !== this.exchange) {
        this.exchange = params.exchange;

      }
      this.loadExchange();

    })


  }

  allMarkets;

  tooltipMessage: string = 'exchanges list';
  async onMouseOver(item) {
    const symbol = item.symbol;
    if(!this.allMarkets) this.allMarkets = await this.apiPublic.getAllMarkets();
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

    this.exchangeCoins = await  api.getAllCoins();

    this.sortData();

  }

  onRefreshClick() {
    this.downlaodCoinsDay();
  }

  onTopChange(evt) {
    this.sortData();
    this.saveState();
  }

  async downlaodCoinsDay() {

    const MC = await this.apiMarketCap.getTicker();

    const MC30Mins = await this.apiMarketCap.getTicker30Min().toPromise();
    const MCHours = await this.apiMarketCap.getTickerHours().toPromise();

    const MCHoursFirst = _.first(MCHours);
    const MCHoursLast = _.last(MCHours);
    const MC30MinLast = _.last(MC30Mins);

   const hours = moment.duration(moment((<any>MCHoursFirst).timestamp).diff(moment((<any>MCHoursLast).timestamp))).asHours();

   const out  =  [];


   this.btcMC = MC['BTC'];

   for (let coin in MC) {
    /* const f = MCHoursFirst[coin];
     const l = MCHoursLast[coin];*/

     const f = MCHoursLast[coin];
     const l = MC30MinLast[coin];

     if(f && l) {
       out.push(
        Object.assign(MC[coin], {
          rankD: MATH.percent(f.rank, l.rank),
          price_btcD: MATH.percent(l.price_btc, f.price_btc)
        })
       )
     }
   }


   this.allCoins = out;

  // console.log(out);

  // console.log('hours ', hours);

   // console.log(MC30Mins, MCHours);


    //console.log(MC);



   // const coinDay = await this.apiMarketCap.getCoinsDay();


    //  console.log(coinDay);




    //const ma = await MovingAverage.movingAverageSnapFromCoinDays(coinDay);


    /*
    *  symbol,
    *  price03hD,
        price1hD,
        price2hD,
        price4hD,
        price24hD,
        rank24hD
    * */

   /* const agregated = ma.map(function (item) {
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
    })*/


    // console.log(agregated);

  //  this.btcMC = _.find(agregated, {symbol: 'BTC'});

  //  this.allCoins = agregated
    if (this.exchange) this.loadExchange();
     else this.sortData();
  }

  onFilterClick() {

    this.sortData();
  }

  sortData() {

    if (!this.allCoins) return;
    // console.log('sort');

    var allCoins = this.allCoins;

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

    this.sorted = sorted;
   //  this.sortedAndFiltered = this.sorted;
    this.filterselectedExchanges();
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

 /* onUpClick() {
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

  }*/

  filterExhangeCoins(allCoins: any[]): any[] {
    const exchangeCoins = this.exchangeCoins || [];
    if (exchangeCoins.length) {
      return allCoins.filter(function (item) {
        return exchangeCoins.indexOf(item.symbol) !== -1
      });
    }
    return allCoins;
  }


  onToBTCClick() {
  /*  this.sorted = this.filterExhangeCoins(this.allCoins).filter(function (item: VOMarketCap) {
      return item.tobtc_change_05h > 0 && item.tobtc_change_1h > 0 && item.tobtc_change_2h > 0 && item.tobtc_change_3h > 0
    }).sort(function (a, b) {
      return b.rankChange24h - a.rankChange24h;
    });*/
    // this.filterselectedExchanges();
  }

  selectedExchanges: string[] = [];

  onExchangesChange(evt: MatCheckboxChange, exchange:string){
    if(evt.checked) {
      if(this.selectedExchanges.indexOf(exchange) === -1)this.selectedExchanges.push(exchange);
    }else {
      if(this.selectedExchanges.indexOf(exchange) !== -1) this.selectedExchanges
        .splice(this.selectedExchanges.indexOf(exchange),1);
    }
    this.filterselectedExchanges();
  }

  filterselectedExchanges(){
    if(this.exchange && this.selectedExchanges.indexOf(this.exchange) !== -1)   this.selectedExchanges = this.selectedExchanges
      .splice(this.selectedExchanges.indexOf(this.exchange), 1);

    const apisPublic: ApiPublicAbstract[] = this.selectedExchanges.map((exchange)=>{
      return this.apiPublic.getExchangeApi(exchange);
    });
    let sorted = this.sorted;
  //   console.log(sorted);
   Promise.all(apisPublic.map((api: ApiPublicAbstract) =>{
     return api.getAllCoins();
   })).then(coinsAll => {
     if(coinsAll.length) {
       const coins = _.intersection(...coinsAll);
       sorted = sorted.filter(function (item) {
         return coins.indexOf(item.symbol) !==-1;
       })
     }

     this.setOut(sorted);

   })
  }


}
