import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOGraphs} from '../line-chart/line-chart.component';
import {MFI, RSI} from '../../trader/libs/techind';
import {VOCandle} from '../../models/api-models';

@Component({
  selector: 'app-mfi-indicator',
  templateUrl: './mfi-indicator.component.html',
  styleUrls: ['./mfi-indicator.component.css']
})
export class MfiIndicatorComponent implements OnInit, OnChanges {

  @Input() candles: VOCandle[];

  myGraphs: VOGraphs;

  myTitle: string;
  area: number[];
  period:number = 14;

  constructor() { }

  ngOnInit() {
    this.myTitle = 'MFI('+ this.period + ')';
  }

  /*
  *   high:number[]
  low:number[]
  close:number[]
  volume:number[]
  period :number
  *
  * MFIInput*/

  ngOnChanges() {
    this.main();
  }

  main() {

    //  console.log(this.candles);
    //if (!Array.isArray(this.candles)) return;
    if (!Array.isArray(this.candles)) return;

    const input = {close:[], open:[], high:[], low:[], volume:[] , period:this.period};
      this.candles.forEach(function (item) {
      this.close.push(item.close);
      this.high.push(item.high);
      this.low.push(item.low);
      this.open.push(item.open);
      this.volume.push(item.Volume);
    }, input);


    const mfi = new MFI(input);
    const result = mfi.getResult();
    const out: number[] = result;
    // const length = this.closes.length
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
      20,
      80
    ];
    this.myGraphs = gr;

  }


}
