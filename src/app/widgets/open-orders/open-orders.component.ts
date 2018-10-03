import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output} from '@angular/core';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {VOOrder} from '../../models/app-models';
import {ShowExternalPageService} from '../../services/show-external-page.service';
import * as moment from 'moment';

@Component({
  selector: 'app-open-orders',
  templateUrl: './open-orders.component.html',
  styleUrls: ['./open-orders.component.css']
})
export class OpenOrdersComponent implements OnInit, OnChanges, OnDestroy {

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
    setInterval(()=>{

    }, 30000);
  }

  ngOnChanges() {
    this.subscribe();
  }

  timeout;
  lastCall = 0;

  subscribe(){
    if(this.sub) this.sub.unsubscribe();
    clearTimeout(this.timeout);
    if (!this.exchange || !this.market) return;
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const ar = this.market.split('_');

    api.openOrders$(ar[0], ar[1]).subscribe(orders =>{
      if (this.orders.length !== orders.length) {
        this.openOrdersChange.emit(orders);
        api.refreshBalances();
        api.refreshAllOrders(ar[0], ar[1],moment().subtract(23,'h').valueOf(), moment().valueOf() );
      }
     /* this.timeout = setTimeout(() => {
        api.refreshAllOpenOrders();
      }, 30000)
*/
      this.orders = orders;
    })
    api.refreshAllOpenOrders();
  }
  onCancelOrderClick(order: VOOrder) {
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const id = order.uuid;
    if (id) {
      const msg = [order.action, order.coin, order.amountUS, order.priceUS].join(' ');
      if (confirm('You want to cancel order ' + msg)) {
        api.cancelOrder2(id, order.base +'_'+ order.coin).then(res => {
          this.orderCanceled.emit(order);

        })
      }
    }
  }

  onOrderMarketClick(market: string) {
    this.externalPages.showMarket(this.exchange, market);
  }
  ngOnDestroy(){
    if(this.sub) this.sub.unsubscribe();
  }
}
