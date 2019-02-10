import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {VOCandle} from '../../../amodels/api-models';
import {MATH} from '../../../acom/math';
import * as moment from 'moment';
import {VOGraphs} from '../line-chart/line-chart.component';
import {DrawBase} from '../com/draw-base';
import * as _ from 'lodash';

@Component({
  selector: 'app-volume-hist',
  templateUrl: './volume-hist.component.html',
  styleUrls: ['./volume-hist.component.css']
})
export class VolumeHistComponent extends DrawBase{

  constructor() {
    super('VolumeHistComponent');
  }

  @Input() values: number[];

  maxV;

  drawGraphs() {
    const ar = this.values;
    if (!ar || !this.widthG) return;

    if (!Array.isArray(ar)) return;
    // const x0 = this.x0 + 50;
    const offsetY = this.heightG;
    const Y0 = this.y0;
    // const y0 = this.y0 - offsetY;
    const x0 = this.x0;

    let maxV = 0;

    ar.forEach(function (item) {
      const v = Math.abs(item);
      if (v > maxV) maxV = v;
    });
    let scaleV = offsetY / maxV;
    // let range = max - min;
    // const height = Math.round(this.heightG - offsetY);

    let dx = this.widthG / (ar.length - 1);

    let ctx = this.ctx;

    for (let i = 0, n = ar.length; i < n; i++) {
      const x = x0 + (i * dx);
      const item = ar[i];
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = item > 0 ? 'green' : 'red';
      ctx.moveTo(x, Y0);
      ctx.lineTo(x, Y0 - (Math.abs(item * scaleV)));
      ctx.stroke();
    }
    this.maxV = maxV;
    //  this.drawYs();
  }

  drawYs() {
    const maxV: number = this.maxV;
    const step = (maxV) / 3;
    const out = [];
    for (let i = 0; i < maxV; i += step) out.push(Math.round(i));
    out.push(Math.round(maxV));
    const ctx = this.ctx;
    ctx.fillStyle = '#000000';
    ctx.font = this.font;
    const x = this.widthG + this.paddingLeft + 5;
    let y = this.height - this.paddingBottom;

    //  const lastY = y - height;
    const step2 = Math.round(y / 3);

    out.forEach(function (item) {
      ctx.fillText(item, x, y + 11);
      y -= step2;
    });

  }


}
