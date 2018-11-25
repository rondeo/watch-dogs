import {Input, ViewChild} from '@angular/core';

export class DrawBase {
  @ViewChild('graphs') canv;
  @ViewChild('myContainer') container;
  protected ctx: CanvasRenderingContext2D;

  @Input() myWidth: number;
  @Input() myHeight: number;
  @Input() myTitle: string;
  ratio: number = 600 / 100;
  width = 600;
  height = 100;
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

  private resize;

  font = '12px Arial';

  constructor() {

  }

  onInit() {
    this.width = this.myWidth || this.width;
    this.height = this.myHeight || this.height;
    this.ratio = this.width / this.height;

    window.addEventListener('resize', event => {
      clearTimeout(this.resize);
      this.resize = setTimeout(() => this.onResize(), 500);
    });
  }

  onResize() {
    this.setSize();
  }

  drawGraphs() {

    console.error('Implement please');
  }

  drawXs() {

  }

  drawYs() {

  }

  redraw() {
    if (!this.widthG) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawGrid(this.ctx, this.vertical, this.horizont, this.widthG, this.heightG, this.paddingLeft, this.paddingTop);
    this.drawGraphs();
    this.drawXs();
    this.drawYs();
  }

  setSize() {
    const ctx = this.ctx;
    this.width = Math.round(this.container.nativeElement.offsetWidth - 20);
    this.height = Math.round(this.width / this.ratio);
    this.widthG = this.width - this.paddingRight - this.paddingLeft;

    this.font = this.width > 600 ? '12px Arial' : '8px Arial';
    this.heightG = this.height - this.paddingBottom - this.paddingTop;
    this.x0 = this.paddingLeft;
    this.y0 = this.paddingTop + this.heightG;
    setTimeout(() => this.redraw(), 100);
  }

  aViewInit() {
    let el: HTMLCanvasElement = this.canv.nativeElement;
    this.ctx = el.getContext('2d');
    // if (this.graphs) this.drawData();
    setTimeout(() => this.setSize(), 100);
  }

  onChanges(evt) {

    if (this.ctx) this.redraw();

  }

  drawGrid(
    ctx: CanvasRenderingContext2D,
    vertical: number,
    horizont: number,
    widthG, heightG,
    paddingLeft = 0,
    paddingTop = 0
  ) {
    ctx.fillStyle = 'black';
    ctx.lineWidth = 0.3;
    let width = this.widthG;
    let offsetY = paddingTop;
    let offsetX = paddingLeft;
    let n = horizont;
    let step = Math.round(heightG / n);
    // console.warn(step);
    let height = heightG;

    for (let i = 0; i < n + 1; i++) {
      let pozY = offsetY + (step * i);
      ctx.beginPath();
      ctx.moveTo(offsetX, pozY);
      ctx.lineTo(offsetX + width, pozY);
      ctx.stroke();
    }

    n = vertical;
    step = widthG / n;

    for (let i = 0; i < n + 1; i++) {
      let posX = offsetX + (step * i);
      ctx.beginPath();
      ctx.moveTo(posX, offsetY);
      ctx.lineTo(posX, offsetY + height);
      ctx.stroke();
    }
  }


}
