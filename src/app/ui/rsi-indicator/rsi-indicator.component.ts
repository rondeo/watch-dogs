import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOCandle} from '../../models/api-models';
import {VOGraphs} from '../line-chart/line-chart.component';
import * as _ from 'lodash';
import {Rsi1} from '../../trader/libs/core/rsi1';

@Component({
  selector: 'app-rsi-indicator',
  templateUrl: './rsi-indicator.component.html',
  styleUrls: ['./rsi-indicator.component.css']
})
export class RsiIndicatorComponent implements OnInit, OnChanges {

  @Input() candles: VOCandle[];
  @Input() lasts: number[];

  myGraphs: VOGraphs;

  area: number[]
  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges() {
    this.ctr();
  }

  ctr() {
  //  console.log(this.candles);
    if (!Array.isArray(this.candles)) return;
    let mod = new Rsi1();
    mod.ctrModifier(this.candles);


   // console.log(this.candles);

    const out = this.candles.map(function (item: any) {
      return Number(item.rsi.value)
    });
    // console.log(out);


    const gr: VOGraphs = {
      labelsX: [],
      graphs: [
        {
          label: '',
          color: 'green',
          ys: out
        }
      ]
    };

    let min =  _.min(out);
    let max =  _.max(out);
   //  console.log(min, max);
    this.area = [
     min+= min * 0.2,
     max-= max*0.2
    ]
    this.myGraphs = gr;

  }

}
