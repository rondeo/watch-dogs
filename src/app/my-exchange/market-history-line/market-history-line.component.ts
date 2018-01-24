import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {ConnectorApiService} from "../services/connector-api.service";
import {ApiBase} from "../services/api-base";
import {VOMarket, VOMarketHistory, VOOrder} from "../../models/app-models";
import {UtilsOrder} from "../utils-order";


@Component({
  selector: 'market-history-line',
  templateUrl: './my-market-history.component.html',
  styleUrls: ['./my-market-history.component.css']
})
export class MarketHistoryLineComponent implements OnInit, OnChanges, OnDestroy {



  lineChartData
  lineChartLabels:Array<any> =[];
  lineChartOptions:any = {
    responsive: true
  };

  lineChartColors:Array<any> = [
    { // grey
     // backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(255,0,0,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      //pointHoverBackgroundColor: '#fff',
      //pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
    { // dark grey
     // backgroundColor: 'rgba(77,83,96,0.2)',
      borderColor: 'rgba(0,255,0,1)',
      pointBackgroundColor: 'rgba(77,83,96,1)',
      pointBorderColor: '#fff',
      //pointHoverBackgroundColor: '#fff',
      //pointHoverBorderColor: 'rgba(77,83,96,1)'
    },
    { // grey
     // backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
     // pointHoverBackgroundColor: '#fff',
     // pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
    { // grey
      // backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      // pointHoverBackgroundColor: '#fff',
      // pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    }
  ];
  public lineChartLegend:boolean = false;
  public lineChartType:string = 'line';


 // @Input() market:string;
 // @Input() priceBaseUS:number;

  @Input() marketHistory:MarketHistoryData;
  @Input() removeMaxMin:boolean;

  private currentAPI:ApiBase;


  history:VOOrder[];

  constructor(
    private apiService:ConnectorApiService
  ) { }


  chartHovered(evt){

  }
  chartClicked(evt){

  }
  ngOnInit() {
  }

  render(){
    if(!this.marketHistory) return;

    let priceBaseUS = this.marketHistory.priceBaseUS;

    let history = this.marketHistory.history;

    let marketSummary = this.marketHistory.marketSummary;
    let start = history[0].timestamp;
    let end = history[history.length -1].timestamp;
    let diff = Math.round((end - start)/1000);
    let speed =  history.length / diff;

    let min = UtilsOrder.makeLine(marketSummary.Low * priceBaseUS,10);
    let max = UtilsOrder.makeLine(marketSummary.High * priceBaseUS, 10);

    let charts = UtilsOrder.createCharts(history);

    charts.bought = charts.bought.map(function (item) { return item * this.b },{b:priceBaseUS});
    charts.sold = charts.sold.map(function (item) { return item * this.b },{b:priceBaseUS});
   // console.warn(priceBaseUS);
    //console.log(charts);

    if(this.removeMaxMin){
      this.lineChartData = [
        {data:charts.sold.reverse(), fill:false, label:'Sell'},
        {data:charts.bought.reverse(), fill:false, label:'Buy'}
      ];
    }else{
      this.lineChartData = [
        {data:charts.sold.reverse(), fill:false, label:'Sell'},
        {data:charts.bought.reverse(), fill:false, label:'Buy'},
        {data:min, fill:false, label:'min'},
        {data:max, fill:false, label:'max'}
      ];
    }


    let M = diff/60;

    this.lineChartLabels  = ['', '', '', '', '', '', '', '','',''];

  }


/*

  onRfreshHistoryClick(){
    this.downloadHistory();
  }
*/

  //marketSummary:VOMarket
  currentMarketData:{summary:VOMarket, history:VOOrder[]}
  /*downloadHistory(){
    if(!this.market || !this.currentAPI) return;
    let ar = this.market.split('_');
    if(ar.length ===2) {
      this.currentAPI.downloadMarketHistory(ar[0], ar[1]);

      this.currentAPI.getMarketSummary(ar[0], ar[1]).then(res=>{
        console.log(res);
        this.marketSummary = res;

        this.render();
      })
    }
  }*/

  ngOnDestroy(){
    if(this.sub1) this.sub1.unsubscribe();
    if(this.sub2) this.sub2.unsubscribe();
  }
  private sub1;
  private sub2;

  ngOnChanges(changes){
   this.render();
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

export interface MarketHistoryData{
  priceBaseUS:number;
  history:VOOrder[];
  marketSummary:VOMarket;
}