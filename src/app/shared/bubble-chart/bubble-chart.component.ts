import {AfterViewInit, Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';

import * as _ from 'lodash';

@Component({
  selector: 'app-bubble-chart',
  templateUrl: './bubble-chart.component.html',
  styleUrls: ['./bubble-chart.component.css']
})
export class BubbleChartComponent implements OnInit, OnChanges, AfterViewInit {

  @ViewChild('graphs') canv;
  private ctx: CanvasRenderingContext2D;
  @Input() bubbles:{x:number, y:number, r:number, a:number}[];

  constructor() { }

  ngOnInit() {

  }

  ngAfterViewInit() {

    let el:HTMLCanvasElement = this.canv.nativeElement;
     this.ctx = el.getContext("2d");
     if(this.bubbles) this.drawBubbles();
  }

  ngOnChanges(evt){
    //console.log(evt);
    if(this.ctx && this.bubbles) this.drawBubbles();

  }


  drawBubbles(){
    let ctx = this.ctx;
    ctx.clearRect(0, 0, 420, 340);
    ctx.fillStyle = 'black';
    if(!this.bubbles.length) return;

    let bubbles = this.bubbles.reverse();




    let height = 200;
    let width = 340;
    let offsetY = 10;
    let offsetX = 40;

    let startTime  = bubbles[0].x
    let endTime = bubbles[bubbles.length-1].x;
    let rangeX = endTime - startTime;
    let min = _.minBy(bubbles, 'y').y;
    let max = _.maxBy(bubbles, 'y').y;

    //console.warn(min, max)

    let rangeY = max - min;

    let scaleY = rangeY/height;

    //console.warn(rangeY);

    let linesStep = rangeY/10;


    for(let i = 0; i< 11 ; i++){

      let pozY = (i * linesStep);
      let value = min + pozY;
      pozY = height - (pozY/scaleY);
      pozY += offsetY;
      ctx.font = "9px Arial";
      ctx.fillText((value).toPrecision(4),4,pozY);
      ctx.beginPath();
      ctx.moveTo(offsetX, pozY);
      ctx.lineTo(width,pozY);
      ctx.lineWidth = 0.1;
      ctx.stroke();
    }

    let numbers:number[] =  [];

    bubbles.forEach(function (o:{x:number, y:number, r:number, a:number}) {
      let amount = o.y

      let x  = offsetX + width *(o.x - startTime)/rangeX;
      let y = offsetY + height-((o.y - min) /scaleY);
      let r  = 1;
      if(o.r > 100000){
        ctx.font = "18px Arial";
        ctx.fillText((o.r/1000).toFixed(0),x-6,y-6);
        r = Math.log(o.r);
      } else if(o.r > 50000) {
        ctx.font = "10px Arial";
        ctx.fillText((o.r / 1000).toFixed(0), x - 6, y - 6);
        r = 5;
      }else if(o.r > 10000){
          ctx.font = "8px Arial";
          ctx.fillText((o.r/1000).toFixed(0),x-6,y-6);
          r=3.5;
        }
        else if(o.r>100) r = 2;

      ctx.beginPath();
      ctx.arc(x, y, r , 0,  2 * Math.PI, false);
      ctx.fillStyle = o.a?'rgba(0,100,0,0.8)':'rgba(255,0,0,0.8)';
      ctx.fill();
    })

  }



}
