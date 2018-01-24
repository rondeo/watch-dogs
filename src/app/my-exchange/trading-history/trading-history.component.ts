import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOOrder} from "../../models/app-models";
import * as _ from 'lodash';
import {ConnectorApiService} from "../services/connector-api.service";
import {MatSnackBar} from "@angular/material";

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
  @Input() marketInit:MarketInit;

 /* @Input() priceBaseUS:number;

  @Input() coin:string;
  @Input() exchange:string;
  @Input() base:string;
*/


 ordersHistory:VOOrder[];

  constructor(
    private apiService:ConnectorApiService,
    private snackBar:MatSnackBar
  ) {


  }

  ngOnInit() {


  }

  ngOnChanges(changes){
    if(changes.marketInit){
      this.loadSavedData();
    }

    console.log('trading-history-component', changes)
    if(changes.newOrder && changes.newOrder.currentValue){

      let order:VOOrder = changes.newOrder.currentValu;

      this.mapOrder(order, this.marketInit.priceBaseUS)
      this.checkingOrder(order);
      /*this.addOrder(changes.newOrder.currentValue);
      this.calculateSummary();
      this.saveData()*/
    }

    if(changes.priceBaseUS && changes.priceBaseUS.currentValue){
      console.log('trading-history-component  '+ changes.priceBaseUS.currentValue);

    }
/*
    if(changes.coin || changes.base || changes.exchange){
      this.loadSavedData();
    }*/
  }

  trackOrderTimeout;

  onCancelClick(){
    if(!this.newOrder) return;
    let api =  this.apiService.getCurrentAPI();
    let uuid = this.newOrder.uuid
    api.cancelOrder(uuid).toPromise().then(res=>{
      console.log(res);
      if(res.uuid)this.snackBar.open('Order canceled', 'x', {duration:3000, extraClasses:'alert-green'});
      else  this.snackBar.open('cant cancel order ', 'x', {duration:3000, extraClasses:'alert-red'});

    }).catch(err=>{
      this.snackBar.open('Server error ', 'x', {duration:3000, extraClasses:'alert-red'});
    })
  }

  checkingOrder(newOrder){


   let api =  this.apiService.getCurrentAPI();

   api.trackOrder(newOrder.uuid).toPromise().then(res=>{
     console.log(res);
     if(res.isOpen) {
       this.trackOrderTimeout = setTimeout(()=>this.checkingOrder(newOrder), 3000);
     }else{

       this.newOrder = null;
       if(res.uuid !==newOrder.uuid){
        console.error(res);
       }else this.addOrder(newOrder);
     }


   }).catch(err=>{
     this.trackOrderTimeout = setTimeout(()=>this.checkingOrder(newOrder), 3000);
   })
  }

  loadSavedData(){
    if(!this.marketInit) return;

    let id = this.marketInit.exchange +'-'+ this.marketInit.base +'-'+this.marketInit.coin;

      let str = localStorage.getItem(id);

      if(str) this.ordersHistory  = JSON.parse(str);
   // }
    console.log(this.ordersHistory);
  }

  private addOrder(order:VOOrder){

    console.log('add oredr ', order);
    let exists = this.ordersHistory.find(function (item) { return item.uuid === order.uuid; });
    if(!!exists){
      console.error('Order exists ' + order.uuid );
      return
    };

    this.ordersHistory.unshift(this.mapOrder(order, this.marketInit.priceBaseUS));
    this.saveData();

  }

  private calculateSummary(){
    console.log(' calculateSummary ', this.marketInit.priceBaseUS, this.ordersHistory);
    let totalFee = 0;

    this.ordersHistory.forEach(function (item) {
      totalFee += item.feeUS
    });

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
    let id = this.marketInit.exchange +'-'+ this.marketInit.base +'-'+this.marketInit.coin;
    localStorage.setItem(id, JSON.stringify(this.ordersHistory));
  }

  onClearSummaryClick(){
    if(confirm('You want to clear local History?')){
      let id = this.marketInit.exchange +'-'+ this.marketInit.base +'-'+this.marketInit.coin;
      localStorage.removeItem(id);
      this.ordersHistory = [];
    }
  }

}


export interface MarketInit{
  base:string;
  coin:string;
  exchange:string;
  priceBaseUS:number;
}

export interface VOOrderDisplay extends VOOrder{
  uuid:string;
  rate:number;
}