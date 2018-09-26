import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOOrder} from '../../models/app-models';
import * as _ from 'lodash';
import * as moment from 'moment';
import {ApisPublicService} from '../../apis/apis-public.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';

@Component({
  selector: 'app-fishes',
  templateUrl: './fishes.component.html',
  styleUrls: ['./fishes.component.css']
})
export class FishesComponent implements OnInit, OnChanges {

  @Input() ordersHistory: VOOrder[];

  @Input() exchange: string;
  @Input() market: string;
  @Input() refresh: number;

  sumSell: number;
  sumBuy: number;
  resultsLength: number = 7;

  startTime: string;
  endTime: string;

  fishes:VOOrder[];
  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService
  ) { }

  ngOnInit() {
    this.sortOn = localStorage.getItem('FishesComponent-sortOn');
  }

  ngOnChanges(){
    this.downloadHistory();
  }

  isProgress = false
  timeout;
  downloadHistory(){
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
    const MC = await this.marketCap.getTicker();
    let base  = this.ordersHistory[0].base;
    let coin = this.ordersHistory[0].coin;
    let priceBaseUS = 1;
    this.startTime = moment(this.ordersHistory[0].timestamp).format('HH:mm');
    this.endTime = moment(this.ordersHistory[this.ordersHistory.length-1].timestamp).format('HH:mm');
    if(base !=='USDT') priceBaseUS = MC[base].price_usd;


    let bought = 0;
    let sold = 0;
    this.ordersHistory.forEach(function (o) {
      o.amountUS = Math.round(o.amountCoin * o.rate * priceBaseUS)
      o.action ==='BUY'? bought+=o.amountUS: sold+= o.amountUS;
    });

    this.sumBuy = bought;
    this.sumSell = sold ;
    this.filterResults();
  }

  onResultsLengthChanged(evt) {
    this.filterResults();
  }

  onRefreshClick(){
    this.downloadHistory();
  }

  sort(orders: VOOrder[]){
    this.fishes = _.orderBy(orders, this.sortOn, this.isDesc?'desc':'asc');
  }
  sortOn = 'timestamp';
  isDesc = false;
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
