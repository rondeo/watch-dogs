import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOCandle} from '../../models/api-models';
import {VOGraphs} from '../line-chart/line-chart.component';
import * as _ from 'lodash';

import {RSI} from '../../trader/libs/techind';

@Component({
  selector: 'app-rsi-indicator',
  templateUrl: './rsi-indicator.component.html',
  styleUrls: ['./rsi-indicator.component.css']
})
export class RsiIndicatorComponent implements OnInit, OnChanges {

  @Input() closes: number[];

  myGraphs: VOGraphs;

  myTitle: string;
  area: number[];
  period:number = 14;
  constructor() {
  }

  ngOnInit() {
    this.myTitle = 'RSI('+ this.period + ')';
  }

  ngOnChanges() {
    this.ctr();
  }

  ctr() {

        //  console.log(this.candles);
    //if (!Array.isArray(this.candles)) return;
    if (!Array.isArray(this.closes)) return;
    const input = {
      period: this.period,
      values: this.closes
    }
    const rsi = new RSI(input);
    const result = rsi.getResult();
    const out: number[] = result;
    const length = this.closes.length
    while(out.length < length) out.unshift(0);
    // console.log(result);
    // let mod = new Rsi1();
    //mod.ctrModifier(this.candles);


    // console.log(this.candles);

    /* const out = this.candles.map(function (item: any) {
       return Number(item.rsi.value)
     });*/
    // console.log(out);

   //  console.log(out);
    const gr: VOGraphs = {
      labelsX: [],
      graphs: [
        {
          label: '',
          color: 'green',
          ys: out,
          min:0,
          max:100
        }
      ]
    };

    this.area = [
      30,
      70
    ];
    this.myGraphs = gr;

  }

}
