import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOGraphs} from '../line-chart/line-chart.component';
import {StochasticRSI} from '../../trader/libs/techind';

@Component({
  selector: 'app-stoch-rsi',
  templateUrl: './stoch-rsi.component.html',
  styleUrls: ['./stoch-rsi.component.css']
})
export class StochRsiComponent implements OnInit, OnChanges {

  @Input() closes: number[];

  myGraphs: VOGraphs;

  myTitle: string;
  area: number[];
  rsiPeriod = 14;
  stochasticPeriod = 14;
  kPeriod = 3;
  dPeriod = 3;

  constructor() {
  }

  ngOnChanges() {
    this.ctr();
  }

  ngOnInit() {
    this.myTitle = 'StochRSI(' + this.kPeriod + ',' + this.dPeriod + ',' + this.stochasticPeriod + ',' + this.rsiPeriod + ')';
  }

  ctr() {
    if (!Array.isArray(this.closes)) return;
    const length = this.closes.length;
    const input = {
      values: this.closes,
      rsiPeriod: this.rsiPeriod,
      stochasticPeriod: this.stochasticPeriod,
      kPeriod: this.kPeriod,
      dPeriod: this.dPeriod
    };

    const stochRSI = new StochasticRSI(input);
   //  console.log(stochRSI.getResult());
    const results: {stochRSI: number, k: number, d: number}[] = stochRSI.getResult();

    while (results.length < length) results.unshift({stochRSI: 0, k: 0, d: 0});
    const stchs = [];
    const ks = [];
    const ds = [];
    results.forEach(function (item) {
      stchs.push(item.stochRSI);
      ks.push(item.k);
      ds.push(item.d);
    });


    const gr: VOGraphs = {
      labelsX: [],
      graphs: [
       /* {
          label: '',
          color: 'green',
          ys:stchs,
          min:0,
          max:100
        },*/
        {
          label: '',
          color: 'red',
          ys: ds,
          min: 0,
          max: 100
        },
        {
          label: '',
          color: 'blue',
          ys: ks,
          min: 0,
          max: 100
        }
      ]
    };

    this.area = [
      20,
      80
    ];
    this.myGraphs = gr;


  }


}


// var inputStochasticRSI = {
//   values : [44.34,44.09,44.15,43.61,44.33,44.83,45.10,45.42,
// 45.84,46.08,45.89,46.03,45.61,46.28,46.28,46.00,46.03,46.41,46.22,45.64,46.21,46.
// 25,45.71,46.45,45.78,45.35,44.03,44.18,44.22,44.57,43.42,42.66,43.13],
//   rsiPeriod : 14,
//   stochasticPeriod : 14,
//   kPeriod : 3,
//   dPeriod : 3,
// };
