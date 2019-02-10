import {AfterViewInit, Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {LineChartComponent, VOGraph} from '../line-chart/line-chart.component';
import * as _ from 'lodash';


export interface VOLineGraph {
  ys: number[];
  color: string;
  label: string;

  min?: number;
  max?: number;
  range?: number;
}

@Component({
  selector: 'app-line-graph',
  templateUrl: './line-graph.component.html',
  styleUrls: ['./line-graph.component.css']
})
export class LineGraphComponent implements OnInit, AfterViewInit, OnChanges {

  @ViewChild('graphs') canv;
  @ViewChild('myContainer') container;
  private ctx: CanvasRenderingContext2D;
  @Input() linegraphs: VOLineGraph[];
  @Input() textsxs: string[];

  @Input() name: string;

  @Input() width = 600;
  @Input() height = 400;



  private ratio: number;

  private widthG: number;
  private heightG: number;
  @Input() vertical = 12;
  @Input() horizont = 10;
  private padding = 10;
  private paddingTop = 30;
  private paddingBottom = 20;
  private paddingLeft = 50;
  private paddingRight = 10;
  private y0: number;
  private x0: number;


  private resiseTimeout;

  static convertToScale(ar: number[], range: number, min: number, height: number): number[] {
    if (range === 0) range = 1;
    return ar.map(function (item) {
      return (this.h * (item - this.min)) / this.range;
    }, {h: height, min: min, range: range});
  }

  constructor() {
  }


  private drawline(line: VOLineGraph) {
    let ctx = this.ctx;
    ctx.strokeStyle = line.color;
    ctx.beginPath();
    ctx.lineWidth = 1;
    let y0 = this.y0;
    let x0 = this.x0;
    let ys = line.ys;
    let min = _.min(ys);
    let max = _.max(ys);
    if (this.name === 'test') {
      console.log(min, max);
    }

    if (min === 0) min = 1;
    let range = max - min;
    line.min = min;
    line.max = max;
    line.range = range;

    if (this.name === 'test') {
      console.log(ys, range, min, this.heightG);
    }

    ys = LineChartComponent.convertToScale(ys, range, min, this.heightG);

if (this.name === 'test') {
  console.log(ys);
}
    let dx = this.widthG / (ys.length - 1);
    for (let i = 0, n = ys.length; i < n; i++) {
      ctx.lineTo(x0 + (i * dx), y0 - ys[i]);
    }
    ctx.stroke();


    if (min < 0) {
      let zero = (this.heightG * (0 - min)) / range;
      zero = y0 - zero;
      ctx.moveTo(0, zero);
      ctx.lineTo(this.width, zero);
      ctx.stroke();
    }
  }


  private drwaHorizonts() {
    if (!this.horizont) return;
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
    if (!this.vertical) return;
    let ctx = this.ctx;
    ctx.fillStyle = 'black';
    ctx.lineWidth = 0.3;
    let n = this.vertical;
    // console.warn(n);

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


  drawTextsY() {

    let ctx = this.ctx;
     let x0 = this.x0 + 50;
     let y0 = this.y0;
     this.linegraphs.forEach(function (graph, i) {
       if (!!graph.label) {
         ctx.fillStyle = graph.color;
         ctx.font = '12px Arial';
         let percent = (100 * ((graph.max - graph.min) / graph.min)).toFixed(2);
         let min = graph.min;
         let max = graph.max;

         ctx.fillText(graph.label + ' ' + percent + '%', x0 + i * 90, 12, 80);
         ctx.fillText(min.toPrecision(4), 2, y0 - (i * 20), 40);
         ctx.fillText(max.toPrecision(4), 2, 30 + (i * 20), 40);
       }
     });
  }


  private drawLines() {
    if (!this.linegraphs) return;
    this.linegraphs.forEach(line => this.drawline(line));
  }

  private drawTextsX() {
    if (!this.textsxs) return;
     let ctx = this.ctx;
     let ar = this.textsxs;
     let step = (this.widthG + 40) / ar.length;
     let y = this.height;
     let x0 = this.paddingLeft - 20;

     ctx.fillStyle = '#000000';
     ctx.font = '12px Arial';
     ar.forEach(function (item, i) {
       ctx.fillText(item, x0 + (i * step), y);
     });
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (!this.linegraphs) return;
    this.drwaHorizonts();
    this.drwaVerticals();
    this.drawLines();
    this.drawTextsY();
    this.drawTextsX();
  }


  ngOnInit() {
    this.ratio  = +(this.width / this.height).toPrecision(8);
    window.addEventListener('resize', event => {
      clearTimeout(this.resiseTimeout);
      this.resiseTimeout = setTimeout(() => this.onResise(), 500);
    });
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

  drawData() {
    //   console.warn('draw data');
    if (!this.linegraphs) return;
    this.redraw();
  }


  onResise() {
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


}
