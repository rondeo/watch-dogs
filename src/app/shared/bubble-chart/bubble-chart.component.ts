import {AfterViewInit, Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';

import * as _ from 'lodash';
import {VOBubble} from "../../my-exchange/utils-order";

@Component({
  selector: 'app-bubble-chart',
  templateUrl: './bubble-chart.component.html',
  styleUrls: ['./bubble-chart.component.css']
})
export class BubbleChartComponent implements OnInit, OnChanges, AfterViewInit {

  @ViewChild('graphs') canv;
  private ctx: CanvasRenderingContext2D;
  @Input() bubbles:{x:number, y:number, r:number, a:number}[];
  @Input() exchange:string;
  @Input() market:string;

  startTime:string;
  endTime:string;

  constructor() { }

  ngOnInit() {

  }

  ngAfterViewInit() {

    let el:HTMLCanvasElement = this.canv.nativeElement;
     this.ctx = el.getContext("2d");
     if(this.bubbles) this.drawData();
  }

  ngOnChanges(evt){
    //console.log(evt);
    if(this.ctx && this.bubbles) this.drawData();

  }


  drawVerticalLines(startTime:number, rangeX:number, ctx:CanvasRenderingContext2D, width:number, height:number, offsetX:number,  offsetY:number, scaleX:number, scaleY:number){


   // let x = offsetX + ((o.x - startTime) / scaleX);

    let step = rangeX/10;

    offsetY +=30;

    for (let i= 0; i<11; i++) {

      let stamp = startTime + (i * step);


      let date = new Date(stamp);

      let display = date.getHours() +':'+date.getMinutes();

      let x = offsetX + ((stamp - startTime) / scaleX);

      ctx.font = "9px Arial";
      ctx.fillText(display, x-8 , height + offsetY);
      ctx.beginPath();
      ctx.moveTo(x, height+offsetY);
      ctx.lineTo(x, 0);
      ctx.lineWidth = 0.1;
      ctx.stroke();
    }

  }


  drawHorizontalLines(rangeY:number, minY:number, ctx:CanvasRenderingContext2D, width:number, height:number, offsetX:number,  offsetY:number, scaleX:number, scaleY:number){

   /* let min = bubbles.reduce(function (s, item) {
      return (item.y && item.y < s)?item.y:s;
    }, 1e10);

    let max = _.maxBy(bubbles, 'y').y;*/

   // console.warn(min,  max)

    //let rangeY = max - min;

    //let scaleY = rangeY/(height - offsetY);

    //console.warn(rangeY);

    let linesStep = rangeY/10;


    for(let i = 0; i< 11; i++){

      let pozY = (i * linesStep);
      let value = minY + pozY;
      pozY = height - (pozY/scaleY);
      pozY += offsetY;
      let display
      if(value >=10000){
        display = (value/1e3).toFixed(2).replace('.', ',');
      }else{
        display = (value).toPrecision(4);
      }

      ctx.font = "9px Arial";
      ctx.fillText(display,4,pozY);
      ctx.beginPath();
      ctx.moveTo(offsetX, pozY);
      ctx.lineTo(width,pozY);
      ctx.lineWidth = 0.1;
      ctx.stroke();
    }
  }


  drawBubbles( minY:number, ctx:CanvasRenderingContext2D, bubbles:VOBubble[], width:number, height:number, offsetX:number,  offsetY:number, scaleX:number, scaleY:number){

    let startTime  = bubbles[0].x;

    bubbles.forEach(function (o:VOBubble) {
      if(o.y) {

        let amount = o.y;

        let x = offsetX + ((o.x - startTime) / scaleX);

        let y = offsetY + height - ((o.y - minY) / scaleY);
        let r = 1;
        let R = Math.abs(o.r);

        ctx.fillStyle = o.r > 0 ? 'rgba(0,100,0,0.8)' : 'rgba(255,0,0,0.8)';
        if (R > 99000) {
          ctx.font = "10px Arial";

          ctx.fillText((R / 1000).toFixed(0), x - 10, y - 10);
          r = 5;
        } else if (R > 49000) {
          ctx.font = "10px Arial";
          ctx.fillText((R / 1000).toFixed(0), x - 10, y - 10);
          r = 4;
        } else if (R > 10000) {
          //ctx.font = "8px Arial";
          //ctx.fillText((R / 1000).toFixed(0), x - 6, y - 6);
          r = 3;
        }
        else if (R > 1000) r = 2;

        ctx.beginPath();
        ctx.arc(x-(r/2), y-(r/2), r, 0, 2 * Math.PI, false);

        ctx.fill();
      }
    })
  }


  drawData(){
    let ctx = this.ctx;
    ctx.clearRect(0, 0, 360, 240);
    ctx.fillStyle = 'black';
    if(!this.bubbles.length) return;

    let bubbles = this.bubbles;

    let height = 200;
    let width = 340;
    let offsetY = 10;
    let offsetX = 40;

    let startTime  = bubbles[0].x
    let endTime = bubbles[bubbles.length-1].x;


   /*let startDate = new Date(startTime);
    let endDate = new Date(endTime);

    let displaySatrt = startDate.getHours() +':' + startDate.getMinutes();
    let displayEnd = endDate.getHours() + ':'+ endDate.getMinutes();

    ctx.font = "10px Arial";
    ctx.fillText(displaySatrt, offsetX +5 , 11);
    ctx.fillText(displayEnd, width - 25 , 11);*/



    let rangeX = endTime - startTime;

    let scaleX = rangeX/(width - offsetX);

    let dust = [];

    let minY = 1e10;
    let maxY = 0;

    bubbles.forEach(function (item) {
     // if(item.r > 300){
        if(item.y > maxY) maxY = item.y;
        if(item.y && item.y < minY) minY = item.y;
     // }else dust.push(item)

    });

    let persent = (100*(maxY - minY)/maxY).toFixed(1);

    ctx.font = "10px Arial";
    ctx.fillText(persent +' %', 5 , height +   30);
    //console.warn(minY, max)


    let rangeY = maxY - minY;

    let scaleY = rangeY/(height - offsetY);

    //console.warn(rangeY);

    this.drawVerticalLines(startTime, rangeX, ctx, width, height, offsetX, offsetY, scaleX, scaleY );

    this.drawHorizontalLines(rangeY, minY,  ctx, width, height, offsetX, offsetY, scaleX, scaleY);

    this.drawBubbles(minY,  ctx, bubbles, width, height, offsetX, offsetY, scaleX, scaleY)


   /*
    let linesStep = rangeY/10;


    for(let i = 0; i< 11; i++){

      let pozY = (i * linesStep);
      let value = minY + pozY;
      pozY = height - (pozY/scaleY);
      pozY += offsetY;
      let display
      if(value >=10000){
        display = (value/1e3).toFixed(2).replace('.', ',');
      }else{
        display = (value).toPrecision(4);
      }

      ctx.font = "9px Arial";
      ctx.fillText(display,4,pozY);
      ctx.beginPath();
      ctx.moveTo(offsetX, pozY);
      ctx.lineTo(width,pozY);
      ctx.lineWidth = 0.1;
      ctx.stroke();
    }
*/

    /*let numbers:number[] =  [];

    bubbles.forEach(function (o:VOBubble) {
      if(o.y) {

        let amount = o.y

        let x = offsetX + ((o.x - startTime) / scaleX);

        let y = offsetY + height - ((o.y - minY) / scaleY);
        let r = 1;
        let R = Math.abs(o.r);

        ctx.fillStyle = o.r > 0 ? 'rgba(0,100,0,0.8)' : 'rgba(255,0,0,0.8)';
        if (R > 100000) {
          ctx.font = "18px Arial";
          ctx.fillText((R / 1000).toFixed(0), x - 6, y - 6);
          r = Math.log(R);
        } else if (R > 50000) {
          ctx.font = "10px Arial";
          ctx.fillText((R / 1000).toFixed(0), x - 6, y - 6);
          r = 5;
        } else if (R > 10000) {
          ctx.font = "8px Arial";
          ctx.fillText((R / 1000).toFixed(0), x - 6, y - 6);
          r = 3.5;
        }
        else if (R > 100) r = 2;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);

        ctx.fill();
      }
    })*/

  }



}
