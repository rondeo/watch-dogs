import {VOOrder} from '../models/app-models';
import {ApiPublicBinance} from '../apis/api-public/api-public-binance';

export class UTILS {

  static xmlToJson(xml):string | any {
    // Create the return object
    let obj: any = {};
    if (xml.nodeType === 1) { // element
      // do attributes
      if (xml.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let j = 0; j < xml.attributes.length; j++) {
          const attribute = xml.attributes.item(j);
          obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType === 3) { // text
      const str = xml.nodeValue.trim();
      if (str.length) return str;
    } else if (xml.nodeType === 4) {
      return xml.data;
    }
    // do children
    if (xml.hasChildNodes()) {
      for (let i = 0, n = xml.childNodes.length; i < n; i++) {
        const item = xml.childNodes.item(i);
        const nodeName = item.nodeName;

        if (typeof(obj[nodeName]) === 'undefined') {
          const out = this.xmlToJson(item);
          if (Object.keys(out).length) obj[nodeName] = out;
        } else {
          const out2 = UTILS.xmlToJson(item);
          if (Object.keys(out2).length === 0) continue;
          if (typeof(obj[nodeName].push) === 'undefined') obj[nodeName] = [obj[nodeName], out2];
          else obj[nodeName].push(out2);

        }
      }
    }
    return obj;
  }

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



