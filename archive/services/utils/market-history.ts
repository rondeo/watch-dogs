
import * as _ from 'lodash';
import {VOOrder} from "../../../src/app/models/app-models";

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
            amountSell:order1.amountUS+'',
            rateSell:order1.priceUS+''

          })
          out.push({
            amountBuy:'',
            rateBuy:'',
            amountSell:order2.amountUS+'',
            rateSell:order2.priceUS+''

          })
        } else  if(order1.action ==='BUY') {
          out.push({
            amountBuy:order1.amountUS+'',
            rateBuy:order1.priceUS+'',
            amountSell:'',
            rateSell:''

          })
          out.push({
            amountBuy:order2.amountUS+'',
            rateBuy:order2.priceUS+'',
            amountSell:'',
            rateSell:''

          })
        }
      }
      else{
        if(order1.action ==='SELL'){
          out.push({
            amountBuy:order2.amountUS+'',
            rateBuy:order2.priceUS+'',
            amountSell:order1.amountUS+'',
            rateSell:order1.priceUS+''

          })

        }else{
          out.push({
            amountBuy:order1.amountUS+'',
            rateBuy:order1.priceUS+'',
            amountSell:order2.amountUS+'',
            rateSell:order2.priceUS+''

          })

        }

      }
    }

    return out;
  }
}