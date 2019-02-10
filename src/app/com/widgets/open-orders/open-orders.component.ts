import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output} from '@angular/core';
import {ApisPrivateService} from '../../../core/apis/api-private/apis-private.service';
import {VOOrder} from '../../../models/app-models';
import {ShowExternalPageService} from '../../../core/services/show-external-page.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import {FollowOrdersService} from '../../../core/apis/open-orders/follow-orders.service';

@Component({
  selector: 'app-open-orders',
  templateUrl: './open-orders.component.html',
  styleUrls: ['./open-orders.component.css']
})
export class OpenOrdersComponent implements OnInit, OnChanges, OnDestroy {

  constructor(
    private apisPrivate: ApisPrivateService,
    private externalPages: ShowExternalPageService
  ) {
  }

  @Input() exchange: string;
  @Input() market: string;
  @Input() refresh: number;
  @Output() openOrdersChange: EventEmitter<VOOrder[]> = new EventEmitter();
  @Output() orderCanceled: EventEmitter<VOOrder> = new EventEmitter();
  orders: VOOrder[] = [];

  private sub;
  private sub2;


  timeout;
  lastCall = 0;

  allOrders: VOOrder[];

  ngOnInit() {
  }

  ngOnChanges() {
    this.subscribe();
  }

  subscribe() {
    if (this.sub) this.sub.unsubscribe();
    if (!this.exchange) return;
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    api.allOpenOrders$().subscribe(orders => {
      if (!orders) return;
      const current = _.keyBy(this.orders, 'uuid');
      orders.forEach(function (o) {
        o.lastStatus = current[o.uuid] ? current[o.uuid].lastStatus : '';
      });
      this.orders = orders;
    });
  }

  onCancelOrderClick(order: VOOrder) {
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const id = order.uuid;
    if (id) {
      const msg = [order.action, order.coin, order.amountUS, order.priceUS].join(' ');
      if (confirm('You want to cancel order ' + msg)) {
        api.cancelOrder2(id, order.base + '_' + order.coin).then(res => {

          this.orderCanceled.emit(order);
        });
      }
    }
  }

  onOrderMarketClick(market: string) {
    this.externalPages.showMarket(this.exchange, market);
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();

  }

  onRefreshClick() {
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    api.refreshAllOpenOrders();
  }
}
