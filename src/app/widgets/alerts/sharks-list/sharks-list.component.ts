import {Component, Input, OnChanges, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {MarketCapService} from '../../../market-cap/services/market-cap.service';
import {ApiMarketCapService} from '../../../apis/api-market-cap.service';
import {MarketsHistoryService} from '../../../app-services/market-history/markets-history.service';
import {VOOrderExt} from '../../../models/app-models';
import {Subscription} from 'rxjs/Subscription';
import {StorageService} from '../../../services/app-storage.service';

@Component({
  selector: 'app-sharks-list',
  templateUrl: './sharks-list.component.html',
  styleUrls: ['./sharks-list.component.css']
})
export class SharksListComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;
  sharks: VOOrderExt[];

  constructor(
    private marketCap: ApiMarketCapService,
    private marketsHistory: MarketsHistoryService,
    private storage: StorageService
  ) {
  }

  ngOnInit() {

  }

  private sub: Subscription;

  unsubscribe() {
    if (this.sub) this.sub.unsubscribe();
  }

  subscribe() {
    this.unsubscribe();
    if (!this.market || !this.exchange) return;
    this.storage.select('sharks-' + this.exchange + this.market).then(res => this.sharks = res || []);
    const ar = this.market.split('_');
    const coin = ar[1];
    this.marketCap.getTicker().then(MC => {

      const coinPrice = MC[coin].price_usd;
      const coinAmount = 20000 / coinPrice;
      const ctr = this.marketsHistory.getOrdersHistory(this.exchange, this.market);
      this.sub = ctr.sharksAlert$(coinAmount).subscribe(res => {
        if (!res || res.length ===0) return;

        res = _.orderBy(_.clone(res), 'timestamp');
        const lastTime = _.last(res).timestamp - 5 * 60 * 1000;
        let sharks = this.sharks;
        sharks.reverse();
        sharks = sharks.concat(res);
        if (sharks.length > 10) {
          while (sharks.length > 10 || sharks[0].timestamp > lastTime) sharks.shift();
          /* sharks = sharks.filter(function (item) {
              return item.timestamp > lastTime;
            });*/
        }

        sharks.reverse();
        this.sharks = sharks;// _.orderBy(sharks, 'timestamp', 'desc');
        this.storage.upsert('sharks-' + this.exchange + this.market, this.sharks);

      });
    });
  }

  ngOnChanges() {
    this.subscribe();
  }

}
