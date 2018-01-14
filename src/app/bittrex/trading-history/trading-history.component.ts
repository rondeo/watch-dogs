import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOOrder} from "../../models/app-models";

@Component({
  selector: 'app-trading-history',
  templateUrl: './trading-history.component.html',
  styleUrls: ['./trading-history.component.css']
})

export class TradingHistoryComponent implements OnInit, OnChanges {

  summary:number;
  summaryColor:string;

  @Input() newOrder:VOOrder;
  @Input() priceBaseUS:number;

  @Input() coin:string;
  @Input() exchange:string;
  @Input() base:string;

  ordersHistory:VOOrderDisplay[];

  constructor() {


  }

  ngOnInit() {

  }

  ngOnChanges(changes){
    //console.log('trading-history-component', changes)
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

  }

  loadSavedData(){
    if(this.exchange && this.base && this.coin){

      let str = localStorage.getItem(this.exchange +'-'+ this.base +'-'+this.coin) || '[]';
      this.ordersHistory = JSON.parse(str);
    } else  this.ordersHistory = [];
  }

  private addOrder(order:VOOrder){

    console.log('add oredr ', order);
    let exists = this.ordersHistory.find(function (item) { return item.uuid === order.uuid; });
    if(!!exists){
      console.error('Order exists ' + order.uuid );
      return
    };

    this.ordersHistory.push(this.mapOrder(order));

  }

  private calculateSummary(){

  }

  private mapOrder(order:VOOrder):VOOrderDisplay{

    return {
      uuid:order.uuid,
      amoint:1,
      amountUS:1,
      priceUS:1,
      rate:order.rate,
      action:order.action,
      isOpen:order.isOpen,
      coin:order.coin,
      base:order.base
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
  action:string;
  amoint:number;
  amountUS:number
  rate:number;
  priceUS:number;
}