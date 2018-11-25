export class SSMA {
  slow = 26;
  fast = 12;
  signal = 9;


  constructor() {

  }

  ctr(lasts: number[]) {
    const fasts: number[] = [];
    const slows: number[] = [];
    let sum12 = 0;
    let sum26 = 0;
    let val12 = 0;
    let val26 = 0;
    let sig = 0;

    for (let i = 0, n = lasts.length; i < n; i++) {
      if (i > 12) {
        val12 = sum12 / 12;
        fasts.push(val12);
        sum12 -= lasts[i - 13];
        sum12 += lasts[i];
      } else fasts.push(1);
      if (i > 26) {
        val26 = sum26 / 26;
        fasts.push(val26);
        sum26 -= lasts[i - 27];
        sum26 += lasts[i];

      } else slows.push(1);
    }

  }
}
