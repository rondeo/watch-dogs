import {Component, Input, OnChanges, OnInit} from '@angular/core';

import {VOGraphs} from '../line-chart/line-chart.component';
import {MACD} from '../../trader/libs/techind';
import * as _ from 'lodash';
import {VOCandle} from '../../models/api-models';

@Component({
  selector: 'app-macd-indicator',
  templateUrl: './macd-indicator.component.html',
  styleUrls: ['./macd-indicator.component.css']
})
export class MacdIndicatorComponent implements OnInit, OnChanges {

  @Input() closes: number[];
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
    this.myTitle = 'MACD(' + this.fastPeriod + ',' + this.slowPeriod + ',' + this.signalPeriod + ')';
  }

  ngOnChanges() {
    this.draw();
  }

  draw() {

    if (!this.closes && !this.candles) return;
    const closes = this.candles ? _.map(this.candles, 'close') : this.closes;


    let macdInput = {
      values: closes,
      fastPeriod: this.fastPeriod,
      slowPeriod: this.slowPeriod,
      signalPeriod: this.signalPeriod,
      SimpleMAOscillator: true,
      SimpleMASignal: false
    };
    let macd = new MACD(macdInput);
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
    const length = closes.length;
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
          offsetY : offsetY
        }
      ]
    };
    this.myGraphs = graphs;
  }

}
