import {ResistanceLevel} from '../../trader/libs/levels/resistance-level';
import {VOCandle} from '../../models/api-models';

export interface Point {
  x: number;
  y: number;
}

export interface SomeLine {
  from: Point;
  to?: Point;
  length?: number;
  color: string;
}

export interface MyLines {
  lines: SomeLine[];
}

export class LinesOverlay {
  graphs: SomeLine[];

  constructor(private ctx: CanvasRenderingContext2D) {

  }


  addResistance(candles: VOCandle[]) {
    const step = candles[1].to - candles[0].to;
    const resist = new ResistanceLevel(candles);
    const data = resist.result;

    const out = [];

    data.maxs.forEach(function (item) {
      out.push({
        color: 'blue',
        from: {
          x: item.to,
          y: item.high
        },
        to: {
          x: item.to + (10 * step),
          y: item.high
        },
      })
    });

    data.mins.forEach(function (item) {
      out.push({
        color: 'red',
        from: {
          x: item.to,
          y: item.low
        },
        to: {
          x: item.to + (10 * step),
          y: item.low
        },
      })
    });



   /* const lines = [
      {
        from: {
          x: data.maxs[0].to,
          y: data.maxs[0].high
        },
        to: {
          x: data.maxs[0].to + (10 * step),
          y: data.maxs[0].high
        },
        color: '#333333'
      }
    ];*/
    this.graphs = out;
  }

  drawLines(x0: number, scaleX: number, y0: number, gScaleY: number) {
    const graphs: SomeLine[] = this.graphs;
    const ctx = this.ctx;

    //const width = Math.round(widthG);

    //const Yo = yStart +  ( graphs.minY  * scaleY);

    // const rangeX = graphs.maxX - graphs.minX;

    // const scaleX = width / (rangeX || 1);


    // const minX = graphs.minX;
    // const X0 = x0 + (graphs.minX * scaleX);


    graphs.forEach(function (item) {
      // item.from.x = 0;
      // item.to.x = 400;
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const x1 = x0 + (item.from.x * scaleX)//((item.from.x - minX) * scaleX);
      const y1 = y0 - (item.from.y * gScaleY);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x0 + (item.to.x * scaleX),y0 - (item.to.y * gScaleY));
      ctx.stroke();
    })

  }


}
