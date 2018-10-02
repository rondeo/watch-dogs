import {VOOrder} from '../models/app-models';
import {ApiPublicBinance} from '../apis/api-public/api-public-binance';

export class UTILS {



  static floorTo = function (number, n) {
    var k = Math.pow(10, n);
    return (Math.floor(number * k) / k);
  }

  static toURLparams(obj: any) {
    return Object.keys(obj).map(function (item) {
      return item + '=' + this.obj[item];
    }, {obj: obj}).join('&');
  }

  static setDecimals(exchange: string, base: string, coin: string, orders: { amountCoin: string, rate: string }[]) {
    if (!UTILS.decimals[exchange + base + coin]) {
      let maxRate = 0;
      let maxAmount = 0;
      // console.log(orders);
      orders.forEach(function (item) {
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
      })

      const val = {
        rateDecimals: maxRate,
        amountDecimals: maxAmount
      }
      UTILS.decimals[exchange + base + coin] = val;
      // console.log('setting decimals ' + exchange + base + coin, val);
    }
  }

  static decimals: { [symbol: string]: { rateDecimals: number, amountDecimals: number } } = {};

  static formatDecimals2(exchange: string, base: string, coin: string, data: { amountCoin: number, rate: number }) {
    if (!UTILS.decimals[exchange + base + coin]) {
      throw new Error(' no formatter for ' + exchange + base + coin);
    }
    const val = UTILS.decimals[exchange + base + coin];
    const amountDecimals = val.amountDecimals;
    data.amountCoin = +data.amountCoin.toFixed(val.amountDecimals);
    data.rate = +data.rate.toFixed(val.rateDecimals);
  }

  static formatDecimals(exchange: string, base: string, coin: string, data: { amountCoin: number, rate: number }) {
    if (!UTILS.decimals[exchange + base + coin]) {
      throw new Error(' no formatter for ' + exchange + base + coin);
    }
    const val = UTILS.decimals[exchange + base + coin];
    const amountDecimals = val.amountDecimals;
    data.amountCoin = +data.amountCoin.toFixed(val.amountDecimals);
    data.rate = +data.rate.toFixed(val.rateDecimals);
  }


}

export function applyMixins(derivedCtor: any, baseCtors: any[]) {
  console.log(derivedCtor)
  baseCtors.forEach(baseCtor => {
    console.log(baseCtors)
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      console.log(name);
      if (name !== 'constructor') {
        derivedCtor.prototype[name] = baseCtor.prototype[name];
      }
    });
  });


}



