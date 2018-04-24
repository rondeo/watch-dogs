import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {MarketHistoryData} from "../market-history-line/market-history-line.component";
import {VOMarket, VOOrder} from "../../models/app-models";
import {MappersHistory, VOHistoryStats} from "../../com/mappers-history";
import {UtilsBooks} from "../../com/utils-books";
import * as _ from 'lodash';
import {MarketHistory} from "../services/utils/market-history";


@Component({
  selector: 'market-history-table',
  templateUrl: './market-history-table.component.html',
  styleUrls: ['./market-history-table.component.css']
})
export class MarketHistoryTableComponent implements OnInit, OnChanges {

  @Input() marketHistory:{history:VOOrder[],priceBaseUS:number};
  @Input() marketSummary:{summary:VOMarket, priceBaseUS:number};

  @Output() durationMin:EventEmitter<{durationMin:number, speedMin:number, volumeBase:number}> = new EventEmitter()

  constructor() { }


  marketVolumeChange:number = 0;
 // marketHistory:VOOrder[];
  historyStats0 = {
    historyBuy:[],
    historySell:[],
    sumBuy:0,
    sumSell:0,
    lenghtSell:0,
    lenghtBuy:0
  };
  historyStats:VOHistoryStats;
  historyStats1:VOHistoryStats;
  historyStats2:VOHistoryStats;

  marketDetails:VOMarket = new VOMarket();

  //market:string;
  speedD:string;

  historyLength:string;


  isBuying:boolean;

  isSellUp:boolean;
  isBuyUp:boolean;


  ngOnInit() {
  }


  renderSummary(){
    if(!this.marketSummary) return;



    let basePrice = this.marketSummary.priceBaseUS;
    let res = this.marketSummary.summary;


    let out:VOMarket = {
      Ask:parseFloat((res.Ask * basePrice).toPrecision(4)),
      Bid:parseFloat((res.Bid * basePrice).toPrecision(4)),
      High:parseFloat((res.High * basePrice).toPrecision(4)),
      Low:parseFloat((res.Ask * basePrice).toPrecision(4)),
      Last:parseFloat((res.Last * basePrice).toPrecision(4)),
      OpenBuyOrders:res.OpenBuyOrders,
      OpenSellOrders:res.OpenSellOrders,
      BaseVolume:Math.round(res.BaseVolume),
     // Volume:Math.round(res.BaseVolume),
      id:res.id,
      coin:res.coin,
      base:res.base,
      pair:res.pair

    }

    if(this.marketDetails.BaseVolume)  this.marketVolumeChange = (100 * (this.marketDetails.BaseVolume - out.BaseVolume)/this.marketDetails.BaseVolume);
    this.marketDetails = out;

  }
  marketHistrySell:VOOrder[];
  marketHistryBuy:VOOrder[];
  sumBuy:number;
  sumSell:number;
  lenghtSell:number;
  lenghBuy:number;

  marketHistoryTable:{amountBuy:string, rateBuy:string, amountSell:string, rateSell:string}[]

  renderHistory(){
    if(!this.marketHistory) return;

    let basePrice = this.marketHistory.priceBaseUS;

    let res = this.marketHistory.history;
    if(res.length === 0){

     // this.historyStats.bought = [];
      //this.historyStats.sold =[];
      return
    }
    //this.marketHistory = res;

   // console.log(res);
   this.historyStats0 =  MarketHistory.parseHistory(res);

   this.marketHistoryTable = MarketHistory.parseHistory2(res)

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

    this.durationMin.emit( {
      durationMin: +(sec/60),
      speedMin:speed,
      volumeBase:this.marketDetails.BaseVolume
    });
    //this.duration.emit(parseFloat(this.durationD));

    this.historyLength = l+'';
  }


  ngOnChanges(changes){
    if(changes.marketHistory) this.renderHistory();
    if(changes.marketSummary) this.renderSummary();
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

////////////////////////////

}
