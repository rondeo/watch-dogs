import {VOOrder} from "../my-models";
import * as _ from 'lodash';

export class MarketHistory{

  static parseHistory(orders:VOOrder[]){
    let historyBuy =  orders.filter(function (item) {
      return item.action === 'BUY';
    });

    let historySell = orders.filter(function (item) {
      return item.action === 'SELL';
    });

    let sumBuy = Math.round( _.sumBy(historyBuy, 'amountBaseUS'));

    let sumSell = Math.round(_.sumBy(historySell, 'amountBaseUS'));

    return{
      historyBuy:historyBuy,
      historySell:historySell,
      sumBuy:sumBuy,
      sumSell:sumSell,
      lenghtSell:historySell.length,
      lenghtBuy:historyBuy.length
    }
  }

  static parseHistory2(orders:VOOrder[]):{amountBuy:string, rateBuy:string, amountSell:string, rateSell:string}[]{
    let out:{amountBuy:string, rateBuy:string, amountSell:string, rateSell:string}[] = [];

    for(let i = 1, n= orders.length; i<n; i+=2 ){
      let order1:VOOrder = orders[i-1];
      let order2:VOOrder = orders[i];
      if(order1.action === order2.action){

        if(order1.action ==='SELL') {
          out.push({
            amountBuy:'',
            rateBuy:'',
            amountSell:order1.amountBaseUS+'',
            rateSell:order1.priceBaseUS+''

          })
          out.push({
            amountBuy:'',
            rateBuy:'',
            amountSell:order2.amountBaseUS+'',
            rateSell:order2.priceBaseUS+''

          })
        } else  if(order1.action ==='BUY') {
          out.push({
            amountBuy:order1.amountBaseUS+'',
            rateBuy:order1.priceBaseUS+'',
            amountSell:'',
            rateSell:''

          })
          out.push({
            amountBuy:order2.amountBaseUS+'',
            rateBuy:order2.priceBaseUS+'',
            amountSell:'',
            rateSell:''

          })
        }
      }
      else{
        if(order1.action ==='SELL'){
          out.push({
            amountBuy:order2.amountBaseUS+'',
            rateBuy:order2.priceBaseUS+'',
            amountSell:order1.amountBaseUS+'',
            rateSell:order1.priceBaseUS+''

          })

        }else{
          out.push({
            amountBuy:order1.amountBaseUS+'',
            rateBuy:order1.priceBaseUS+'',
            amountSell:order2.amountBaseUS+'',
            rateSell:order2.priceBaseUS+''

          })

        }

      }
    }

    return out;
  }
}