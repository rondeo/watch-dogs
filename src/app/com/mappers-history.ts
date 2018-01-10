import {VOMarketHistory} from "../models/app-models";

export interface VOHistoryStats{
  sold:{amount:number, price:number, priceUS:number};
  bought:{amount:number, price:number, priceUS:number};
  maxSold:{amount:number, price:number, priceUS:number};
  maxBought:{amount:number, price:number, priceUS:number};
}

export class MappersHistory{

  static parseData(ar:VOMarketHistory[], priceBase:number):VOHistoryStats{

    let totalSell:number = 0;
    let totalBuy:number = 0;
    let sumBuy:number = 0;
    let sumSell:number = 0;
    let spentBuy:number = 0;
    let spentSell:number = 0;

    let maxBought:number = 0;
    let maxSold:number = 0;
    let maxPriceBought:number = 0;
    let maxPriceSold:number = 0;

    let qtySell:number = 0;
    let qtyBuy:number = 0;
    let maxCoinSell:number = 0;
    let maxCoinBuy:number = 0;

    ar.forEach(function (item) {
      if(item.OrderType === 'SELL'){
        qtySell += item.Quantity;
        totalSell += item.Total;
        sumSell+= item.Price;
        spentSell+= item.Total * item.Price;
        if(item.Total> maxSold) {
          maxCoinSell = item.Quantity;
          maxSold = item.Total;
          maxPriceSold = item.Price;
          // maxAmountSold = item.Total;
        }
      }else if(item.OrderType === 'BUY'){
        qtyBuy += item.Quantity;
        totalBuy += item.Total;
        sumBuy +=item.Price;
        spentBuy+= item.Total * item.Price;
        if(item.Total> maxBought) {
          maxCoinBuy = item.Quantity;
          maxBought = item.Total;
          maxPriceBought = item.Price;
          // maxAmountBought = item.Total;
        }
      }

    });



    return {
      sold:{
        amount:parseFloat((totalSell * priceBase).toFixed(0)),
        price:parseFloat(totalSell?(spentSell/totalSell).toPrecision(8):'0'),
        priceUS:parseFloat(totalSell?(spentSell/totalSell * priceBase).toPrecision(4):'0')
      },
      bought:{
        amount:parseFloat((totalBuy * priceBase).toFixed(0)),
        price:parseFloat(totalBuy?(spentBuy/totalBuy).toPrecision(8):'0'),
        priceUS:parseFloat(totalBuy?(spentBuy/totalBuy * priceBase).toPrecision(4):'0'),
      },
      maxSold:{
        amount:parseFloat((maxSold  * priceBase).toFixed(0)),
        price:parseFloat(maxPriceSold.toPrecision(8)),
        priceUS:parseFloat((maxPriceSold*priceBase).toPrecision(4))
      },
      maxBought:{
        amount:parseFloat((maxBought  * priceBase).toFixed(0)),
        price:parseFloat(maxPriceBought.toPrecision(8)),
        priceUS:parseFloat((maxPriceBought*priceBase).toPrecision(4))
      }
    }

  }
}