import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {VOOrder} from '../../models/app-models';

@Component({
  selector: 'app-open-orders',
  templateUrl: './open-orders.component.html',
  styleUrls: ['./open-orders.component.css']
})
export class OpenOrdersComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;
  @Input() afeterTimestamp: number;

  orders: VOOrder[] = [];
  constructor(
    private apisPrivate: ApisPrivateService
  ) { }

  ngOnInit() {
    this.downloadOpenOrders();
  }

  ngOnChanges(){
    this.downloadOpenOrders();
  }

  downloadOpenOrders(){
    if(!this.exchange || !this.market) return;
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const ar = this.market.split('_');
    api.getOpenOrders(ar[0], ar[1]).subscribe(orders => {
      console.log(orders);
      this.orders = orders;
    })
  }

  onCancelOrderClick(order: VOOrder) {

  }
}
