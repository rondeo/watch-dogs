import {VOOrderBook} from "../models/app-models";
import * as moment from "moment";
import * as _ from 'lodash';

export class MappersBooks{
  static bittrex(r:any, price:number){

    return {
      buy:MappersBooks.groupBooksWithPrice(r.buy, price),
      sell:MappersBooks.groupBooksWithPrice(r.sell, price)
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

  static calculateRateForAmountBase(ar:VOOrderBook[], amountBase:number):number{
    let prices:number[] = [];
    let sum=0;
    for(let i =0, n=ar.length; i<n; i++){
      let item = ar[i];

      sum+= +item.Quantity * item.Rate;
      prices.push(+item.Rate);
      if(sum>=amountBase) break;
    }

    return parseFloat(( _.sum(prices)/prices.length).toPrecision(5));
  }

  static calculateRateForAmountCoin(ar:VOOrderBook[], amountCoin:number):number{
    let prices:number[] = [];
    let sum=0;
    for(let i =0, n=ar.length; i<n; i++){
      let item = ar[i];
      sum+= +item.Quantity;
      prices.push(+item.Rate);
      if(sum>=amountCoin) break;
    }

    return parseFloat(( _.sum(prices)/prices.length).toPrecision(5));
  }

  static getHistoryDuration(res):number{
    let l = res.length;
    let first = res[0];
    let last = res[res.length-1];
    let  firstDate = moment(first.TimeStamp);
    let  lastDate = moment(last.TimeStamp);
    return firstDate.diff(lastDate, 'seconds');
  }


  static groupBooksByPrecision(ar:VOOrderBook[], precision:number = 4){
    let out:VOOrderBook[] = [];
    ar.forEach(function (item: VOOrderBook, index:number) {

      let rate =  parseFloat((+item.Rate).toPrecision(this.precision));
      if(!this.currentRate) this.currentRate = rate;
      this.sum += (+item.Quantity * +item.Rate);

      if(rate !== this.currentRate) {
        this.out.push({Quantity:this.sum,  Rate:this.currentRate});
        this.sum = 0;
        this.currentRate = rate;
      }
      if(index === this.last) this.out.push({Quantity:this.sum,  Rate:this.currentRate});

    }, {out:out, currentPrice:null, precision:precision, last:ar.length -1, sum:0});
    return out;
  }



  static groupBooksWithPrice(ar:VOOrderBook[], price:number){
    let out:VOOrderBook[] = [];
    ar.forEach(function (item: VOOrderBook, index:number) {

      let p = (this.price * +item.Rate).toPrecision(4);
      if(!this.currentPrice) this.currentPrice = p;
      this.sum += (+item.Quantity * +item.Rate);

      if(p !== this.currentPrice) {
        this.out.push({Quantity:this.sum, dQuantity:(this.sum*this.price).toFixed(0), Price:this.currentPrice});
        this.sum = 0;
        this.currentPrice = p;
      }
      if(index === this.last) this.out.push({Quantity:this.sum, dQuantity:(this.sum*this.price).toFixed(0), Price:this.currentPrice});

    }, {out:out, currentPrice:null, price:price, last:ar.length -1, sum:0});
    return out;
  }


}