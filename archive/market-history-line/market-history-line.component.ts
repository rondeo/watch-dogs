import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output} from '@angular/core';
import {ConnectorApiService} from "../../src/app/my-exchange/services/connector-api.service";
import {ApiBase} from "../../src/app/my-exchange/services/apis/api-base";
import {VOMarket, VOOrder} from "../../src/app/models/app-models";
import {UtilsOrder} from "../../src/app/com/utils-order";
import * as _ from 'lodash';


@Component({
  selector: 'market-history-line',
  templateUrl: './my-market-history.component.html',
  styleUrls: ['./my-market-history.component.css']
})
export class MarketHistoryLineComponent implements OnInit, OnChanges, OnDestroy {



  @Output() tolerance:EventEmitter<number> = new EventEmitter();
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

  @Input() marketHistory:{history:VOOrder[],priceBaseUS:number};
  @Input() marketSummary:{summary:VOMarket, priceBaseUS:number};
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

  renderHistory(){
    if(!this.marketHistory) return;

    let priceBaseUS = this.marketHistory.priceBaseUS;

    let history = this.marketHistory.history;

    if(history.length===0){
      this.lineChartData = [
        {data:[], fill:false, label:'Sell'},
        {data:[], fill:false, label:'Buy'}
      ];

      return
    };

    //let marketSummary = this.marketSummary.summary;

    let start = history[0].timestamp;
    let end = history[history.length -1].timestamp;
    let diff = Math.round((end - start)/1000);
    let speed =  history.length / diff;



   // let min = UtilsOrder.makeLine(marketSummary.Low * priceBaseUS,10);
   // let max = UtilsOrder.makeLine(marketSummary.High * priceBaseUS, 10);

    let charts = UtilsOrder.createCharts(history);

    charts.bought = charts.bought.map(function (item) { return item * this.b },{b:priceBaseUS});
    charts.sold = charts.sold.map(function (item) { return item * this.b },{b:priceBaseUS});

    console.log(charts);


    let maxValue = _.max(charts.bought);
    let minValue = _.min(charts.sold);
    let tolerance = ((maxValue - minValue)/minValue) * 100;
    this.tolerance.next(tolerance);

   // console.warn(priceBaseUS);
    //console.log(charts);

    //if(this.removeMaxMin){
      this.lineChartData = [
        {data:charts.sold.reverse(), fill:false, label:'Sell'},
        {data:charts.bought.reverse(), fill:false, label:'Buy'}
      ];
   /* }else{
      this.lineChartData = [
        {data:charts.sold.reverse(), fill:false, label:'Sell'},
        {data:charts.bought.reverse(), fill:false, label:'Buy'},
      //  {data:min, fill:false, label:'min'},
       // {data:max, fill:false, label:'max'}
      ];
    }*/


    let M = diff/60;

    this.lineChartLabels  = ['', '', '', '', '', '', '', '','','',''];//charts.timestamps.reverse();// ['', '', '', '', '', '', '', '','',''];



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
    if(changes.marketHistory) this.renderHistory();
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
  buy:VOOrder[];
  sell:VOOrder[];
}