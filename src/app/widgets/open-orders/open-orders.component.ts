import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {VOOrder} from '../../models/app-models';
import {ShowExternalPageService} from '../../services/show-external-page.service';

@Component({
  selector: 'app-open-orders',
  templateUrl: './open-orders.component.html',
  styleUrls: ['./open-orders.component.css']
})
export class OpenOrdersComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;
 /* @Input() afterDate: string;*/
  @Input() refresh: number;

  @Output() openOrders: EventEmitter<VOOrder[]> = new EventEmitter();
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

  async downloadOpenOrders() {
    if(!this.exchange || !this.market) return;
    console.warn(this.exchange, this.market);

   //  if (!this.exchange) return;
    // if(this.sub) this.sub.unsubscribe();

    const api = this.apisPrivate.getExchangeApi(this.exchange);

    const oprders = await api.getOpenOrders2(this.market).toPromise();

    this.orders = oprders;
    /*
    if(!this.market) {
      const api = this.apisPrivate.getExchangeApi(this.exchange);
      this.sub = api.openOrdersSub.asObservable().subscribe(allOrders =>{
        if(!allOrders) return;
        this.orders = allOrders;
        this.openOrders.emit(allOrders);
      });

    } else {
      const ar = this.market.split('_');

      this.sub = api.openOrders$(ar[0], ar[1])
      //  api.getOpenOrders(ar[0], ar[1])

        .subscribe(orders => {
          console.log(orders);
          if(this.orders.length !== orders.length) {
            this.orders = orders;
            this.openOrders.emit(orders);
          }
        });
    }
    api.refreshAllOpenOrders();*/
  }

  onCancelOrderClick(order: VOOrder) {
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const id = order.uuid;
    if (id) {
      const msg = [order.action, order.coin, order.amountUS, order.priceUS].join(' ');
      if (confirm('You want to cancel order ' + msg)) {
        api.cancelOrder(id, order.base, order.coin).subscribe(res => {
          setTimeout(function () {
            api.refreshAllOpenOrders();
          }, 3000)

        })
      }
    }
  }

  onOrderMarketClick(market: string){
    this.externalPages.showMarket(this.exchange, market);
  }
}
