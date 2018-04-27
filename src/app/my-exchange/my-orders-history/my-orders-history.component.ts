import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output} from '@angular/core';
import {ConnectorApiService} from "../services/connector-api.service";
import {VOOrder} from "../../models/app-models";
import * as _ from 'lodash';
import {MatSnackBar} from "@angular/material";
import set = Reflect.set;

@Component({
  selector: 'my-orders-history',
  templateUrl: './my-orders-history.component.html',
  styleUrls: ['./my-orders-history.component.css']
})
export class MyOrdersHistoryComponent implements OnInit, OnChanges, OnDestroy{


  @Input() newOrder:VOOrder;
  @Input() marketInit:{base:string, coin:string, exchange:string, priceBaseUS:number, market:string};

  @Output() fillOrder:EventEmitter<VOOrder> = new EventEmitter();

  ordersHistory:VOOrder[] = [];
  allOrders:VOOrder[];
  openOrders:VOOrder[] = [];
  constructor(
    private apiService:ConnectorApiService,
    private snackBar:MatSnackBar
  ) { }

  ngOnInit() {

  }

  ngOnDestroy(){
    clearTimeout(this.checkTimeout);
  }



  private tableClickTimeout = 0;
  onTableTap(){
    let now = Date.now();
    if(now - this.tableClickTimeout < 300){
      console.warn(' doubleclick ');
    }

    this.tableClickTimeout = now;

    console.log('click')
  }

  ngOnChanges(changes:any){
    if(changes.marketInit && changes.marketInit.currentValue && changes.marketInit.currentValue.market){
      this.refreshOrdersHistory(null);
      this.refreshOpenOrders((err, res)=>{

      });
    }

    if(changes.newOrder && changes.newOrder.currentValue){
     setTimeout(()=> this.downloadNewOrder(), 2000);

    }

  }

  downloadNewOrder(){
    this.refreshOpenOrders((err, res)=> {
      console.log('refreshOpenOrders ', res)
      if (res.length === 0) {
        console.warn('no open orders  looking in history ' )
        this.refreshOrdersHistory(()=>{
          if(this.newOrder) setTimeout(()=> this.downloadNewOrder(), 6000);

        });
      }
    });
  }


  onRefreshOrdersClick(){
    this.refreshOpenOrders(null);
    this.refreshOrdersHistory(null);
  }


  private checkTimeout;

  loadingOpenOrders = false;

  refreshOpenOrders(callBack:(err, res)=>void){

    let coin =this.marketInit.coin;
    let base = this.marketInit.base;
    if(!coin || !base) return;
    this.loadingOpenOrders = true;

    clearTimeout(this.checkTimeout);
    let api = this.apiService.getCurrentAPI();

    if(!api.hasLogin()) return;

    let sub = api.getOpenOrders(base, coin).subscribe(res=> {

      //console.warn(res);
      this.loadingOpenOrders = false;
      sub.unsubscribe();
      if(res.length) {
        clearTimeout(this.checkTimeout)
        this.checkTimeout = setTimeout(()=>this.refreshOpenOrders(null), 30e3);
      }


      this.openOrders = res.map(function (item) {
        item.amountCoinUS = Math.round(item.amountCoin * item.rate * this.pB);
        item.priceUS = +(item.rate * this.pB).toPrecision(3);
        item.act = item.action.substr(0,1)
        return item
      }, {pB:this.marketInit.priceBaseUS});

      this.allOrders =  this.openOrders.concat(this.ordersHistory);
      if(callBack)callBack(null, this.openOrders);
    }, err=>{
      this.loadingOpenOrders = false;
      clearTimeout(this.checkTimeout);
      this.checkTimeout = setTimeout(()=>this.refreshOpenOrders(null), 30e3);
      if(callBack)callBack(err, null);

    });
  }

  checkNewOrder(){
    if(this.newOrder && this.ordersHistory){

      let uuid = this.newOrder.uuid;
      //console.log(' new order id '+uuid, this.ordersHistory)
      let exists = this.ordersHistory.find(function (item) {
        return item.uuid === uuid;
      });
      //console.log('exists ', exists)
      if(exists){
        this.fillOrder.emit(exists);
      }
    }
  }

  loadingOrdersHistory = false;
  refreshOrdersHistory(callBack:Function){
    let api = this.apiService.getCurrentAPI();
    let coin =this.marketInit.coin;
    let base = this.marketInit.base;

    if(!coin || !base) return;


    this.loadingOrdersHistory = true;
    let sub = api.downloadOrders(base, coin).subscribe(res=>{
      sub.unsubscribe();



      res = _.orderBy(res, 'timestamp', 'desc');

      //console.warn(res);
      this.ordersHistory = res.map(function (item) {
        item.amountCoinUS = Math.round(item.amountCoin * item.rate * this.pB);
        item.priceUS = +(item.rate * this.pB).toPrecision(3);
        item.act = item.action.substr(0,1)
        return item
      }, {pB:this.marketInit.priceBaseUS});
     //console.warn(res);

      this.checkNewOrder();
      this.allOrders =  this.openOrders.concat(this.ordersHistory);

      this.calculateSummary();
      this.loadingOrdersHistory = false;
      if(callBack)callBack(null, this.ordersHistory);

    }, err => {

     if(sub)sub.unsubscribe() ;
      if(callBack)callBack(err, null);
      this.loadingOrdersHistory = false;
    })
  }

  summaryColor:string;
  summary:number;
  totalFee:number;
  private calculateSummary(){
    if(!this.marketInit || !this.ordersHistory) return;
    // console.log(' calculateSummary ', this.marketInit.priceBaseUS, this.ordersHistory);

    let totalFee = 0;

    let totalBuy = 0;
    let totalSell = 0;


    this.ordersHistory.forEach(function (item) {
      if(!item.isOpen){

        totalFee += item.fee;
        if(item.action === 'BUY') totalBuy += item.amountCoinUS;
        else if(item.action ==='SELL') totalSell+= item.amountCoinUS;
        else console.error(' no status ', item);
      }

    });

    let profit = (totalSell - totalBuy) ;
    console.log('profit   '+ (profit * this.marketInit.priceBaseUS));
    this.summary = +(profit).toFixed(2);

    this.summaryColor = this.summary<0?'red':'green';

    this.totalFee = +(totalFee * this.marketInit.priceBaseUS).toFixed(2);

  }

  onCancelOrderClick(order:VOOrder){

    let api =  this.apiService.getCurrentAPI();


    let uuid = order.uuid;

    if(!confirm('Cancel order '+ order.action + ' ' + order.amountCoinUS +' '+ order.priceUS +'?')) return;

    api.cancelOrder(uuid).toPromise().then(res=>{
      console.log('order canceled ', res);
      if(res.uuid){
        this.snackBar.open('Order canceled', 'x', {duration:3000, extraClasses:'alert-green'});

        _.remove(this.openOrders, {uuid:uuid});

        this.allOrders =  this.openOrders.concat(this.ordersHistory);

      }
      else  this.snackBar.open('cant cancel order ', 'x', {duration:3000, extraClasses:'alert-red'});

    }).catch(err=>{
      console.warn(err);
      this.snackBar.open('Server error ', 'x', {duration:3000, extraClasses:'alert-red'});
    })
  }


}
