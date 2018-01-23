import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {BittrexService} from "../../exchanges/services/bittrex.service";
import {VOMarket, VOMarketHistory} from "../../models/app-models";
import * as moment from "moment";
import * as _ from 'lodash';
import {MarketCapService} from "../../market-cap/market-cap.service";
import {MappersBooks} from "../../com/mappers-books";
import {MappersHistory, VOHistoryStats} from "../../com/mappers-history";
import {MatSnackBar} from "@angular/material";



@Component({
  selector: 'app-market-history',
  templateUrl: './market-history.component.html',
  styleUrls: ['./market-history.component.css']
})
export class MarketHistoryComponent implements OnInit, OnChanges {

  @Input() base:string;
  @Input() coin:string;
  @Input() priceBaseUS:number;

  @Output() rateAvarage = new EventEmitter();
  @Output() duration = new EventEmitter();



  marketVolumeChange:number = 0;
  marketHistory:VOMarketHistory[];
  historyStats:VOHistoryStats;
  historyStats1:VOHistoryStats;
  historyStats2:VOHistoryStats;

  marketDetails:VOMarket = new VOMarket();

  //market:string;
  speedD:string;
  durationD:string;
  historyLength:string;
  isHistoryLoading:boolean;

  isBuying:boolean;

  isSellUp:boolean;
  isBuyUp:boolean;


  refreshCount:number;

  MC:any;

  timeoutAutoRefresh;
  intervalCount;

  isAuto:boolean;



  constructor(
    private route:ActivatedRoute,
    private publicService:BittrexService,
    private snackBar:MatSnackBar
  ) { }


  onAutoClick(evt){
    console.log(evt);
    this.isAuto = evt.checked;
    if(this.isAuto) this.startAutoRefresh();
    else this.stopAutoRefresh();
  }

  ngOnChanges(changes: SimpleChanges){

    //console.log(changes);

   if(changes.coin || changes.base){
     if(this.coin && this.base){
      // this.market = this.base+'_' + this.market;
       this.loadMarketHistory();
       this.loadMarketDetails();


     }
   }
   if(changes.priceBaseUS){
     this.loadMarketHistory();
     this.loadMarketDetails();
   }
  }


  ngOnInit() {

  }

  loadMarketDetails(){
    if(!this.base || !this.coin || !this.priceBaseUS) return;
    this.publicService.getMarketSummary(this.base, this.coin).subscribe(res=>{
      console.log(res);
      let basePrice = this.priceBaseUS;


       let out:VOMarket = {
        Ask:parseFloat((res.Ask * basePrice).toPrecision(4)),
        Bid:parseFloat((res.Bid * basePrice).toPrecision(4)),
        High:parseFloat((res.High * basePrice).toPrecision(4)),
        Low:parseFloat((res.Ask * basePrice).toPrecision(4)),
        Last:parseFloat((res.Last * basePrice).toPrecision(4)),
        OpenBuyOrders:res.OpenBuyOrders,
        OpenSellOrders:res.OpenSellOrders,
        BaseVolume:Math.round(res.BaseVolume * basePrice),
        Volume:Math.round(res.BaseVolume),
        id:res.id,
        coin:res.coin,
        base:res.base,
        pair:res.pair

      }

      if(this.marketDetails.BaseVolume)  this.marketVolumeChange = (100 * (this.marketDetails.BaseVolume - out.BaseVolume)/this.marketDetails.BaseVolume);
      this.marketDetails = out;
    })


  }

  refreshMarketHistory(){
    this.loadMarketHistory();
    this.loadMarketDetails();
  }

  stopAutoRefresh(){
    this.refreshCount = 0;
    clearTimeout(this.timeoutAutoRefresh);
    clearInterval(this.intervalCount);
  }

  startAutoRefresh(){
    if(this.isAuto){
      this.setRefreshCount();
      this.intervalCount = setInterval(()=>{
        this.refreshCount--;

      }, 1000);
      this.loadMarketHistory();
    }
  }

  private setRefreshCount(){
    let min = +this.durationD/2;
    if(min < 0.5) min = 0.5;
    let sec = (min * 60);
    this.refreshCount = Math.round(sec);
  }

  onRefreshDone(){
    this.isHistoryLoading = false;
    if(this.isAuto){
      this.setRefreshCount();
      clearTimeout(this.timeoutAutoRefresh);
      this.timeoutAutoRefresh = setTimeout(()=>this.loadMarketHistory(), this.refreshCount * 1000);
    }else {
      this.stopAutoRefresh();
    }

  }

