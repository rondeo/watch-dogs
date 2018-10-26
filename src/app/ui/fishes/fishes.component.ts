import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOOrder} from '../../models/app-models';
import * as _ from 'lodash';
import * as moment from 'moment';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {MarketsHistoryService} from '../../app-services/market-history/markets-history.service';
import {Subscription} from 'rxjs/Subscription';
import {OrdersHistory} from '../../app-services/market-history/orders-history';

@Component({
  selector: 'app-fishes',
  templateUrl: './fishes.component.html',
  styleUrls: ['./fishes.component.css']
})
export class FishesComponent implements OnInit, OnChanges, OnDestroy {

  @Input() ordersHistory: VOOrder[];

  @Input() exchange: string;
  @Input() market: string;
  @Input() refresh: number;

  sumSell: number;
  sumBuy: number;
  resultsLength: number = 7;

  volPerMinute: string;
  tradesPerMinute: string;

  startTime: string;
  endTime: string;
  timeDiff: string;



  fishes:VOOrder[];
  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private marketsHistoryService: MarketsHistoryService
  ) { }

  ngOnInit() {
    this.sortOn = localStorage.getItem('FishesComponent-sortOn');
  }
  ngOnDestroy(){
    if(this.sub1) this.sub1.unsubscribe();
    if(this.sub2) this.sub2.unsubscribe();

  }

  sub1:Subscription;
  sub2:Subscription;
  ngOnChanges(){
    if(this.sub1) this.sub1.unsubscribe();
    if(this.sub2) this.sub2.unsubscribe();
    if(!this.market || ! this.exchange) return;

    console.log(this.market,  this.exchange);
    const ar = this.market.split('_');

    this.apisPublic.getExchangeApi(this.exchange).downloadMarketHistory(ar[0], ar[1]).toPromise().then(orders =>{
      this.ordersHistory = _.orderBy(orders, 'timestamp');
      this.showFishes();
    })
  /*  return;
    const ctr:OrdersHistory = this.marketsHistoryService.getOrdersHistory(this.exchange, this.market);

    this.sub1 = ctr.orders$().subscribe(newOrders =>{
      //  console.log(newOrders);
      this.ordersHistory = newOrders;
      this.showFishes();;
    });

    this.sub2 = ctr.ordersStats$().subscribe(stats =>{

    })*/

   // this.downloadHistory();
  }

  download(){

  }


  isProgress = false;
  timeout;
 /* downloadHistory(){
    clearTimeout(this.timeout);
    if(!this.market || ! this.exchange) return;

    this.isProgress = true;
    const api: ApiPublicAbstract = this.apisPublic.getExchangeApi(this.exchange);
    api.downloadOrders(this.market).toPromise().then(res =>{
      this.ordersHistory = res;
      setTimeout(()=>{
        this.isProgress = false;
      }, 500)
      this.timeout = setTimeout(()=>this.downloadHistory(), 60 * 1000);
      this.showFishes();
    })

  }
*/
  filterResults(){
    const fishes =  this.ordersHistory.sort(function (a, b) {
      return b.amountCoin - a.amountCoin;
    }).slice(0,this.resultsLength);

    this.sort(fishes);
    /*this.fishes = fishes.sort(function (a, b) {
      return b.timestamp - a.timestamp;
    });*/
  }

  async showFishes(){
    if(!this.ordersHistory) return;
    const ordersHistory = this.ordersHistory;
    const MC = await this.marketCap.getTicker();
    let base  = this.ordersHistory[0].base;
    let coin = this.ordersHistory[0].coin;
    let priceBaseUS = 1;
    const from = ordersHistory[0].timestamp;
    const to = ordersHistory[ordersHistory.length -1].timestamp;

    this.endTime = moment(to).format('HH:mm');
    this.startTime = moment(from).format('HH:mm');
    this.timeDiff = moment.duration(moment(to).diff(moment(from))).asMinutes().toFixed(2);

    if(base !=='USDT') priceBaseUS = MC[base].price_usd;
    let bought = 0;
    let sold = 0;
    this.ordersHistory.forEach(function (o) {
      o.amountUS = Math.round(o.amountCoin * o.rate * priceBaseUS)
      o.action ==='BUY'? bought+=o.amountUS: sold+= o.amountUS;
    });

    this.sumBuy = bought;
    this.sumSell = sold ;
    const speed = 60 * (bought + sold) / (to - from);
    this.volPerMinute = 'V: '+ speed.toPrecision(3) + 'k/min';
    this.tradesPerMinute = '#: ' + (60000 * ordersHistory.length /(to - from)).toPrecision(4)+ '/min';
    this.filterResults();
  }

  onResultsLengthChanged(evt) {
    this.filterResults();
  }

  onRefreshClick(){
    const ctr:OrdersHistory = this.marketsHistoryService.getOrdersHistory(this.exchange, this.market);
    ctr.refreshOrders();
    // this.downloadHistory();
  }

  sort(orders: VOOrder[]){
    this.fishes = _.orderBy(orders, this.sortOn, this.isDesc?'desc':'asc');
  }
  sortOn = 'timestamp';
  isDesc = true;
  sortOnClick(sort: string){
    if(this.sortOn === sort) this.isDesc = !this.isDesc;
    localStorage.setItem('FishesComponent-sortOn', sort);
    this.sortOn = sort;
    this.sort(this.fishes);

  }
  /*onFishClick(){
    if(this.fishes && this.fishes.length) {
      this.fishes = [];
      return;
    }
    this.showFishes3();
  }*/

}
