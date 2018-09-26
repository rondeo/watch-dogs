import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOOrder} from '../../models/app-models';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOMCObj} from '../../models/api-models';
import * as moment from 'moment';

@Component({
  selector: 'app-orders-history',
  templateUrl: './orders-history.component.html',
  styleUrls: ['./orders-history.component.css']
})
export class OrdersHistoryComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;
  @Input() afterTimestamp: number;
  from:string;

  orders: VOOrder[] = [];
  MC: VOMCObj

  isProgress = false;

  constructor(
    private apisPrivate: ApisPrivateService,
    private marketCap: ApiMarketCapService
  ) {
  }

  ngOnInit() {
    this.initAsync();
  }

  async initAsync() {
    this.MC = await this.marketCap.getTicker();
    // this.downloadOpenOrders()

  }

  ngOnChanges() {
    this.downloadOrders();
  }

  lastCall = 0;
  async downloadOrders() {
    if (!this.exchange || !this.market) return;
    const now = Date.now();
    if((now - this.lastCall) < 3000) return;
    this.lastCall = now;
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const ar = this.market.split('_');
    const MC = await this.marketCap.getTicker();
    const price_usd = MC[ar[1]].price_usd;
    const after: number = this.afterTimestamp || moment().subtract(23, 'hours').valueOf();
    this.from = moment(after).format('MM-DD HH:mm');
    this.isProgress = true;
    const orders = await api.getAllOrders(ar[0], ar[1], after, moment().valueOf()).toPromise();//.subscribe(orders => {
    setTimeout(()=>{
      this.isProgress = false;
    }, 500)
   //  console.log(' all orders', orders);
    orders.forEach(function (item) {
      item.amountUS = +(item.amountCoin * price_usd).toFixed(0);
      });

      this.orders = orders.sort(function (a, b) {
        return b.timestamp - a.timestamp;
      });

  }

  onRefreshClick(){
    this.downloadOrders();
  }



}
