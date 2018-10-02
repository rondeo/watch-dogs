import {Component, Input, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {MarketCapService} from '../../../market-cap/services/market-cap.service';
import {ApiMarketCapService} from '../../../apis/api-market-cap.service';
import {OrdersHistoryService} from '../../../app-services/market-history/orders-history.service';
import {VOOrderExt} from '../../../models/app-models';
import {Subscription} from 'rxjs/Subscription';
import {StorageService} from '../../../services/app-storage.service';

@Component({
  selector: 'app-sharks-list',
  templateUrl: './sharks-list.component.html',
  styleUrls: ['./sharks-list.component.css']
})
export class SharksListComponent implements OnInit {

  @Input() exchange: string;
  @Input() market: string;
  sharks: VOOrderExt[];

  constructor(
    private marketCap: ApiMarketCapService,
    private ordersHistory: OrdersHistoryService,
    private storage: StorageService
  ) { }

  ngOnInit() {
    this.storage.select('sharks').then(res=>this.sharks = res);
  }

  private sub: Subscription

  unsubscribe(){
    if(this.sub) this.sub.unsubscribe();
  }
  subscribe(){
    this.unsubscribe();
    if(!this.market || ! this.exchange) return;
    const ar = this.market.split('_');
    const coin = ar[1];
    this.marketCap.getTicker().then(MC => {

      const coinPrice = MC[coin].price_usd;
      const coinAmount = 20000 / coinPrice;

      const ctr = this.ordersHistory.getOrdersHistory(this.exchange, this.market);
     this.sub =  ctr.sharksAlert$(coinAmount).subscribe( res=>{

        let sharks = this.sharks.reverse().concat(res);
        const lastTime = _.last(sharks).timestamp - 5*60*1000;

        if(sharks.length > 10 ){
          while(sharks.length > 10 || sharks[0].timestamp > lastTime) sharks.shift();
          /* sharks = sharks.filter(function (item) {
              return item.timestamp > lastTime;
            });*/
        }

        this.sharks = sharks.reverse();
        this.storage.upsert('sharks', this.sharks);

      });
    });

  }

}
