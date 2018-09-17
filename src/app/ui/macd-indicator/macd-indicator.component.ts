import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {Macd} from '../../trader/libs/core/macd';
import {VOGraphs} from '../line-chart/line-chart.component';
import {MACD} from '../../trader/libs/techind';


@Component({
  selector: 'app-macd-indicator',
  templateUrl: './macd-indicator.component.html',
  styleUrls: ['./macd-indicator.component.css']
})
export class MacdIndicatorComponent implements OnInit, OnChanges {

  @Input() lasts: number[];

  fastPeriod = 12;
  slowPeriod = 26;
  signalPeriod = 9;
  allData: any;
  myTitle:string;
  constructor() {
  }

  myGraphs: VOGraphs;


  ngOnInit() {
    this.myTitle = 'MACD('+this.fastPeriod+','+this.slowPeriod+','+this.signalPeriod+')';
  }

  ngOnChanges() {
    this.draw();
  }

  draw() {
    if(!this.lasts) return;
    var macdInput = {
      values: this.lasts,
      fastPeriod: this.fastPeriod,
      slowPeriod: this.slowPeriod,
      signalPeriod: this.signalPeriod,
      SimpleMAOscillator: true,
      SimpleMASignal: false
    };
    var macd = new MACD(macdInput);
    const result: any[] = macd.getResult();
    this.allData = result;
   //  console.log(result);
    const macdV =[];
    const signals = [];
    const histogram = [];

    let maxHist = -1e9;
    let minHist = 1e9;
    result.forEach(function (item) {
      macdV.push(item.MACD);
      signals.push(item.signal);
      if(maxHist< item.histogram) maxHist = item.histogram;
      if(minHist > item.histogram) minHist = item.histogram;
      histogram.push(item.histogram);
    });
    const length = this.lasts.length;
    while(macdV.length< length) macdV.unshift(0);
    while(signals.length< length) signals.unshift(0);
    while(histogram.length< length) histogram.unshift(0);

    histogram[0] = -2 * maxHist;
    histogram[1] = 2 * maxHist;

    const graphs: VOGraphs = {
      labelsX: [],
      graphs: [
        {
          label: '',
          color: 'blue',
          ys: macdV
        },
        {
          label: '',
          color: 'red',
          ys: signals
        },
        {
          label: '',
          color: 'grey',
          ys: histogram
        }
      ]
    }
    this.myGraphs = graphs;
  }

}
