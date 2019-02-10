import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOGraphs} from '../line-chart/line-chart.component';
import * as _ from 'lodash';
import {MACD} from '../../../trader/libs/techind';
import {VOCandle} from '../../../models/api-models';
import {VWMACD} from '../../../trader/libs/techind/moving_averages/VWMACD';

@Component({
  selector: 'app-vwmacd-indicator',
  templateUrl: './vwmacd-indicator.component.html',
  styleUrls: ['./vwmacd-indicator.component.css']
})
export class VwmacdIndicatorComponent implements OnInit, OnChanges {


  @Input() candles: VOCandle[];

  fastPeriod = 12;
  slowPeriod = 26;
  signalPeriod = 9;
  allData: any;
  myTitle: string;

  constructor() {
  }

  myGraphs: VOGraphs;

  ngOnInit() {
    this.myTitle = 'VWMACD(' + this.fastPeriod + ',' + this.slowPeriod + ',' + this.signalPeriod + ')';
  }

  ngOnChanges() {
    this.draw();
  }

  draw() {

    if (!this.candles) return;
    const closesv = this.candles.map(function (item) {
      return [item.close, item.Volume];
    });

    let macdInput = {
      values: closesv,
      fastPeriod: this.fastPeriod,
      slowPeriod: this.slowPeriod,
      signalPeriod: this.signalPeriod,
      SimpleMAOscillator: true,
      SimpleMASignal: false
    };
    const macd = new VWMACD(macdInput);
    const result: any[] = macd.getResult();
    this.allData = result;
    //  console.log(result);
    const macdV = [];
    const signals = [];
    const histogram = [];

    let maxHist = -1e9;
    let minHist = 1e9;
    let min = 1e12;
    let max = -1e12;
    result.forEach(function (item) {
      if (min > item.MACD) min = item.MACD;
      if (max < item.MACD) max = item.MACD;
      if (min > item.signal) min = item.signal;
      if (max < item.signal) max = item.signal;
      macdV.push(item.MACD);
      signals.push(item.signal);
      if (maxHist < item.histogram) maxHist = item.histogram;
      if (minHist > item.histogram) minHist = item.histogram;
      histogram.push(item.histogram);
    });
    const length = this.candles.length;
    while (macdV.length < length) macdV.unshift(0);
    while (signals.length < length) signals.unshift(0);
    while (histogram.length < length) histogram.unshift(0);

    // console.warn(min);
    const ampl = (max - min);

    const mid = (max - min) / 2;
    // console.warn(mid);

    const rel = (ampl - mid) / ampl;
    // console.log(rel);

    const offsetY = (2 * maxHist) * rel;

    // console.log(2 * maxHist, offsetY)
    const graphs: VOGraphs = {
      labelsX: [],
      graphs: [
        {
          label: '',
          color: 'blue',
          ys: macdV,
          min: min,
          max: max,
          draw0: true
        },
        {
          label: '',
          color: 'red',
          ys: signals,
          min: min,
          max: max
        },
        {
          label: '',
          color: 'grey',
          ys: histogram,
          min: -3 * maxHist,
          max: 3 * maxHist,
          hist: true,
          offsetY: offsetY
        }
      ]
    };
    this.myGraphs = graphs;
  }


}
