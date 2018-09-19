import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {VOCandle} from '../../models/api-models';
import {MATH} from '../../com/math';
import * as moment from 'moment';
import {VOGraphs} from '../line-chart/line-chart.component';
import {DrawGrid} from '../com/draw-grid';
import {DrawBase} from '../com/draw-base';

@Component({
  selector: 'app-volume-hist',
  templateUrl: './volume-hist.component.html',
  styleUrls: ['./volume-hist.component.css']
})
export class VolumeHistComponent extends DrawBase implements OnInit {

  @Input() candles: VOCandle[];
  @Input() area: number[];

  constructor() {
    super();
  }


  drawGraphs() {
    if (!this.candles || !this.widthG) return;
    const ar = this.candles;
    if (!Array.isArray(ar)) return;
    // const x0 = this.x0 + 50;
    const offsetY = this.heightG;
    const Y0 = this.y0;
    //const y0 = this.y0 - offsetY;
    const x0 = this.x0;

    let maxV = 0;

    ar.forEach(function (item) {
      if (item.Volume > maxV) maxV = item.Volume;
    });
    let scaleV = offsetY / maxV;
    // let range = max - min;
    // const height = Math.round(this.heightG - offsetY);

    let dx = this.widthG / (ar.length - 1);

    let ctx = this.ctx;

    for (let i = 0, n = ar.length; i < n; i++) {
      const x = x0 + (i * dx);
      const item: VOCandle = ar[i];
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = item.open < item.close ? 'green' : 'red';
      ctx.moveTo(x, Y0);
      ctx.lineTo(x, Y0 - (item.Volume * scaleV));
      ctx.stroke();
    }

    this.drawYs(maxV);
  }


  drawYs( maxV:number) {
    const step = (maxV) / 3;
    const out = [];
    for (let i = 0; i < maxV; i += step) out.push(Math.round(i))
    out.push(Math.round(maxV));
    const ctx = this.ctx;
    ctx.fillStyle = '#000000';
    ctx.font = '11px Arial';
    const x = this.widthG + this.paddingLeft + 5;
    let y = this.height - this.paddingBottom;

   //  const lastY = y - height;
    const step2 = Math.round(y  / 3);

    out.forEach(function (item) {
      ctx.fillText(item, x, y + 11);
      y-= step2;
    });

  }


}
