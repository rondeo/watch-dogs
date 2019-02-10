import {VOOrderBook} from '../../models/app-models';
import * as moment from 'moment';
import * as _ from 'lodash';

export class UtilsBooks {
  static bittrex(r: any, price: number) {

    return {
      buy: UtilsBooks.groupBooksWithPrice(r.buy, price),
      sell: UtilsBooks.groupBooksWithPrice(r.sell, price)
    }

    /* return {
       buy: r.buy.map(function (item: VOOrderBook) {
         item.dQuantity = (+item.Quantity * +item.Rate).toFixed(2);
         item.Price = price?(price * +item.Rate).toFixed(3):item.Rate+'';

         return item;
       }),
       sell: r.sell.map(function (item: VOOrderBook) {
         item.dQuantity =  (+item.Quantity * +item.Rate).toFixed(2);
         item.Price =  price?(price * +item.Rate).toFixed(3):item.Rate+'';
         return item;
       })
     }*/
  }

  static getRateForAmounts(ar: { amountCoin: number, rate: number }[], amount1: number, amount2: number, amount3: number): { rate1: number, rate2: number, rate3: number } {
    let prices: number[] = [];
    let sum = 0;
    let rate1 = 0;
    let rate2 = 0;
    let rate3 = 0;

    for (let i = 0, n = ar.length; i < n; i++) {
      let item = ar[i];
      sum += item.amountCoin;
      if (rate1 === 0 && sum > amount1) rate1 = item.rate;
      if (rate2 === 0 && sum > amount2) rate2 = item.rate;
      if (rate3 === 0 && sum > amount3) rate3 = item.rate;
    }
    return {rate1, rate2, rate3};
  }

  static getAvgRateForAmountCoin(ar: { amountCoin: number, rate: number }[], amountCoin: number): number {
    let rates = 0;
    let sum = 0;
    let i = 0;
    for (let n = ar.length; i < n; i++) {
      let item = ar[i];
      rates += item.rate;
      sum += item.amountCoin * item.rate;
      if (sum >= amountCoin) break;
    }
    return +(rates / i).toPrecision(5);
  }

  static getAvgBooksForAmountBase(ar: { amountCoin: number, rate: number }[], amountBase: number): number {
    let prices: number[] = [];
    let sum = 0;
    for (let i = 0, n = ar.length; i < n; i++) {
      let item = ar[i];
      sum += item.amountCoin * item.rate;
      prices.push(item.rate);
      if (sum >= amountBase) break;
    }
    return parseFloat((_.sum(prices) / prices.length).toPrecision(5));
  }

  static calculateRateForAmountBase(ar: VOOrderBook[], amountBase: number): number {
    let prices: number[] = [];
    let sum = 0;
    for (let i = 0, n = ar.length; i < n; i++) {
      let item = ar[i];

      sum += +item.Quantity * item.Rate;
      prices.push(+item.Rate);
      if (sum >= amountBase) break;
    }

    return parseFloat((_.sum(prices) / prices.length).toPrecision(5));
  }

  static getRateForAmountCoin(ar: { amountCoin, rate: number }[], amountCoin: number): number {
    let prices: number[] = [];
    let sum = 0;
    for (let i = 0, n = ar.length; i < n; i++) {
      let item = ar[i];
      sum += +item.amountCoin;
      if (sum >= amountCoin) return item.rate;
    }

    return 0
  }

  static getRateForAmountBase(ar: { amountCoin, rate: number }[], amountBase: number): number {
    let prices: number[] = [];
    let sum = 0;
    for (let i = 0, n = ar.length; i < n; i++) {
      let item = ar[i];
      sum += +item.amountCoin * item.rate;
      if (sum >= amountBase) return item.rate;
    }
    return 0
  }

  static getHistoryDuration(res): number {
    let l = res.length;
    let first = res[0];
    let last = res[res.length - 1];
    let firstDate = moment(first.TimeStamp);
    let lastDate = moment(last.TimeStamp);
    return firstDate.diff(lastDate, 'seconds');
  }


  static groupBooksByPrecision(ar: VOOrderBook[], precision: number = 4) {
    let out: VOOrderBook[] = [];
    ar.forEach(function (item: VOOrderBook, index: number) {

      let rate = parseFloat((+item.Rate).toPrecision(this.precision));
      if (!this.currentRate) this.currentRate = rate;
      this.sum += (+item.Quantity * +item.Rate);

      if (rate !== this.currentRate) {
        this.out.push({Quantity: this.sum, Rate: this.currentRate});
        this.sum = 0;
        this.currentRate = rate;
      }
      if (index === this.last) this.out.push({Quantity: this.sum, Rate: this.currentRate});

    }, {out: out, currentPrice: null, precision: precision, last: ar.length - 1, sum: 0});
    return out;
  }


  static groupBooksWithPrice(ar: VOOrderBook[], price: number) {
    let out: VOOrderBook[] = [];
    ar.forEach(function (item: VOOrderBook, index: number) {

      let p = (this.price * +item.Rate).toPrecision(4);
      if (!this.currentPrice) this.currentPrice = p;
      this.sum += (+item.Quantity * +item.Rate);

      if (p !== this.currentPrice) {
        this.out.push({Quantity: this.sum, dQuantity: (this.sum * this.price).toFixed(0), Price: this.currentPrice});
        this.sum = 0;
        this.currentPrice = p;
      }
      if (index === this.last) this.out.push({Quantity: this.sum, dQuantity: (this.sum * this.price).toFixed(0), Price: this.currentPrice});

    }, {out: out, currentPrice: null, price: price, last: ar.length - 1, sum: 0});
    return out;
  }


}