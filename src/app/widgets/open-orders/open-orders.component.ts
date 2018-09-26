import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {VOOrder} from '../../models/app-models';
import {ShowExternalPageService} from '../../services/show-external-page.service';
import * as moment from 'moment';

@Component({
  selector: 'app-open-orders',
  templateUrl: './open-orders.component.html',
  styleUrls: ['./open-orders.component.css']
})
export class OpenOrdersComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;
  @Input() refresh: number;
  @Output() openOrdersChange: EventEmitter<VOOrder[]> = new EventEmitter();
  @Output() orderCanceled: EventEmitter<VOOrder> = new EventEmitter();
  orders: VOOrder[] = [];

  constructor(
    private apisPrivate: ApisPrivateService,
    private externalPages: ShowExternalPageService
  ) {
  }

  private sub;

  ngOnInit() {
  }

  ngOnChanges() {
    this.downloadOpenOrders();
  }

  timeout;
  lastCall = 0;

  async downloadOpenOrders() {
    const now = Date.now();
    if((now - this.lastCall) < 3000) return;
    this.lastCall = now;
    clearTimeout(this.timeout);
    if (!this.exchange || !this.market) return;
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const orders = await api.getOpenOrders2(this.market).toPromise();
    if (this.orders.length !== orders.length) this.openOrdersChange.emit(orders);
    this.orders = orders;
    /* if(this.orders.length) {
      this.timeout =  setTimeout(() =>this.downloadOpenOrders(), 10000)
     }*/
  }

  onCancelOrderClick(order: VOOrder) {
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const id = order.uuid;
    if (id) {
      const msg = [order.action, order.coin, order.amountUS, order.priceUS].join(' ');
      if (confirm('You want to cancel order ' + msg)) {
        api.cancelOrder(id, order.base, order.coin).subscribe(res => {
          this.orderCanceled.emit(order)
          this.timeout = setTimeout(() => {
            this.downloadOpenOrders();
          }, 3000)

        })
      }
    }
  }

  onOrderMarketClick(market: string) {
    this.externalPages.showMarket(this.exchange, market);
  }
}
