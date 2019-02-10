import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../../adal/apis/api-market-cap.service';
import {VOOrder} from '../../../amodels/app-models';
import * as _ from 'lodash';
import * as moment from 'moment';
import {ApisPublicService} from '../../../adal/apis/api-public/apis-public.service';
import {ApiPublicAbstract} from '../../../adal/apis/api-public/api-public-abstract';
import {MarketsHistoryService} from '../../../adal/app-services/market-history/markets-history.service';

import {OrdersHistory} from '../../../adal/app-services/market-history/orders-history';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-fishes',
  templateUrl: './fishes.component.html',
  styleUrls: ['./fishes.component.css']
})
export class FishesComponent implements OnInit, OnChanges, OnDestroy {
  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private marketsHistoryService: MarketsHistoryService
  ) { }

  @Input() exchange: string;
  @Input() market: string;
  @Input() refresh: number;

  sumSell: number;
  sumBuy: number;
  resultsLength = 7;

  volPerMinute: string;
  tradesPerMinute: string;

  startTime: string;
  endTime: string;
  timeDiff: string;



  fishes: VOOrder[];

  sub1: Subscription;
  sub2: Subscription;

  isProgress = false;
  timeout;

  sortOn = 'timestamp';
  isDesc = true;

  ngOnInit() {
    this.sortOn = localStorage.getItem('FishesComponent-sortOn');
  }
  ngOnDestroy() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();

  }
  ngOnChanges() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
   this.showFishes();
  }

  async showFishes() {
    if (!this.market || ! this.exchange) return;
    this.isProgress = true;
    const ar = this.market.split('_');
    let orders = await this.apisPublic.getExchangeApi(this.exchange).downloadMarketHistory(ar[0], ar[1]).toPromise();
    setTimeout(() => {this.isProgress = false; }, 500);
    const ordersHistory = _.orderBy(orders, 'timestamp');
    const MC = await this.marketCap.getTicker();
    let base  = ordersHistory[0].base;
    let coin = ordersHistory[0].coin;
    let priceBaseUS = 1;
    const from = ordersHistory[0].timestamp;
    const to = ordersHistory[ordersHistory.length - 1].timestamp;

    this.endTime = moment(to).format('HH:mm');
    this.startTime = moment(from).format('HH:mm');
    this.timeDiff = moment.duration(moment(to).diff(moment(from))).asMinutes().toFixed(2);

    if (base !== 'USDT') priceBaseUS = MC[base].price_usd;
    let bought = 0;
    let sold = 0;
    ordersHistory.forEach(function (o) {
      o.amountUS = Math.round(o.amountCoin * o.rate * priceBaseUS);
      o.action === 'BUY' ? bought += o.amountUS : sold += o.amountUS;
    });

    this.sumBuy = bought;
    this.sumSell = sold ;
    const speed = 60 * (bought + sold) / (to - from);
    this.volPerMinute = 'V: ' + speed.toPrecision(3) + 'k/min';
    this.tradesPerMinute = '#: ' + (60000 * ordersHistory.length / (to - from)).toPrecision(4) + '/min';

    this.fishes =  ordersHistory.sort(function (a, b) {
      return b.amountCoin - a.amountCoin;
    }).slice(0, this.resultsLength);
  this.sort();
  }

  sort() {
    this.fishes = _.orderBy(this.fishes, this.sortOn, this.isDesc ? 'desc' : 'asc');
  }

  onRefreshClick() {
    this.showFishes();
  }
  sortOnClick(sort: string) {
    if (this.sortOn === sort) this.isDesc = !this.isDesc;
    localStorage.setItem('FishesComponent-sortOn', sort);
    this.sortOn = sort;
    this.sort();
  }
  /*onFishClick(){
    if(this.fishes && this.fishes.length) {
      this.fishes = [];
      return;
    }
    this.showFishes3();
  }*/

}
