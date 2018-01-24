import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOOrder} from "../../models/app-models";
import * as _ from 'lodash';

@Component({
  selector: 'app-trading-history',
  templateUrl: './trading-history.component.html',
  styleUrls: ['./trading-history.component.css']
})

export class TradingHistoryComponent implements OnInit, OnChanges {

  summary:number;
  summaryColor:string;
  totalFee:string;

  @Input() newOrder:VOOrder;
  @Input() priceBaseUS:number;

  @Input() coin:string;
  @Input() exchange:string;
  @Input() base:string;

  @Input() ordersHistory:VOOrder[];

  constructor(

  ) {


  }

  ngOnInit() {


  }

  ngOnChanges(changes){
    console.log('trading-history-component', changes)
    if(changes.newOrder && changes.newOrder.currentValue){

      this.addOrder(changes.newOrder.currentValue);
      this.calculateSummary();
      this.saveData()
    }

    if(changes.priceBaseUS && changes.priceBaseUS.currentValue){
      console.log('trading-history-component  '+ changes.priceBaseUS.currentValue);

    }
    //this.marketID = 'bittrex_'+this.base+'_'+ this.coin;
    if(changes.coin || changes.base){
      this.loadSavedData();
    }

    if(changes.ordersHistory && changes.ordersHistory.currentValue){
      this.calculateSummary();
    }
  }

  loadSavedData(){
    if(this.exchange && this.base && this.coin){

      let str = localStorage.getItem(this.exchange +'-'+ this.base +'-'+this.coin);

      if(str) this.ordersHistory  = JSON.parse(str);
    }
    console.log(this.ordersHistory);
  }

  private addOrder(order:VOOrder){

    console.log('add oredr ', order);
    let exists = this.ordersHistory.find(function (item) { return item.uuid === order.uuid; });
    if(!!exists){
      console.error('Order exists ' + order.uuid );
      return
    };

    this.ordersHistory.push(this.mapOrder(order, this.priceBaseUS));

  }

  private calculateSummary(){
    console.log(' calculateSummary ', this.priceBaseUS, this.ordersHistory);
    let totalFee = 0;

    this.ordersHistory.forEach(function (item) {
      totalFee += item.feeUS
    })
    this.totalFee = totalFee.toFixed(2);

  }

  private mapOrder(order:VOOrder, priceBaseUS:number):VOOrderDisplay{

    console.log('mapOrder ', order)

    return {
      uuid:order.uuid,
      amountBaseUS: Math.round(order.amountBase * priceBaseUS),
      priceUS:+(order.rate * priceBaseUS).toPrecision(4) ,
      rate:order.rate,
      action:order.action,
      isOpen:order.isOpen,
      coin:order.coin,
      base:order.base,
      fee:order.fee,
      feeUS:+(order.fee * priceBaseUS).toPrecision(4)
    }
  }

  private saveData(){
    localStorage.setItem(this.exchange +'-'+ this.base +'-'+this.coin, JSON.stringify(this.ordersHistory));
  }

  onClearSummaryClick(){
    if(confirm('You want to clear local History?')){
      localStorage.removeItem(this.exchange +'-'+ this.base +'-'+this.coin);
      this.ordersHistory = [];
    }
  }

}



export interface VOOrderDisplay extends VOOrder{
  uuid:string;
  rate:number;
}