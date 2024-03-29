import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {VOOrder} from '../../../amodels/app-models';
import {ApisPrivateService} from '../../../a-core/apis/api-private/apis-private.service';
import {ApiMarketCapService} from '../../../a-core/apis/api-market-cap.service';
import {VOMCObj} from '../../../amodels/api-models';
import * as moment from 'moment';
import {Subscription} from 'rxjs';


@Component({
  selector: 'app-orders-history',
  templateUrl: './orders-history.component.html',
  styleUrls: ['./orders-history.component.css']
})
export class OrdersHistoryComponent implements OnInit, OnChanges, OnDestroy {

  constructor(
    private apisPrivate: ApisPrivateService,
    private marketCap: ApiMarketCapService
  ) {
  }

  @Input() exchange: string;
  @Input() market: string;
  @Input() afterTimestamp: number;
  from: string;

  orders: VOOrder[] = [];
  MC: VOMCObj;

  isProgress = false;

  sub1: Subscription;

  lastCall = 0;

  ngOnInit() {
    this.initAsync();
  }

  async initAsync() {
    this.MC = await this.marketCap.getTicker();
    // this.downloadOpenOrders()

  }

  ngOnChanges() {
    this.downloadOrders();
    this.subscribe();
  }


  subscribe() {
    if (this.sub1) this.sub1.unsubscribe();
    if (!this.exchange || !this.market) return;
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const ar = this.market.split('_');
    this.marketCap.getTicker().then(MC => {
      const price_usd = MC[ar[1]].price_usd;
      this.sub1 = api.allOrders$(ar[0], ar[1]).subscribe(orders => {
        orders.forEach(function (item) {
          item.amountUS = +(item.amountCoin * price_usd).toFixed(0);
        });
        this.orders = orders.sort(function (a, b) {
          return b.timestamp - a.timestamp;
        });

      });
    });

  }

  async downloadOrders() {
    if (!this.exchange || !this.market) return;
    const now = Date.now();
    if ((now - this.lastCall) < 3000) return;
    this.lastCall = now;
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const ar = this.market.split('_');
    const MC = await this.marketCap.getTicker();
    const price_usd = MC[ar[1]].price_usd;
    const after: number = this.afterTimestamp || moment().subtract(23, 'hours').valueOf();
    this.from = moment(after).format('MM-DD HH:mm');
    this.isProgress = true;
    const orders = await api.getAllOrders(ar[0], ar[1], after, moment().valueOf()).toPromise(); // .subscribe(orders => {
    setTimeout(() => {
      this.isProgress = false;
    }, 500);
    //  console.log(' all orders', orders);
    orders.forEach(function (item) {
      item.amountUS = +(item.amountCoin * price_usd).toFixed(0);
    });

    this.orders = orders.sort(function (a, b) {
      return b.timestamp - a.timestamp;
    });

  }

  onRefreshClick() {
    this.downloadOrders();
  }

  ngOnDestroy() {
    if (this.sub1) this.sub1.unsubscribe();
  }


}
