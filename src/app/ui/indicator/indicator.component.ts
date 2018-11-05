import {Component, Input, OnInit, ViewChild} from '@angular/core';
import * as _ from 'lodash';
import {VOGraph, VOGraphs} from '../line-chart/line-chart.component';

interface VOLine {
  ys: number[];
  xs: number[]
  color: string;
}

@Component({
  selector: 'app-indicator',
  templateUrl: './indicator.component.html',
  styleUrls: ['./indicator.component.css']
})
export class IndicatorComponent implements OnInit {

  @ViewChild('graphs') canv;
  @ViewChild('myContainer') container;
  private ctx: CanvasRenderingContext2D;
  @Input() graphs: VOGraphs;
  @Input() area: number[];
  @Input() myWidth: number;
  @Input() myHeight: number;
  @Input() myTitle: string;
  lines: VOLine[];


  ratio: number;
  width: number = 600;
  height: number = 100;
  widthG: number;
  heightG: number;
  vertical = 12;
  horizont = 3;

  padding = 10;
  paddingTop = 0;
  paddingBottom = 0;
  paddingLeft = 10;
  paddingRight = 50;

  y0: number;
  x0: number;

  /* static convertToScale(ar: number[], range: number, min: number, height: number): number[] {
     if (range === 0) range = 1;
     const scale = height / range;

     return ar.map(function (item) {
       return (this.scale * item) - (this.min * this.scale);
     }, {h: height, min: min, range: range, scale: scale});
   }
 */
  constructor() {

  }

  drawData() {
    //   console.warn('draw data');
    if (!this.graphs) return;
    this.redraw();
  }


  onResise() {
    this.setSize();
  }

  private resise;

  ngOnInit() {
    this.width = this.myWidth || 600;
    this.height = this.myHeight || 400;
    this.ratio = this.width / this.height;
    window.addEventListener('resize', event => {
      clearTimeout(this.resise);
      this.resise = setTimeout(() => this.onResise(), 500);
    });
  }

  drawTitle() {
    const ctx = this.ctx;
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.fillText(this.myTitle || '', 0, 12);
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.restore();
    this.drawTitle();
    if (!this.graphs) return;
    this.drwaHorizonts();
    this.drwaVerticals();
    this.drawLines();
    this.drawXs();
    this.drawArea();
  }

  drawArea() {
    if (!Array.isArray(this.area)) return;
    //  console.log(this.area);
    const ctx = this.ctx;
    let y = this.area[1];
    const h = (this.area[1] - this.area[0]) * this.scale;
    const x = this.x0;
    const w = this.widthG;
    y = this.y0 - ((y - this.min) * this.scale);

    ctx.beginPath();
    ctx.lineWidth = 0.3;
    ctx.setLineDash([5, 5]);
    ctx.moveTo(x, y);
    ctx.lineTo(this.widthG, y);
    ctx.moveTo(x, y + h);
    ctx.lineTo(this.widthG, y + h);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,225,225,0.15)';
    ctx.fillRect(x, y, w, h);
    ctx.setLineDash([]);

    // ctx.fillStyle = 'rgba(225,225,225,0.5)';


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

  ngAfterViewInit() {
    let el: HTMLCanvasElement = this.canv.nativeElement;
    this.ctx = el.getContext('2d');
    // if (this.graphs) this.drawData();
    setTimeout(() => this.setSize(), 100);
  }

  ngOnChanges(evt) {

    if (this.ctx) this.drawData();

  }

  private drawXs() {

    let ctx = this.ctx;
    let ar = this.graphs.labelsX;
    let step = (this.widthG + (this.widthG / 12)) / ar.length;
    let y = this.height;
    let x0 = this.paddingLeft - 20;

    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ar.forEach(function (item, i) {
      ctx.fillText(item, x0 + (i * step), y);
    });
  }

  private drawLines() {
    if (!this.graphs) return;
    const x0 = this.x0 + 50;
    const y0 = this.y0;
    for (let i = 0, n = this.graphs.graphs.length; i < n; i++) {
      this.drawline(this.graphs.graphs[i]);
    }

    this.drawYs();
  }

  drawYs() {

    /* let ctx = this.ctx;
     let x0 = this.x0 + 50;
     let y0 = this.y0;
     this.graphs.graphs.forEach(function (graph, i) {
       ctx.fillStyle = graph.color;
       ctx.font = "12px Arial";
       let percent = (100 * ((graph.max - graph.min) / graph.min)).toFixed(2);
       let min = graph.min;
       let max = graph.max;

       ctx.fillText(graph.label + ' ' + percent + '%', x0 + i * 90, 12, 80);
       ctx.fillText(min.toPrecision(4), 2, y0 - (i * 20), 40);
       ctx.fillText(max.toPrecision(4), 2, 30 + (i * 20), 40);
     });*/
  }

  scale: number;
  min: number;

  my0;
  private drawline(line: VOGraph) {
    let ctx = this.ctx;
    ctx.strokeStyle = line.color;
    ctx.beginPath();
    ctx.lineWidth = 1;
    const y0 = this.y0;
    let x0 = this.x0;
    let ys = line.ys;
    let min = isNaN(line.min) ? _.min(ys) : line.min;
    let max = isNaN(line.max) ? _.max(ys) : line.max;

    let range = max - min;
    // line.min = min;
    // line.max = max;
    line.range = range;

    const scale = this.heightG / range;
    this.scale = scale;
    this.min = min;
    // console.warn(line.color+ ' ' + (min * scale))
    ys = ys.map(function (item) {
      return (item - min) * scale
    })// IndicatorComponent.convertToScale(ys, range, min, this.heightG);


    let zero = (this.heightG * (0 - min)) / range;
    zero = y0 - zero;

    if(line.hist){
       const offsetY = 0;// - this.my0 ;// line.offsetY * scale;
      // console.warn(offsetY);
      this.drawHist(ctx, ys, x0, y0, zero);
    } else {
      let dx = this.widthG / (ys.length - 1);
      for (let i = 0, n = ys.length; i < n; i++) {
        ctx.lineTo(x0 + (i * dx), y0 - ys[i]);
      }
      ctx.stroke();
    }

    this.my0 = zero;

     if (line.draw0) {



     //   console.log(y0 +'  --  ' + zero);

     //  console.log(this.my0);

     /*  ctx.beginPath();
       ctx.lineWidth = 0.5;
       ctx.setLineDash([5, 10]);
       zero = y0 - zero;
       console.warn(zero);
       ctx.moveTo(this.y0, zero);
       ctx.lineTo(this.widthG, zero);
       ctx.stroke();
       ctx.setLineDash([]);*/
     }
  }
  drawHist(ctx: CanvasRenderingContext2D, ys: number[], x0:number, y0:number, zero:number){
   // console.log(this.my0, this.heightG);
    const Y0 = zero;//(this.heightG /2) ;// + offsetY;

    const offset = this.my0 - zero;
   // console.warn(Y0);

    //console.log(this.my0);
    //console.log(Y0);
    // console.log(this.y0);
    let dx = this.widthG / (ys.length - 1);
    for (let i = 0, n = ys.length; i < n; i++) {
      const x = x0 + (i * dx);
      const y = this.y0  - ys[i];



      const color = 'red' ;//= y < Y0?'green':'red';
      ctx.strokeStyle = color;
      ctx.beginPath();
       ctx.moveTo(x, Y0 + offset);
      ctx.lineTo(x, y + offset);
      ctx.stroke();
    }
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
    let step = Math.round(this.widthG / n);
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


}
