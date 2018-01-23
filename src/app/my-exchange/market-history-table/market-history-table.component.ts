import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {MarketHistoryData} from "../market-history-line/market-history-line.component";
import {VOMarket, VOMarketHistory, VOOrder} from "../../models/app-models";
import {MappersHistory, VOHistoryStats} from "../../com/mappers-history";
import {MappersBooks} from "../../com/mappers-books";
import * as _ from 'lodash';

@Component({
  selector: 'market-history-table',
  templateUrl: './market-history-table.component.html',
  styleUrls: ['./market-history-table.component.css']
})
export class MarketHistoryTableComponent implements OnInit, OnChanges {

  @Input() marketHistoryData:MarketHistoryData;

  constructor() { }


  marketVolumeChange:number = 0;
  marketHistory:VOOrder[];
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



  ngOnInit() {
  }


  render(){
    if(!this.marketHistoryData) return;



    let basePrice = this.marketHistoryData.priceBaseUS;
    let res = this.marketHistoryData.marketSummary;


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

  }

  render2(){
    if(!this.marketHistoryData) return;

    let basePrice = this.marketHistoryData.priceBaseUS;
    let res = this.marketHistoryData.history;
    this.marketHistory = res;
    this.historyStats = MappersHistory.parseData2(res, basePrice);

    this.isBuying = (+this.historyStats.sold.amount < +this.historyStats.bought.amount);

    let half = Math.round(res.length/2);


    let ar1 = _.take(res, half);
    let ar2 = _.takeRight(res, half);


    this.historyStats1 = MappersHistory.parseData2(ar1, basePrice);

   // this.calculateRate();

    this.historyStats2 = MappersHistory.parseData2(ar2, basePrice);
    this.isSellUp = this.historyStats1.sold.price > this.historyStats2.sold.price;
    this.isBuyUp = this.historyStats1.bought.price > this.historyStats2.bought.price;

    let l = res.length;
    let sec = MappersHistory.getHistoryDuration(res);
    let speed = l/sec * 60;

    this.speedD = speed<10?speed.toFixed(2):speed.toFixed(0);

    this.durationD = (sec/60).toPrecision(2);
    //this.duration.emit(parseFloat(this.durationD));

    this.historyLength = l+'';
  }


  ngOnChanges(changes){
    this.render();
    this.render2();
    /*  if(changes.market){

        this.marketSummary = null;
        this.history = null;
        this.downloadHistory();
      console.log(this.market);
      }

      if(changes.priceBaseUS){
        this.render();

      }

  */
  }
}
