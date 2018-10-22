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
  // private allOrders: VOOrder[];
  private statsHistory: number[][] = [];

  exchange: string;
  ordersSub: BehaviorSubject<VOOrder[]> = new BehaviorSubject<VOOrder[]>(null);
 //  newOrdersSub: Subject<VOOrder[]> = new Subject<VOOrder[]>();
  coinPrice: number;
  ordersStatsSub: Subject<number[]> = new Subject();

  statsAlerts: OrdersStatsAlerts;
  sharksAlert: SharksAlert;
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
    console.log('Orders history START '+ this.exchange);
    this.refreshOrders();
  }

  stop(){
    clearTimeout(this.timeout);
  }

  timeout;
  lastTimestamp = 0;
  refreshOrders() {
    clearTimeout(this.timeout);
    this.api.downloadOrders(this.market).subscribe(res => {
      if(!this.ordersSub.observers.length) return;
     this.timeout =  setTimeout(() => this.refreshOrders(), 30000);
      res = _.orderBy(res, 'timestamp');
      res.forEach(function (o) {
        o.amountUS = Math.round(o.amountCoin * this.p);
      },{p:this.coinPrice});

      const firstTimestamp = res[0].timestamp;
      const lastTimestamp = this.lastTimestamp;

      const overlap = firstTimestamp - lastTimestamp;
      this.lastTimestamp = res[res.length - 1].timestamp;

      if(this.statsAlerts) this.statsAlerts.next(res, overlap);

      // this.ordersSub.

      this.ordersSub.next(res);
      let newOrders = res.filter(function (item) {
        return item.timestamp > lastTimestamp;
      });

      console.log(this.exchange + this.market + ' new orders ' + newOrders.length);
      if(this.sharksAlert) this.sharksAlert.next(newOrders, overlap);

      //if (!this.allOrders) this.allOrders = newOrders;
      //else this.allOrders = this.allOrders.concat(newOrders).slice(0, 1000);
      //this.newOrdersSub.next(newOrders);
      localStorage.setItem('orders-history-lastTimestamp', String(this.lastTimestamp))
    }, err =>{
      console.error(err);
      clearTimeout(this.timeout);
     this.timeout =  setTimeout(() => this.refreshOrders(), 10000);
    })
  }

  signalBuySell$(){
    if(!this.sharksAlert) this.sharksAlert = new SharksAlert(this.exchange, this.market, this.storage);
    return this.sharksAlert.signalBuySell$();
  }

  sharksAlert$(amountCoin:number){
    if(!this.sharksAlert) this.sharksAlert = new SharksAlert(this.exchange, this.market, this.storage);
    return this.sharksAlert.alerts$(amountCoin);
  }

  sharksHistory$(length=100){
    if(!this.sharksAlert) this.sharksAlert = new SharksAlert(this.exchange, this.market, this.storage);
    return this.sharksAlert.history$(length);
  }
  ordersVolumeAlerts$(volumePercent: number) {
    if(!this.statsAlerts) this.statsAlerts = new OrdersStatsAlerts(this.exchange, this.market, this.storage);
    this.statsAlerts.setVolumeUP(volumePercent);
    return this.statsAlerts.volumeAlert$();
  }

  ordersStats$() {
    return this.ordersStatsSub.asObservable();
  }

  orders$(): Observable<VOOrder[]> {
    return this.ordersSub.asObservable();
  }
/*
  newOrders$(): Observable<VOOrder[]> {
    return this.newOrdersSub.asObservable();
  }*/


}
