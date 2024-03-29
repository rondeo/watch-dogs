import {AfterViewInit, Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import * as _ from 'lodash';

interface VOLine {
  ys: number[];
  xs: number[];
  color: string;
}

export interface VOGraph {
  ys: number[];
  color: string;
  label: string;
  min?: number;
  max?: number;
  range?: number;
  hist?: boolean;
  offsetY?: number;
  draw0?: boolean;
}

export interface VOGraphs {
  labelsX: string[];
  graphs: VOGraph[];
}

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnInit, AfterViewInit, OnChanges {

  constructor() {

  }

  @ViewChild('graphs') canv;
  @ViewChild('myContainer') container;
  private ctx: CanvasRenderingContext2D;
  @Input() graphs: VOGraphs;

  @Input() myWidth: number;
  @Input() myHeight: number;
  lines: VOLine[];



  ratio: number;
  width = 600;
  height = 400;
  widthG: number;
  heightG: number;
  vertical = 12;
  horizont = 10;
  padding = 10;
  paddingTop = 30;
  paddingBottom = 20;
  paddingLeft = 50;
  paddingRight = 10;
  y0: number;
  x0: number;

  private resise;

  static convertToScale(ar: number[], range: number, min: number, height: number): number[] {
    if (range === 0) range = 1;
    return ar.map(function (item) {
      return (this.h * (item - this.min)) / this.range;
    }, {h: height, min: min, range: range});
  }

  drawData() {
    //   console.warn('draw data');
    if (!this.graphs) return;
    this.redraw();
  }


  onResise() {
    this.setSize();
  }

  ngOnInit() {
    this.width = this.myWidth || 600;
    this.height = this.myHeight || 400;
    this.ratio = this.width / this.height;
    window.addEventListener('resize', event => {
      clearTimeout(this.resise);
      this.resise = setTimeout(() => this.onResise(), 500);
    });
  }


  redraw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (!this.graphs) return;
    this.drwaHorizonts();
    this.drwaVerticals();
    this.drawLines();
    this.drawXs();
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

    let ctx = this.ctx;
    let x0 = this.x0 + 50;
    let y0 = this.y0;
    this.graphs.graphs.forEach(function (graph, i) {
      ctx.fillStyle = graph.color;
      ctx.font = '12px Arial';
      let percent = (100 * ((graph.max - graph.min) / graph.min)).toFixed(2);
      let min = graph.min;
      let max = graph.max;

      ctx.fillText(graph.label + ' ' + percent + '%', x0 + i * 90, 12, 80);
      ctx.fillText(min.toPrecision(4), 2, y0 - (i * 20), 40);
      ctx.fillText(max.toPrecision(4), 2, 30 + (i * 20), 40);
    });
  }


  private drawline(line: VOGraph) {
    let ctx = this.ctx;
    ctx.strokeStyle = line.color;
    ctx.beginPath();
    ctx.lineWidth = 1;
    let y0 = this.y0;
    let x0 = this.x0;
    let ys = line.ys;
    let min = isNaN(line.min) ? _.min(ys) : line.min;
    let max = isNaN(line.max) ? _.max(ys) : line.max;

   // if (min === 0) min = 1;
    let range = max - min;
   // line.min = min;
    // line.max = max;
    line.range = range;

    ys = LineChartComponent.convertToScale(ys, range, min, this.heightG);


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
