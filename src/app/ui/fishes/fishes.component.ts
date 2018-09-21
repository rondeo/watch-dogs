import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOOrder} from '../../models/app-models';
import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'app-fishes',
  templateUrl: './fishes.component.html',
  styleUrls: ['./fishes.component.css']
})
export class FishesComponent implements OnInit, OnChanges {

  @Input() ordersHistory: VOOrder[];


  sumSell: number;
  sumBuy: number;
  resultsLength: number = 7;

  startTime: string;
  endTime: string;

  fishes:VOOrder[];
  constructor(
    private marketCap: ApiMarketCapService
  ) { }

  ngOnInit() {


  }

  ngOnChanges(){
    this.showFishes()
  }

  filterResults(){
    const fishes =  this.ordersHistory.sort(function (a, b) {
      return b.amountCoin - a.amountCoin;
    }).slice(0,this.resultsLength);

    this.fishes = fishes.sort(function (a, b) {
      return b.timestamp - a.timestamp;
    });
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
  /*onFishClick(){
    if(this.fishes && this.fishes.length) {
      this.fishes = [];
      return;
    }
    this.showFishes3();
  }*/

}
