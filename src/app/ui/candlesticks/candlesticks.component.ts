import {AfterViewInit, Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import {MATH} from '../../com/math';


export interface VOCandleMin {
  h: number;
  l: number;
  o: number;
  c: number;
  t: number;
  v: number;
}

export interface VOGraphs {
  labelsX: string[];
  candles: VOCandleMin[];
}


@Component({
  selector: 'app-candlesticks',
  templateUrl: './candlesticks.component.html',
  styleUrls: ['./candlesticks.component.css']
})
export class CandlesticksComponent implements OnInit, AfterViewInit, OnChanges {

  @ViewChild('graphs') canv;
  @ViewChild('myContainer') container;
  private ctx: CanvasRenderingContext2D;
  @Input() graphs: VOGraphs;

  ratio: number = 600 / 400;
  width: number = 600;
  height: number = 400;
  widthG: number = 0;
  heightG: number = 0;
  vertical = 12;
  horizont = 10;
  padding = 10;
  paddingTop = 30;
  paddingBottom = 20;
  paddingLeft = 10;
  paddingRight = 50;
  y0: number;
  x0: number;

  static convertToScale(item: VOCandleMin, scale: number, min: number): VOCandleMin {
    return {
      h: Math.round((item.h - min) * scale),
      l: Math.round((item.l - min) * scale),
      o: Math.round((item.o - min) * scale),
      c: Math.round((item.c - min) * scale),
      t: item.t,
      v: item.v
    }

  }

  constructor() {
  }


  private drawGraphs() {
    if (!this.graphs) return;
    const ar = this.graphs.candles;
    if (!Array.isArray(ar)) return;
    // const x0 = this.x0 + 50;
    const offsetY = Math.round(this.heightG * 0.3);


    const Y0 = this.y0;
    //const y0 = this.y0 - offsetY;
    const x0 = this.x0;

    let maxV = 0;
    let min = 100000000000000000;
    let max = -100000000000000;
    ar.forEach(function (item) {
      if (item.l < min) min = item.l;
      if (item.h > max) max = item.h;
      if (item.v > maxV) maxV = item.v;
    });

    let scaleV = offsetY / maxV;
    let range = max - min;
    const height = Math.round(this.heightG - offsetY);

    let dx = this.widthG / (ar.length - 1);

    let ctx = this.ctx;
    const scale = height / (range || 1);

    const Yo = this.y0 - offsetY + (min * scale);

    for (let i = 0, n = ar.length; i < n; i++) {
      const x = x0 + (i * dx);
      const item: VOCandleMin = ar[i];// CandlesticksComponent.convertToScale(ar[i], scale, min);
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#333333';
      ctx.moveTo(x, Yo - (item.l * scale));
      ctx.lineTo(x, Yo - (item.h * scale));
      ctx.stroke();
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = item.o < item.c ? 'green' : 'red';
      ctx.moveTo(x, Yo - (item.o * scale));
      ctx.lineTo(x, Yo - (item.c * scale));
      ctx.moveTo(x, Y0);
      ctx.lineTo(x, Y0 - (item.v * scaleV));
      ctx.stroke();
    }
    this.drawYs(offsetY, height, min, max, maxV);
  }


  drawYs(offsetY: number, height: number, min: number, max: number, maxV:number) {

    const step = (max - min) / 7;
    const out = [];
    for (let i = min; i < max; i += step) out.push(MATH.toString(i))
    out.push(MATH.toString(max));
    const ctx = this.ctx;
    ctx.fillStyle = '#000000';
    ctx.font = '11px Arial';
    const x = this.widthG + this.paddingLeft + 5;
    let y = this.height - this.paddingBottom - offsetY;
    const lastY = y - height;
    const step2 = Math.round((y - lastY) / 7);

    out.forEach(function (item) {
      ctx.fillText(item, x, y + 3);
      y-= step2;
    });

    ctx.fillStyle = '#550000';
    ctx.font = '8px Arial';
    const yV = (this.height - this.paddingBottom - offsetY) + step2 * 2;
    const firstV = Math.round(maxV /3).toString();
    ctx.fillText(firstV, x, yV );

  }

  private resize;

  ngOnInit() {
    window.addEventListener('resize', event => {
      clearTimeout(this.resize);
      this.resize = setTimeout(() => this.onResize(), 500);
    });
  }

  onResize() {
    this.setSize();
  }

  setSize() {
    const ctx = this.ctx;
    this.width = Math.round(this.container.nativeElement.offsetWidth - 20);
    this.height = Math.round(this.width / this.ratio);
    this.widthG = this.width - this.paddingRight - this.paddingLeft;

    this.heightG = this.height - this.paddingBottom - this.paddingTop;
    this.x0 = this.paddingLeft;
    this.y0 = this.paddingTop + this.heightG;
    setTimeout(() => this.redraw(), 100);
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (!this.graphs || !this.widthG) return;
    this.drwaHorizonts();
    this.drwaVerticals();
    this.drawGraphs();
    this.drawXs();
  }

  private createLabels(): string[] {
    const ar = this.graphs.candles;
    const from = ar[0].t;
    const to = ar[ar.length - 1].t;
    const step = Math.floor((to - from) / 12);
    const out: string[] = [];
    for (let i = from; i < to; i += step) {
      out.push(moment(Math.round(i)).format('HH:mm'));
    }
    out.push(moment(to).format('HH:mm'));
    return out;
  }

  private drawXs() {

    let ctx = this.ctx;
    let ar: string[] = this.graphs.labelsX;
    if (!Array.isArray(ar)) {
      ar = this.createLabels();
    }
    let step = (this.widthG + (this.widthG / 12)) / ar.length;
    let y = this.height;
    let x0 = this.paddingLeft - 10;

    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ar.forEach(function (item, i) {
      ctx.fillText(item, x0 + (i * step), y);
    });
  }

  private drwaHorizonts() {
    let ctx = this.ctx;
    ctx.fillStyle = 'black';
    ctx.lineWidth = 0.3;
    let n = this.horizont;
    let offsetY = this.paddingTop;
    let offsetX = this.paddingLeft;
    let width = this.widthG;

    let step = Math.round(this.heightG / n);

    for (let i = 0; i < n + 1; i++) {
      let pozY = offsetY + (step * i);
      ctx.beginPath();
      ctx.moveTo(offsetX, pozY);
      ctx.lineTo(offsetX + width, pozY);
      ctx.stroke();
    }
  }

  private drwaVerticals() {
    let ctx = this.ctx;
    ctx.fillStyle = 'black';
    ctx.lineWidth = 0.3;
    let n = this.vertical;
    //console.warn(n);

    let offsetY = this.paddingTop;
    let offsetX = this.paddingLeft;
    let step =this.widthG / n;
    // console.warn(step);
    let height = this.heightG;
    for (let i = 0; i < n + 1; i++) {
      let posX = offsetX + (step * i);
      ctx.beginPath();
      ctx.moveTo(posX, offsetY);
      ctx.lineTo(posX, offsetY + height);
      ctx.stroke();
    }
  }


  ngAfterViewInit() {
    let el: HTMLCanvasElement = this.canv.nativeElement;
    this.ctx = el.getContext('2d');
    // if (this.graphs) this.drawData();
    setTimeout(() => this.setSize(), 100);
  }

  ngOnChanges(evt) {

    if (this.ctx) this.redraw();

  }
}
