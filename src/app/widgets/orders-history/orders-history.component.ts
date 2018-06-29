import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOOrder} from '../../models/app-models';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOMCObj} from '../../models/api-models';

@Component({
  selector: 'app-orders-history',
  templateUrl: './orders-history.component.html',
  styleUrls: ['./orders-history.component.css']
})
export class OrdersHistoryComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;
  @Input() afeterTimestamp: number;

  orders: VOOrder[] = [];
  MC: VOMCObj
  constructor(
    private apisPrivate: ApisPrivateService,
    private marketCap: ApiMarketCapService
  ) { }

  ngOnInit() {
    this.initAsync();
   ;
  }
  async initAsync(){
    this.MC =  await this.marketCap.getData();
    this.downloadOpenOrders()

  }

  ngOnChanges(){
    this.downloadOpenOrders();
  }

  downloadOpenOrders(){
    if(!this.exchange || !this.market || !this.MC) return;
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const ar = this.market.split('_');
    const MC = this.MC[ar[1]];

    api.getAllOrderes(ar[0], ar[1]).subscribe(orders => {
      console.log(orders);
      orders.forEach(function (item) {
        item.amountUS = +(item.amountCoin * MC.price_usd).toFixed(0);
      })
      this.orders = orders.sort(function (a, b) {
        return b.timestamp - a.timestamp;
      });
    })
  }

  onCancelOrderClick(order: VOOrder) {

  }

}
