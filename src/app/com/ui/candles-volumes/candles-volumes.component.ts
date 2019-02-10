import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOCandle} from '../../../models/api-models';

@Component({
  selector: 'app-candles-volumes',
  templateUrl: './candles-volumes.component.html',
  styleUrls: ['./candles-volumes.component.css']
})
export class CandlesVolumesComponent implements OnInit, OnChanges {

  @Input() candles: VOCandle[];
  volumes: number[];
  constructor() { }

  ngOnInit() {
  }

  ngOnChanges() {
    if (this.candles) {
      this.volumes = this.candles.map(function (o) {
        return o.open > o.close ? -o.Volume : o.Volume;
      });
    }
  }

}
