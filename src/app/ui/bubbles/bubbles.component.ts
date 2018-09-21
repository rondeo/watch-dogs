import {Component, Input, OnInit} from '@angular/core';
import {DrawBase} from '../com/draw-base';
import {VOCandle} from '../../models/api-models';

@Component({
  selector: 'app-bubbles',
  templateUrl: './bubbles.component.html',
  styleUrls: ['./bubbles.component.css']
})
export class BubblesComponent extends DrawBase implements OnInit {

  @Input() bubbles: {x: number, y: number, r: number}[];
  constructor() { super(); }


  drawGraphs(){
    if(!this.bubbles) return;

    const ar = this.bubbles;

    // console.log(ar);

    const offsetY = 0;// Math.round(this.heightG * 0.3);


    const Y0 = this.y0;
    //const y0 = this.y0 - offsetY;
    const x0 = this.x0;


    let minY = 100000000000000000;
    let maxY = -100000000000000;
    let minX = ar[0].x;
    let maxX = ar[ar.length - 1].x;
    let maxR = -1e12;
    let minR = 1e12;
    ar.forEach(function (item) {
      if (item.y < minY) minY = item.y;
      if (item.y > maxY) maxY = item.y;

      if(minR > item.r) minR = item.r;
      if(maxR < item.r) maxR = item.r;
    });

    const rangeR = maxR - minR;
    const scaleR = 5/ maxR;
    let rangeX = maxX - minX;
    const width = this.widthG;
    let scaleX = rangeX/(width - x0);
    let rangeY = maxY - minY;

    const height = Math.round(this.heightG - offsetY);
    let dx = this.widthG / (ar.length - 1);
    let ctx = this.ctx;
    const scaleY = height / (rangeY || 1);

    const Yo = this.y0 - offsetY + (minY * scaleY);

    let r = 3;
    for (let i = 0, n = ar.length; i < n; i++) {
     // const x = x0 + (i * dx);

      const item:  {x: number, y: number, r: number} = ar[i];// CandlesticksComponent.convertToScale(ar[i], scale, min);
      const x = x0 + ((item.x - minX) / scaleX);
      let y = Y0 - ((item.y - minY) * scaleY);
      // console.log(y)
      r = item.r * scaleR;
      ctx.beginPath();
      ctx.fillStyle = r > 0 ? 'rgba(0,100,0,0.8)' : 'rgba(255,0,0,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#333333';
      ctx.arc(x-(r/2), y-(r/2), r, 0, 2 * Math.PI, false);
      ctx.fill();
    }


  }


}
