import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ConnectorApiService} from "../services/connector-api.service";
import {VOOrder} from "../../models/app-models";
import * as _ from 'lodash';

@Component({
  selector: 'my-orders-history',
  templateUrl: './my-orders-history.component.html',
  styleUrls: ['./my-orders-history.component.css']
})
export class MyOrdersHistoryComponent implements OnInit, OnChanges {


  @Input() newOrder:VOOrder;
  @Input() marketInit:{base:string, coin:string, exchange:string, priceBaseUS:number, pair:string};

  ordersHistory:VOOrder[];
  constructor(
    private apiService:ConnectorApiService,
  ) { }

  ngOnInit() {

  }

  ngOnChanges(changes:any){
    if(changes.marketInit && changes.marketInit.currentValue){
      this.refreshOrders(null)

    }
  }

  refreshOrders(callBack:Function){
    let api = this.apiService.getCurrentAPI();

    let sub = api.downloadOrders(this.marketInit.base,this.marketInit.coin ).subscribe(res=>{
      sub.unsubscribe();

      res = _.orderBy(res, 'timestamp', 'desc');
      this.ordersHistory = res.map(function (item) {
        item.amountCoinUS = Math.round(item.amountCoin * item.rate * this.pB);
        item.priceUS = +(item.rate * this.pB).toPrecision(3);
        item.act = item.action.substr(0,1)
        return item
      }, {pB:this.marketInit.priceBaseUS});
     //console.warn(res);
      this.calculateSummary();
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
      totalFee += item.fee;
      if(item.action === 'BUY') totalBuy += item.amountCoinUS;
      else if(item.action ==='SELL') totalSell+= item.amountCoinUS;
      else console.error(' no action ', item);
    });

    let profit = (totalSell - totalBuy) ;
    console.log('profit   '+ (profit * this.marketInit.priceBaseUS));
    this.summary = +(profit).toFixed(2);

    this.summaryColor = this.summary<0?'red':'green';

    this.totalFee = +(totalFee * this.marketInit.priceBaseUS).toFixed(2);

  }


}
