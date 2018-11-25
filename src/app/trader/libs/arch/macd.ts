export class VOMacd {
  fast: number;
  slow: number;
  signal: number;
  histogram: number;
}

export class Macd {
  slow = 26;
  fast = 12;
  signal = 9;

  ctr(data: number[]) {

    const sma12s: number[] = [];
    const sma26s: number[] = [];
    const emas12s: number[] = [];
    const emas26s: number[] = [];
    const macds: number[] = [];
    const signals: number[] = [];
    const histos: number[] = [];

    let sum12 = 0;
    let sum26 = 0;
    let val12 = 0;
    let val26 = 0;
    let ema12 = 0;
    let ema26 = 0;
    let sig = 0;
    let hist = 0;

    let macd = 0;
    let macdPrev = 0;
    let macdSum = 0;
    let macdCount = 0;
    let macdSma = 0;

    let exponent12 = 2 / (12 + 1);
    let exponent26 = 2 / (26 + 1);
    let exponent9 = 2 / (9 + 1);
    let prevEma12 = 0;
    let prevEma26 = 0;

    for (let i = 0, n = data.length; i < n; i++) {
      let cur = data[i];
      if (i > 12) {
        val12 = sum12 / 12;
        sma12s.push(val12);
        sum12 -= data[i - 13];
        sum12 += cur;
        if (!prevEma12) prevEma12 = val12;
        prevEma12 = ((cur - prevEma12) * exponent12) + prevEma12;
        emas12s.push(prevEma12);
      } else {
        emas12s.push(0);
        sma12s.push(0);
        sum12 += cur;
      }

      if (i > 26) {
        val26 = sum26 / 26;
        sma26s.push(val26);
        sum26 -= data[i - 27];
        sum26 += cur;
        if (!prevEma26) prevEma26 = val26;
        prevEma26 = ((cur - prevEma26) * exponent26) + prevEma26;
        emas26s.push(prevEma26);
        macd = prevEma12 - prevEma26;
        macds.push(macd);
        macdCount++;
       if (macdCount > 9) {
         macdSma = macdSum / 9;
         if (!macdPrev) macdPrev = macdSma;
         macdSum -= macds[i - 10];
         const signal = ((macd - macdPrev) * exponent9) + macdPrev;
         signals.push(signal);
         histos.push(macd - signal);
       } else signals.push(0);

        macdSum += macd;

        macdPrev = macd;

      } else {
        macds.push(0);
        sma26s.push(0);
        emas26s.push(0);
        signals.push(0);
        sum26 += cur;
      }
    }

    return {
      sma12s,
      sma26s,
      emas12s,
      emas26s,
      macds,
      signals,
      histos
    };

  }
}
