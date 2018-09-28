import {VOOrder} from '../../models/app-models';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {UTILS} from '../../com/utils';
import * as _ from 'lodash';
import {StorageService} from '../../services/app-storage.service';
import {OrdersStatsAlerts} from './orders-stats-alerts';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {SharksAlert} from './sharks-alert';

// [to, bought, sold, volPerMinute, ordersPerMinute];

export class OrdersHistory {
  private allOrders: VOOrder[];
  private statsHistory: number[][] = [];

  exchange: string;
  ordersSub: BehaviorSubject<VOOrder[]> = new BehaviorSubject<VOOrder[]>(null);
  newOrdersSub: Subject<VOOrder[]> = new Subject<VOOrder[]>();
  coinPrice: number;
  ordersStatsSub: Subject<number[]> = new Subject();

  alerts: OrdersStatsAlerts;

  constructor(
    private api: ApiPublicAbstract,
    public market: string,
    private storage: StorageService
  ) {
    this.exchange = api.exchange;
    storage.select('statsHistory' + this.exchange + this.market).then(res => {
      this.statsHistory = res;
    });
    this.lastTimestamp = +localStorage.getItem('orders-history-lastTimestamp')
  }

  start() {
    this.getOrders();
  }

  lastTimestamp = 0;

  getOrders() {
    this.api.downloadOrders(this.market).subscribe(res => {
      setTimeout(() => this.getOrders(), 30000);
      res = _.orderBy(res, 'timestamp');
      this.processStats(res);
      this.ordersSub.next(res);

      const firstTimestamp = res[0].timestamp;
      const lastTimestamp = this.lastTimestamp;

      const overlap = firstTimestamp - lastTimestamp;
      this.lastTimestamp = res[res.length - 1].timestamp;

      let newOrders = res.filter(function (item) {
        return item.timestamp > lastTimestamp;
      });
      if(this.sharksAlert) this.sharksAlert.next(newOrders, overlap);

      if (!this.allOrders) this.allOrders = newOrders;
      else this.allOrders = this.allOrders.concat(newOrders).slice(0, 1000);
      this.newOrdersSub.next(newOrders);
      localStorage.setItem('orders-history-lastTimestamp', String(this.lastTimestamp))
    })
  }

  processStats(ar: VOOrder[]) {
    const coinPrice = this.coinPrice;
    const to = ar[ar.length - 1].timestamp;
    const from = ar[0].timestamp;
    let bought = 0;
    let sold = 0;
    ar.forEach(function (o) {
      o.amountUS = Math.round(o.amountCoin * coinPrice);
      o.action === 'BUY' ? bought += o.amountUS : sold += o.amountUS;
    });

    const volPerMinute = 60 * (bought + sold) / (to - from);
    const ordersPerMinute = (60000 * ar.length / (to - from));
    const stats = [to, bought, sold, volPerMinute, ordersPerMinute];

    this.statsHistory.push(stats);
    if (this.statsHistory.length > 1000) this.statsHistory.shift();
    if(this.alerts) {
      this.alerts.next(this.statsHistory);
    }

    this.storage.upsert('statsHistory' + this.exchange + this.market, this.statsHistory);
    this.ordersStatsSub.next(stats);
  }

  sharksAlert: SharksAlert;
  sharksAlert$(amountCoin:number){
    if(!this.sharksAlert) this.sharksAlert = new SharksAlert();
    return this.sharksAlert.alerts$(amountCoin);
  }
  ordersAlerts$(volumePercent: number) {
    if(!this.alerts) this.alerts = new OrdersStatsAlerts();
    this.alerts.setVolumeUP(volumePercent);
    return this.alerts.alertSub.asObservable();
  }

  ordersStats$() {
    return this.ordersStatsSub.asObservable();
  }

  orders$(): Observable<VOOrder[]> {
    return this.ordersSub.asObservable();
  }

  newOrders$(): Observable<VOOrder[]> {
    return this.newOrdersSub.asObservable();
  }


}
