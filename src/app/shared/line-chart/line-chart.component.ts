import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import * as _ from 'lodash';

interface VOLine {
  ys: number[];
  xs: number[]
  color: string;
}

export interface VOGraph {
  ys: number[];
  color: string;
  label: string;
  min?: number;
  max?: number;
  range?: number;
}

export interface VOGraphs {
  xs: string[];
  graphs: VOGraph[];
}

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnInit, AfterViewInit {

  @ViewChild('graphs') canv;
  @ViewChild('myContainer') container;
  private ctx: CanvasRenderingContext2D;
  @Input() graphs: VOGraphs;


  lines: VOLine[];

  ratio: number = 600 / 400;
  width: number = 600;
  height: number = 400;
  widthG: number;
  heightG: number;
  vertical = 10;
  horizont = 10;
  padding = 10;
  paddingTop = 30;
  paddingBottom = 20;
  paddingLeft = 50;
  paddingRight = 10;
  y0: number;
  x0: number;


  static convertToScale(ar: number[], range: number, min: number, height: number): number[] {
    if (range === 0) range = 1;
    return ar.map(function (item) {
      return (this.h * (item - this.min)) / this.range;
    }, {h: height, min: min, range: range});
  }

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
    this.ctx = el.getContext("2d");
    // if (this.graphs) this.drawData();
    setTimeout(() => this.setSize(), 100);
  }

  ngOnChanges(evt) {

    if (this.ctx) this.drawData();

  }

  private drawXs() {

    let ctx = this.ctx;
    let ar = this.graphs.xs;
    let step = (this.widthG + 40) / ar.length;
    let y = this.height;
    let x0 = this.paddingLeft - 20;

    ctx.fillStyle = '#000000';
    ctx.font = "12px Arial";
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
      ctx.font = "12px Arial";
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
    let min = _.min(ys);
    let max = _.max(ys);

    if (min === 0) min = 1;
    let range = max - min;
    line.min = min;
    line.max = max;
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
    ctx.lineWidth = 0.2;
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
    ctx.lineWidth = 0.2;
    let n = this.vertical;

    let offsetY = this.paddingTop;
    let offsetX = this.paddingLeft;
    let step = Math.round(this.widthG / n);
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
