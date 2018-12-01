import * as _ from 'lodash';

export class MATH {

  static priceChnage(closes: number[]) {
    const lasts = _.mean(_.takeRight(closes, 3));
    const last10 = _.min(_.takeRight(closes, 10));
    return MATH.percent(lasts, last10);
  }

  static speeds(numbers: number[]) {
    const speeds = numbers.map(function (o) {
      const speed = Math.round((o - this.last) / this.last * 1e4) / 100;
      this.last = o;
      return speed;
    }, {last: numbers[0]});
    return speeds;
  }

  static isFallLog(numbers: number[]) {
    const first = numbers.shift();
    return numbers.every(function (o) {
      const res =  o < this.prev;
      console.log(o, this.prev);
      this.prev = o;
      return res;
    }, {prev: first});
  }

  static isFall(numbers: number[]) {
    const first = numbers.shift();
    return numbers.every(function (o) {
      const res =  o < this.prev;
      this.prev = o;
      return res;
    }, {prev: first});
  }

  static formatDecimals(value: number, decimals: number) {
    const k = Math.pow(10, decimals);
   return Math.floor(value * k) / k;
  }

  static toString(value: number, length = 4) {
    return (value * 1e8).toString().substr(0, length);
  }

  static toValue(value: number): number {
    return +(value > 1e-4 ? value.toPrecision(5) : value.toFixed(8));
  }

  static toDisplayValue(value: number): number {
    if (value < 1e-4) return value;
  }

  static weiToEther(wei: string) {
    while (wei.length < 20) wei = '0' + wei;
    return wei.slice(0, 18) + '.' + wei.slice(18);
  }

  /*export function sum(vals: string[]): string {
    let res = new thirdparty.bnjs(vals.shift());
    vals.forEach(function (item) {
      res = res.add(item);
    });
    return res.toString();
  }*/


  static btcToSatoshi(btc: string) {
    // console.log(btc)
    let ar = ('' + btc).replace(',', '.').split('.');
    let suffix = '';
    if (ar.length === 1) suffix = '00000000';
    else {
      suffix = ar[1];
      while (suffix.length < 8) suffix += '0';
    }
    let res = ar[0] + suffix;
    while (res.length && res.substr(0, 1) === '0') res = res.substr(1);
    // console.log(res);
    return res;
  }

  static satoshiToBtc(satoshi: string) {
    while (satoshi.length < 10) satoshi = '0' + satoshi;
    return satoshi.slice(0, 8) + '.' + satoshi.slice(8);
  }

  static sort(ar: number[]) {
    ar.sort(function (a, b) {
      return a - b;
    });
  }

  static mean(vals: number[]) {
    return _.mean(vals);
  }
  static median(numbers: number[], removeZero = true) {
    if(removeZero) numbers = numbers.filter(function (item) {
      return item;
    });
    numbers = numbers.slice(0);
    let median = 0, numsLen = numbers.length;
    MATH.sort(numbers);
    //  console.log(numbers);
    if (numsLen % 2 === 0) median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
    else median = numbers[(numsLen - 1) / 2];
    return median;
  }


  static medianOn(numbers: number[], num: number) {
    MATH.sort(numbers);
    numbers = numbers.slice(num, -num);
    return _.mean(numbers);
  }

  static percent2(val1: number, val2: number): number {
    return Math.round(10000 * (val1 - val2) / val2) / 100;
  }
  static percent(val1: number, val2: number): number {
    return Math.round(1000 * (val1 - val2) / val2) / 10;
  }

  static addDecimal(rate: number, number: number) {
    const ar1 = rate.toString().split('.');
    console.log(ar1);
    if (ar1.length === 2) {
      let out: string = ar1[0];
      const l = ar1[1].length;
      const k =  Math.pow(10, l);
      let val1 = Math.round(rate * k);
      val1 += number;
      return +(ar1[0] + '.' + String(val1).padStart(l, '0'));
    } else rate += number;
    return rate;
  }
}