  calculateRate(){
   let rate =  (this.historyStats1.sold.price + this.historyStats1.bought.price)/2;
    this.rateAvarage.emit(rate);
  }

  loadMarketHistory(){

    if(!this.base || !this.coin || !this.priceBaseUS) return;

    this.isHistoryLoading = true;

      this.publicService.getMarketHistory(this.base, this.coin).toPromise().then(res=>{

      this.marketHistory = res;
      let basePrice = this.priceBaseUS;
      console.log(res);

      this.historyStats = MappersHistory.parseData(res, basePrice);



      this.isBuying = (+this.historyStats.sold.amount < +this.historyStats.bought.amount);

      let half = Math.round(res.length/2);
      let ar1 = _.take(res, half);
      let ar2 = _.takeRight(res, half);

      this.historyStats1 = MappersHistory.parseData(ar1, basePrice);
      this.calculateRate();

      this.historyStats2 = MappersHistory.parseData(ar2, basePrice);
      this.isSellUp = this.historyStats1.sold.price > this.historyStats2.sold.price;
      this.isBuyUp = this.historyStats1.bought.price > this.historyStats2.bought.price;


        let l = res.length
        let sec = MappersBooks.getHistoryDuration(res);
        let speed = l/sec * 60;

        this.speedD = speed<10?speed.toFixed(2):speed.toFixed(0);

        this.durationD = (sec/60).toPrecision(2);
        this.duration.emit(parseFloat(this.durationD));

        this.historyLength = l+'';

        this.onRefreshDone();

    } , (err)=>{

        this.onRefreshDone();

        this.snackBar.open('History error ','x', {duration:3000, extraClasses:'alert-red'});
    })
  }

}




/*
export interface VOHistoryStats{
  sold:{amount:string, price:string, priceUS:string};
  bought:{amount:string, price:string, priceUS:string};
  maxSold:{amount:string, price:string, priceUS:string};
  maxBought:{amount:string, price:string, priceUS:string};
}

class HistoryMapper{

  static parseData(ar:VOMarketHistory[], isBase:boolean, priceMC:number):VOHistoryStats{

    let totalSell:number = 0;
    let totalBuy:number = 0;
    let sumBuy:number = 0;
    let sumSell:number = 0;
    let spentBuy:number = 0;
    let spentSell:number = 0;

    let maxBought:number = 0;
    let maxSold:number = 0;
    let maxPriceBought:number = 0;
    let maxPriceSold:number = 0;

    let qtySell:number = 0;
    let qtyBuy:number = 0;
    let maxCoinSell:number = 0;
    let maxCoinBuy:number = 0;

    ar.forEach(function (item) {
      if(item.OrderType === 'SELL'){
        qtySell += item.Quantity;
        totalSell += item.Total;
        sumSell+= item.Price;
        spentSell+= item.Total * item.Price;
        if(item.Total> maxSold) {
          maxCoinSell = item.Quantity;
          maxSold = item.Total;
          maxPriceSold = item.Price;
          // maxAmountSold = item.Total;
        }
      }else if(item.OrderType === 'BUY'){
        qtyBuy += item.Quantity;
        totalBuy += item.Total;
        sumBuy +=item.Price;
        spentBuy+= item.Total * item.Price;
        if(item.Total> maxBought) {
          maxCoinBuy = item.Quantity;
          maxBought = item.Total;
          maxPriceBought = item.Price;
          // maxAmountBought = item.Total;
        }
      }

    });



   return {
     sold:{
       amount:(isBase?qtySell:totalSell).toFixed(2),
       price:totalSell?(spentSell/totalSell).toFixed(8):'0',
       priceUS:totalSell?(spentSell/totalSell * priceMC).toFixed(2):'0'
     },
     bought:{
       amount:(isBase?qtyBuy:totalBuy).toFixed(2),
       price:totalBuy?(spentBuy/totalBuy).toFixed(8):'0',
       priceUS:totalBuy?(spentBuy/totalBuy * priceMC).toFixed(3):'0',
     },
     maxSold:{
       amount:(isBase?maxCoinSell:maxSold).toFixed(2),
       price:maxPriceSold.toFixed(8),
       priceUS:(maxPriceSold*priceMC).toFixed(3)
     },
     maxBought:{
       amount:(isBase?maxCoinBuy:maxBought).toFixed(2),
       price:maxPriceBought.toFixed(8),
       priceUS:(maxPriceBought*priceMC).toFixed(3)
     }
   }

  }
}*/
