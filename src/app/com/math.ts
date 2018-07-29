import * as _ from 'lodash';

export class MATH {
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
    if (ar.length == 1) suffix = '00000000';
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
      return a - b
    });
  }

  static median(numbers) {
    var median = 0, numsLen = numbers.length;
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

  static percent(val1:number, val2:number):number{
    return Math.round(100 * (val1 - val2) / val2)
  }
}

