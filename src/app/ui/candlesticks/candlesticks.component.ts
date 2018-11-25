import {AfterViewInit, Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import {MATH} from '../../com/math';
import {VOCandle} from '../../models/api-models';
import {LinesOverlay} from './lines-overlay';

export enum EnumOverlay {
  SUPPORT_RESISTANCE
}

@Component({
  selector: 'app-candlesticks',
  templateUrl: './candlesticks.component.html',
  styleUrls: ['./candlesticks.component.css']
})
export class CandlesticksComponent implements OnInit, AfterViewInit, OnChanges {

  /*static convertToScale(item: VOCandleMin, scale: number, min: number): VOCandleMin {
    return {
      h: Math.round((item.h - min) * scale),
      l: Math.round((item.l - min) * scale),
      o: Math.round((item.o - min) * scale),
      c: Math.round((item.c - min) * scale),
      t: item.t,
      v: item.v
    }

  }*/

  constructor() {
  }


  @ViewChild('graphs') canv;
  @ViewChild('myContainer') container;
  @ViewChild('myOverlay') overlayView;
  private ctx: CanvasRenderingContext2D;
  private overlayCTX: CanvasRenderingContext2D;
  @Input() candles: VOCandle[];

  @Input() myWidth: number;
  @Input() myHeight: number;

  @Input() overlays: EnumOverlay[];

  ratio: number = 600 / 250;
  width = 600;
  height = 250;
  widthG = 0;
  heightG = 0;
  vertical = 12;
  horizont = 6;
  padding = 10;
  paddingTop = 30;
  paddingBottom = 20;
  paddingLeft = 10;
  paddingRight = 50;
  y0: number;
  x0: number;

  font = '9px Arial';

  linesOverlay: LinesOverlay;

  gX0: number;
  scaleX: number;
  gY0: number;
  gScaleY: number;

  private resize;

  startPoint: { x: number, y: number };

  isMouseMove = false;

  moveElement;
  onMouseMoveHandler: EventListenerOrEventListenerObject = this.onMouseMove.bind(this);

  private clicks = 0;

  async drawOverlay() {

    this.linesOverlay.clear(this.width, this.height);
    if (!this.overlays || !this.overlays.length) return;
    // console.error(this.overlays);
    if (this.overlays.indexOf(EnumOverlay.SUPPORT_RESISTANCE) !== -1) await this.linesOverlay.addResistance(this.candles);
    await this.linesOverlay.drawLines(this.gX0, this.scaleX, this.gY0, this.gScaleY);

  }

  private drawGraphs() {
    if (!this.candles) return;
    const ar = this.candles;
    if (!Array.isArray(ar)) return;
    // const x0 = this.x0 + 50;
    // const offsetY = 0;// Math.round(this.heightG * 0.3);


    // const Y0 = this.y0;
    // const y0 = this.y0 - offsetY;
    // const x0 = this.x0;

    let maxV = 0;
    let min = 100000000000000000;
    let max = -100000000000000;
    ar.forEach(function (item) {
      if (item.low < min) min = item.low;
      if (item.high > max) max = item.high;
    });

    // let scaleV = offsetY / maxV;
    let range = max - min;


    const height = Math.round(this.heightG);

    let dx = this.widthG / (ar.length - 1);

    const minX = ar[0].to;
    const maxX = ar[ar.length - 1].to;
    const rangeX = maxX - minX;

    const scaleX = this.widthG / rangeX;


    let ctx = this.ctx;


    const dateFrom = moment(_.first(ar).to).format('MM/DD HH:mm');
    const dateTo = moment(_.last(ar).to).format('MM/DD HH:mm');
    const percentRange = (100 * range / min).toFixed(2);
    ctx.font = this.font;
    ctx.fillText(percentRange + '% ' + dateFrom + ' - ' + dateTo, this.widthG / 2, 22);


    const scaleY = height / (range || 1);

    const Yo = this.y0 + (min * scaleY);


    // this.gX0 = this.x0 + (minX * scaleX);

    const x0 = this.x0 - (minX * scaleX);

    this.gX0 = x0;
    this.scaleX = scaleX;

    this.gY0 = Yo;
    this.gScaleY = scaleY;

    for (let i = 0, n = ar.length; i < n; i++) {

      const item: VOCandle = ar[i]; // CandlesticksComponent.convertToScale(ar[i], scale, min);
      const x = x0 + (item.to * scaleX);  // (i * dx);

      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#333333';
      ctx.moveTo(x, Yo - (item.low * scaleY));
      ctx.lineTo(x, Yo - (item.high * scaleY));
      ctx.stroke();
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = item.open < item.close ? 'green' : 'red';
      ctx.moveTo(x, Yo - (item.open * scaleY));
      ctx.lineTo(x, Yo - (item.close * scaleY));
      ctx.stroke();
    }
    this.drawYs(height, min, max, maxV);
  }

  drawYs(height: number, min: number, max: number, maxV: number) {

    const step = (max - min) / 6;
    const out = [];
    for (let i = min; i < max; i += step) out.push(MATH.toString(i));
    out.push(MATH.toString(max));
    const ctx = this.ctx;
    ctx.fillStyle = '#000000';
    ctx.font = this.font;
    const x = this.widthG + this.paddingLeft + 5;
    let y = this.height - this.paddingBottom;
    const lastY = y - height;
    const step2 = Math.round((y - lastY) / 6);

    out.forEach(function (item) {
      ctx.fillText(item, x, y + 3);
      y -= step2;
    });

    /* ctx.fillStyle = '#550000';
     ctx.font = '8px Arial';
     const yV = (this.height - this.paddingBottom - offsetY) + step2 * 2;
     const firstV = Math.round(maxV /3).toString();
     ctx.fillText(firstV, x, yV );
 */
  }

  ngOnInit() {
    this.width = this.myWidth || this.width;
    this.height = this.myHeight || this.height;
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
    this.font = this.width > 600 ? '12px Arial' : '8px Arial';
    this.widthG = this.width - this.paddingRight - this.paddingLeft;

    this.heightG = this.height - this.paddingBottom - this.paddingTop;
    this.x0 = this.paddingLeft;
    this.y0 = this.paddingTop + this.heightG;
    setTimeout(() => this.redraw(), 100);
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (!this.candles || !this.widthG) return;
    this.drwaHorizonts();
    this.drwaVerticals();
    this.drawGraphs();
    this.drawXs();
    this.drawOverlay();
  }

  private createLabels(): string[] {
    const ar = this.candles;
    const from = ar[0].to;
    const to = ar[ar.length - 1].to;
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
    const ar = this.createLabels();
    let step = (this.widthG + (this.widthG / 12)) / ar.length;
    let y = this.height - 5;
    let x0 = this.paddingLeft - 10;

    ctx.fillStyle = '#000000';
    ctx.font = this.font;
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
    // console.warn(n);

    let offsetY = this.paddingTop;
    let offsetX = this.paddingLeft;
    let step = this.widthG / n;
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

  onMouseMove(evt) {
    if (!this.startPoint) return;

    const g0 = this.gY0 / this.gScaleY;

    // const height = Math.round(this.heightG - offsetY);
    const startPos = this.startPoint;
    const pos = this.getMousePos(this.moveElement, evt);
    const distY = pos.y - startPos.y;

    const start = g0 - (startPos.y / this.gScaleY);

    const diff = distY / this.gScaleY;
    const curValue = (start - diff);


    const perc = (100 * Math.abs(diff) / start).toFixed(2);

    let precision = 8;
    if (start > 0.001) precision = 5;
    if (start > 1) precision = 3;
    if (start > 100) precision = 1;
    const ctx = this.overlayCTX;
    ctx.clearRect(0, 0, 300, 20);
    ctx.fillText(perc + '%', 5, 20);

    ctx.fillText(start.toFixed(precision), 150, 20);
    ctx.fillText(curValue.toFixed(precision), 50, 20);
    ctx.fillStyle = '#000000';
    ctx.font = this.font;


    // const pos2 = this.getMousePos(el, evt)
    // console.log(start , diff, perc);

  }

  getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }  onMouseDown(el, evt) {
    // console.log(this.startPoint, this.isMouseMove);
    this.clicks ++;
    if (this.clicks >= 3) {
      this.overlayCTX.clearRect(0, 0, this.width, this.height);
      this.clicks = 0;
      return;
    }
    let pos = this.getMousePos(el, evt);
    this.moveElement = el;
    if (!this.startPoint) {
      this.startPoint = pos;
      const ctx = this.overlayCTX;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
      ctx.stroke();
      el.addEventListener('mousemove', this.onMouseMoveHandler);
    } else {
      // console.log(' clear data');;

      el.removeEventListener('mousemove', this.onMouseMoveHandler);
      this.startPoint = null;
    }
  }

  /*
    onTouchEnd(el, evt){
      var pos = this.getMousePos(el, evt);
      if (!this.startPoint) {
        this.startPoint = pos;
        const ctx = this.overlayCTX;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
        ctx.stroke();
      }else {

      }

    }*/

  ngAfterViewInit() {
    let el: HTMLCanvasElement = this.canv.nativeElement;
    this.ctx = el.getContext('2d');
    el = this.overlayView.nativeElement;
    this.overlayCTX = el.getContext('2d');
    // el.addEventListener("touchend",(evt)=>this.onTouchEnd(el, evt), false);
    el.addEventListener('mousedown', (evt) => this.onMouseDown(el, evt));
    this.linesOverlay = new LinesOverlay(this.overlayCTX);
    // if (this.graphs) this.drawData();
    setTimeout(() => this.setSize(), 100);
  }

  ngOnChanges(evt) {
    if (!this.ctx) return;
    // console.log(evt);
    if (evt.candles) this.redraw();
    else if (evt.overlays) this.drawOverlay();

  }
}
