import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOCandle} from '../../models/api-models';
import {Stochastic} from '../../trader/libs/techind';
import {StochasticInput} from '../../trader/libs/techind/momentum/Stochastic';
import {VOGraphs} from '../line-chart/line-chart.component';

@Component({
  selector: 'app-stoch',
  templateUrl: './stoch.component.html',
  styleUrls: ['./stoch.component.css']
})
export class StochComponent implements OnInit, OnChanges {

  myTitle: string;
  @Input() closes: number[];
  @Input() highs: number[];
  @Input() lows: number[];
  period = 14;
  signalPeriod = 3;


  area: number[]

  myGraphs: VOGraphs;
  constructor() { }

  ngOnInit() {
    this.area =  [200, 800];
    this.myTitle = 'Stoch(' + this.period +','+this.signalPeriod + ')';
  }

  ngOnChanges(){
   this.ctr();
  }

  ctr(){
    if(!this.closes || !this.lows || !this.highs) return;
    const input: StochasticInput = {
      high: this.highs,
      low: this.lows,
      close: this.closes,
      period: this.period,
      signalPeriod: this.signalPeriod
    };

    const stochastic = new Stochastic(input);
    const result:any[] = stochastic.getResult();
    const ds:number[] = [];
    const ks:number[] = [];
    let min = 1e12;
    let max = 1e12;

    result.forEach(function (item) {
      if(min > item.d) min = item.d;
      if(max < item.d) max = item.d;
      if(min > item.k) min = item.k;
      if(max < item.k) max = item.k;

      ds.push(Math.round(item.d * 10));
      ks.push(Math.round(item.k * 10));
    });

    //console.log(ds);
    const g: VOGraphs = {
      labelsX:[],
      graphs:[
        {
          label: '',
          color: 'blue',
          ys: ks,
          max: 1000,
          min: 0
        },
        {
          label: '',
          color: 'red',
          ys: ds,
          max: 1000,
          min: 0
        }
      ]
    }

    this.myGraphs = g;

   // console.log(g);

  }

}
