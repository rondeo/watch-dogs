import {Component, OnInit} from '@angular/core';
import {CoinDayService} from "../services/coin-day.service";
import * as _ from 'lodash';

@Component({
  selector: 'app-coin-day',
  templateUrl: './coin-day.component.html',
  styleUrls: ['./coin-day.component.css']
})
export class CoinDayComponent implements OnInit {


  lineChartData;
  lineChartLabels: Array<any> = [];

  lineChartOptions: any = {
    responsive: true
  };


  lineChartColors: Array<any> = [
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
  public lineChartLegend: boolean = false;
  public lineChartType: string = 'line';



  static convertToScale(ar:number[], offset = 0):number[]{

    let min = _.min(ar);
    let max = _.max(ar);
    let range = max - min;
    return ar.map(function (item) {
      return  offset + (30 * (item-min))/range;
    });
  }

  constructor(private coinDay: CoinDayService) {
  }


  ngOnInit() {
    this.coinDay.getCoinDayMarketCap('BTC').subscribe((res: any) => {
      console.log(res);

      let volume_usd_24h = [];
      let available_supply = [];

      let market_cap_usd = [];


      let max_supply = [];
      let percent_change_1h = [];
      let percent_change_24h = [];

      let price_btc = [];

      let price_usd = [];
      let price_usdMin = 1e10;
      let price_usdMax = 0;

      let total_supply = [];
      let labels = [];


      res.data.forEach(function (item) {


        volume_usd_24h.push(+item['24h_volume_usd']);
        available_supply.push(+item.available_supply);
        market_cap_usd.push(+item.market_cap_usd);
        max_supply.push(+item.max_supply);
        percent_change_1h.push(+item.percent_change_1h);
        percent_change_24h.push(+item.percent_change_24h);
        price_btc.push(+item.price_btc);
        price_usd.push(+item.price_usd);
        total_supply.push(+item.total_supply);
        labels.push(' ')
      });


      //let market_cap_usdMin = _.min(market_cap_usd);
     // let market_cap_usdMax = _.max(market_cap_usd);

     // let market_cap_usdRange = market_cap_usdMax - market_cap_usdMin;

     /* market_cap_usd = market_cap_usd.map(function (item) {

        return  (100 * (item - market_cap_usdMin))/ market_cap_usdRange;
      });*/

      //let min =  (100 * market_cap_usdMin)/market_cap_usdRange


      this.lineChartData = [
        {data: CoinDayComponent.convertToScale(price_usd), fill: false, label: 'Sell'},
        {data: CoinDayComponent.convertToScale(volume_usd_24h), fill: false, label: 'Sell'},
        {data: percent_change_1h, fill: false, label: 'Sell'},
        {data: percent_change_24h, fill: false, label: 'Sell'}
      ];
      /* }else{
         this.lineChartData = [
           {data:charts.sold.reverse(), fill:false, label:'Sell'},
           {data:charts.bought.reverse(), fill:false, label:'Buy'},
         //  {data:min, fill:false, label:'min'},
          // {data:max, fill:false, label:'max'}
         ];
       }*/


      this.lineChartLabels = labels;
    })
  }

}
