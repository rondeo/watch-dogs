export interface VOCandle {
  close: number;
  open: number;
  high: number;
  low: number;
}

export class Candles {
  history: VOCandle[];

  getLowAndHigh(length = 14): { low: number, high: number } {
    let low = 1e10;
    let high = -1e10;
    const ar = this.history;
    for (let i = ar.length - length, n = ar.length; i < n; i++) {
      const item = ar[i];
      if (high < item.high) high = item.high;
      if (low > item.low) low = item.low;
    }
    return {low, high};
  }
}