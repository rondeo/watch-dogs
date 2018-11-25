import {VOOrder} from '../models/app-models';
import {ApiPublicBinance} from '../apis/api-public/api-public-binance';

export class UTILS {

  static decimals: { [symbol: string]: { rateDecimals: number, amountDecimals: number } } = {};


  static toString(obj: any) {
    let out = ' ';
    for (let str in obj) out +=  str + ' ' + obj[str] + '; ';
    return out;
  }


  static async wait(seconds: number) {
    return new Promise(function (resolve, reject) {
      setTimeout(resolve, seconds * 1000);
    });
  }

  static floorTo = function (number, n) {
    let k = Math.pow(10, n);
    return (Math.floor(number * k) / k);
  };

  static toURLparams(obj: any) {
    return Object.keys(obj).map(function (item) {
      return item + '=' + this.obj[item];
    }, {obj: obj}).join('&');
  }

  static getDecimals(market: string) {

  }

  static parseDecimals(data: { amountCoin: string, rate: string }[]) {
    let maxRate = 0;
    let maxAmount = 0;
    // console.log(orders);
    data.forEach(function (item) {
      let ar = String(item.rate).split('.');
      if (ar.length === 2) {
        const decRate = ar[1].length;
        if (decRate > maxRate) maxRate = decRate;
      }
      ar = String(item.amountCoin).split('.');
      if (ar.length === 2) {
        const decAm = ar[1].length;
        if (decAm > maxAmount) maxAmount = decAm;
      }
    });

    return {
      rateDecimals: maxRate,
      amountDecimals: maxAmount
    };
  }

  static setDecimals(exchange: string, market: string, orders: { amountCoin: string, rate: string }[]) {
    if (!UTILS.decimals[exchange + market]) {
      UTILS.decimals[exchange + market] = UTILS.parseDecimals(orders);
      // console.log('setting decimals ' + exchange + base + coin, val);
    }
  }

  static formatDecimals2(exchange: string, base: string, coin: string, data: { amountCoin: number, rate: number }) {
    if (!UTILS.decimals[exchange + base + coin]) {
      throw new Error(' no formatter for ' + exchange + base + coin);
    }
    const val = UTILS.decimals[exchange + base + coin];
    const amountDecimals = val.amountDecimals;
    data.amountCoin = +data.amountCoin.toFixed(val.amountDecimals);
    data.rate = +data.rate.toFixed(val.rateDecimals);
  }

  static formatDecimals(exchange: string, market, data: { amountCoin: number, rate: number }) {
    if (!UTILS.decimals[exchange + market]) {

      throw new Error(' no formatter for ' + exchange + market);
    }

    const val = UTILS.decimals[exchange + market];
    const amountDecimals = val.amountDecimals;
    data.amountCoin = +data.amountCoin.toFixed(val.amountDecimals);
    data.rate = +data.rate.toFixed(val.rateDecimals);
    return {};
  }

  static find(currentValues: any, actionValues: any[]): any {
   return actionValues.find(function (item) {
     for (let str in item ) if (currentValues[str] !== item[str]) return false;
     return true;
    });


  }
}

export function applyMixins(derivedCtor: any, baseCtors: any[]) {
  console.log(derivedCtor);
  baseCtors.forEach(baseCtor => {
    console.log(baseCtors);
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      console.log(name);
      if (name !== 'constructor') {
        derivedCtor.prototype[name] = baseCtor.prototype[name];
      }
    });
  });


}



