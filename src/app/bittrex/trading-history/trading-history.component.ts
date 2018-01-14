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
  @Input() marketId:string;

  ordersHistory:VOOrderDisplay[];

  constructor() { }

  ngOnInit() {
    let str = localStorage.getItem(this.marketId) || '[]';
    this.ordersHistory = JSON.parse(str);
  }

  ngOnChanges(changes){
    console.log(changes)
    if(changes.newOrder){
      this.addOrder(changes.newOrder);
      this.calculateSummary();
      this.saveData()
    }

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
      rate:1,
      action:order.action.substr(0,1),
      isOpen:order.isOpen
    }
  }

  private saveData(){
    localStorage.setItem(this.marketId, JSON.stringify(this.ordersHistory));
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