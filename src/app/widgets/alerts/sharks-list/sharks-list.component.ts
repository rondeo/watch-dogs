import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import * as _ from 'lodash';
import {MarketCapService} from '../../../market-cap/services/market-cap.service';
import {ApiMarketCapService} from '../../../apis/api-market-cap.service';
import {MarketsHistoryService} from '../../../app-services/market-history/markets-history.service';
import {VOOrderExt} from '../../../models/app-models';
import {Subscription} from 'rxjs/Subscription';
import {StorageService} from '../../../services/app-storage.service';
import * as moment from 'moment';
import {MatSnackBar} from '@angular/material';
import {SignalBuySell} from '../../../app-services/market-history/sharks-alert';

@Component({
  selector: 'app-sharks-list',
  templateUrl: './sharks-list.component.html',
  styleUrls: ['./sharks-list.component.css']
})
export class SharksListComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;
  @Output() signal: EventEmitter<SignalBuySell> = new EventEmitter();
  sharks: VOOrderExt[];

  constructor(
    private marketCap: ApiMarketCapService,
    private marketsHistory: MarketsHistoryService,
    private storage: StorageService,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit() {

  }

  private sub: Subscription;
  private sub2: Subscription;

  unsubscribe() {
    if (this.sub) this.sub.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
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
      this.sub2 = ctr.signalBuySell$().subscribe(signal => {
        console.log('%c ' + moment().format('HH:mm') + this.exchange + this.market + signal.type + signal.rate, 'color:red');
        this.signal.emit(signal);
      });

      this.sub = ctr.sharksAlert$(coinAmount).subscribe(res => {
        if (!res || res.length === 0) return;

        res = _.orderBy(_.clone(res), 'timestamp');
        const lastTime = _.last(res).timestamp - 5 * 60 * 1000;
        let sharks = this.sharks;
        sharks.reverse();
        sharks = sharks.concat(res);

        try {
          if (sharks.length > 10) {
            while (sharks[0].timestamp < lastTime) {
              if (sharks.length < 11) break;
              sharks.shift();
            }
            /* sharks = sharks.filter(function (item) {
                return item.timestamp > lastTime;
              });*/
          }
        } catch (e) {
          console.error(e, sharks)
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
