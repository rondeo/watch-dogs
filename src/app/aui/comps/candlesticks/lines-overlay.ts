import {ResistanceSupport} from '../../../trader/libs/levels/resistance-support';
import {VOCandle} from '../../../amodels/api-models';

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

  async addResistance(candles: VOCandle[]) {
    const step = candles[1].to - candles[0].to;
    const resist = new ResistanceSupport(candles);
    const data: any = await resist.getResult();

    const out = [];
    data.resistance.forEach(function (item) {
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
      });
    });

    data.support.forEach(function (item) {
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
      });
    });
    this.graphs = out;
  }

  async drawLines(x0: number, scaleX: number, y0: number, gScaleY: number) {
    const graphs: SomeLine[] = this.graphs;
    const ctx = this.ctx;

    graphs.forEach(function (item) {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      const x1 = x0 + (item.from.x * scaleX); // ((item.from.x - minX) * scaleX);
      const y1 = y0 - (item.from.y * gScaleY);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x0 + (item.to.x * scaleX), y0 - (item.to.y * gScaleY));
      ctx.stroke();
    });

    ctx.setLineDash([]);
  }


  clear(width: number, height: number) {
    this.ctx.clearRect(0, 0, width, height);
  }
}
