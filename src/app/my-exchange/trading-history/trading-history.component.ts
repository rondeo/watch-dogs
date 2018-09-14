import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange} from '@angular/core';
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
  totalFee:number = 0;

  @Input() newOrder:VOOrder;
  @Input() marketInit:MarketInit;

  @Output() completeOrder:EventEmitter<VOOrder> = new EventEmitter<VOOrder>();

  checkOrder:VOOrder;

 ordersHistory:VOOrder[];

  constructor(
    private apiService:ConnectorApiService,
    private snackBar:MatSnackBar
  ) {

      this.ordersHistory = [];
  }

  ngOnInit() {


  }


  onCancelOrderClick(order:VOOrder){

  }

  ngOnChanges(changes:any){
   // console.log('trading-coindatas-component', changes);
    if(changes.marketInit && changes.marketInit.currentValue){
      this.loadSavedData();
      if(this.newOrder){
        this.checkOrder = this.mapOrder(this.newOrder, this.marketInit.priceBaseUS);
      }

      this.calculateSummary();
    }

    if(changes.newOrder && changes.newOrder.currentValue && this.marketInit){
      let order:VOOrder = changes.newOrder.currentValue;
      this.checkOrder = this.mapOrder(order, this.marketInit.priceBaseUS);

      setTimeout(()=> this.checkingOrder(this.checkOrder), 2000);
    }

   /* if(changes.priceBaseUS && changes.priceBaseUS.currentValue){
      console.log('trading-coindatas-component  '+ changes.priceBaseUS.currentValue);

    }*/
/*
    if(changes.coin || changes.base || changes.exchange){
      this.loadSavedData();
    }*/
  }



  trackOrderTimeout;

  onCancelNewOrderClick(){
    if(!this.checkOrder) return;
    let api =  this.apiService.getCurrentAPI();
    let order = this.checkOrder;

    let uuid = order.uuid;

    if(!confirm('Cancel order '+ order.action + ' ' + order.amountUS +' '+ order.priceUS +'?')) return;

    api.cancelOrder(uuid).toPromise().then(res=>{
      console.log(res);
      if(res.uuid)this.snackBar.open('Order canceled', 'x', {duration:3000, extraClasses:'alert-green'});
      else  this.snackBar.open('cant cancel order ', 'x', {duration:3000, extraClasses:'alert-red'});

    }).catch(err=>{
      console.warn(err);
      this.snackBar.open('Server error ', 'x', {duration:3000, extraClasses:'alert-red'});
    })
  }


  checkingOrder(myOrder:VOOrder) {

    if (!myOrder.isOpen) {
      this.checkOrder = null;
      this.completeOrder.emit(myOrder);
      this.addOrderHistory(myOrder);
      this.calculateSummary();
      return

    }


    let api = this.apiService.getCurrentAPI();

    console.log('checkingOrder ', myOrder);

    /*api.trackOrder(myOrder.uuid).toPromise().then(res=>{
      console.log(res);

      if(res.isOpen) {

        let msg = myOrder.isActive + ' $'+ (myOrder.amountCoin * myOrder.rate * this.marketInit.priceBaseUS);

        this.snackBar.open('open ' + msg + 'wait 3sec', 'x', {duration:2000});

        this.trackOrderTimeout = setTimeout(()=>this.checkingOrder(myOrder), 30000);
      }else{

        if(res.uuid !== myOrder.uuid){
         console.error(res);
        }else {
          myOrder.isOpen = false;
          this.checkOrder = null;
          this.completeOrder.emit(myOrder);
          this.addOrderHistory(myOrder);
          this.calculateSummary();
        }
      }

    }).catch(err=>{
      console.warn(err);
      this.snackBar.open('Check Order Error wait 5sec', 'x', {duration:2000, extraClasses:'alert-red'});
      this.trackOrderTimeout = setTimeout(()=>this.checkingOrder(myOrder), 5000);
    })
   }*/


  }


  private addOrderHistory(order:VOOrder){

    //console.log('add oredr ', order);
    let exists = this.ordersHistory.find(function (item) { return item.uuid === order.uuid; });
    if(!!exists){
      console.error('Order exists ' + order.uuid );
      return
    };

    this.ordersHistory.unshift(this.mapOrder(order, this.marketInit.priceBaseUS));
    this.saveData();

  }

  private calculateSummary(){
    if(!this.marketInit || !this.ordersHistory) return;
   // console.log(' calculateSummary ', this.marketInit.priceBaseUS, this.ordersHistory);

    let totalFee = 0;

    let totalBuy = 0;
    let totalSell = 0;

    this.ordersHistory.forEach(function (item) {
      totalFee += item.fee;
      if(item.action === 'BUY') totalBuy += (item.amountCoin * item.rate);
      else if(item.action ==='SELL') totalSell+= (item.amountCoin * item.rate);
      else console.error(' no isActive ', item);
    });

    let profit = (totalSell - totalBuy) ;
    console.log('profit   '+ (profit * this.marketInit.priceBaseUS));
    this.summary = +(profit * this.marketInit.priceBaseUS).toFixed(2);

    this.totalFee = +totalFee.toFixed(2);
  }

  private mapOrder(order:VOOrder, priceBaseUS:number):VOOrderDisplay{

    //console.log('mapOrder ' + priceBaseUS, order)

    return {
      uuid:order.uuid,
      amountBase:order.amountBase,
      amountCoin:order.amountCoin,
       amountUS: Math.round(order.amountCoin * order.rate * priceBaseUS),
     //  amountUS: MATH.round(order.amountBase * priceBaseUS),
      priceUS:+(order.rate * priceBaseUS).toPrecision(4) ,
      rate:order.rate,
      action:order.action,
      isOpen:order.isOpen,
      coin:order.coin,
      base:order.base,
      fee:order.fee
    }
  }


  private saveData(){

    let base = this.marketInit.base;
    let coin = this.marketInit.coin;
    let exchange = this.marketInit.exchange;

    let id = exchange +'-'+ base+'-'+coin;

    let data = this.ordersHistory.map(function (item) {
      return{
        uuid:item.uuid,
        amountBase:item.amountBase,
        amountCoin:item.amountCoin,
        rate:item.rate,
        action:item.action,
        fee:item.fee,
        isOpen:item.isOpen
      }
    });

    localStorage.setItem(id, JSON.stringify(data));
  }

  loadSavedData(){
    if(!this.marketInit) return;
    let base = this.marketInit.base;
    let coin = this.marketInit.coin;
    let exchange = this.marketInit.exchange;

    let id = exchange +'-'+ base+'-'+coin;

    let str = localStorage.getItem(id);

    let price = this.marketInit.priceBaseUS;

    if(str) this.ordersHistory  = JSON.parse(str).map( (item)=> {
      item.base = base;
      item.coin = coin;
      return this.mapOrder(item, price);
    });
    else this.ordersHistory = [];
    // }
    //console.log(this.ordersHistory);
  }

  onClearSummaryClick(){
    if(confirm('You want to clear local History?')){
      let id = this.marketInit.exchange +'-'+ this.marketInit.base +'-'+this.marketInit.coin;
      localStorage.removeItem(id);
      this.ordersHistory = [];
      this.checkOrder = null;
      this.summary = 0;
      this.totalFee = 0;
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