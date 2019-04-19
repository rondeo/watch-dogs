import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {VOGraphs} from '../line-chart/line-chart.component';
import {MFI, RSI} from '../../../trader/libs/techind';
import {VOCandle} from '../../../amodels/api-models';

@Component({
  selector: 'app-mfi-indicator',
  templateUrl: './mfi-indicator.component.html',
  styleUrls: ['./mfi-indicator.component.css']
})
export class MfiIndicatorComponent implements OnInit, OnChanges {

  @Input() candles: VOCandle[];
  @Output() mfi: EventEmitter<number[]> = new EventEmitter()

  myGraphs: VOGraphs;

  myTitle: string;
  area: number[];
  period = 14;

  constructor() { }

  ngOnInit() {
    this.myTitle = 'MFI(' + this.period + ')';
  }



  ngOnChanges() {
    this.main();
  }

  main() {

    if (!Array.isArray(this.candles)) return;

    const input = {close: [], open: [], high: [], low: [], volume: [] , period: this.period};
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
     const length = this.candles.length;
    while (out.length < length) out.unshift(50);

    this.mfi.emit(out);
    const gr: VOGraphs = {
      labelsX: [],
      graphs: [
        {
          label: '',
          color: 'green',
          ys: out,
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
