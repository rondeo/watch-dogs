import {VOOrder} from '../amodels/app-models';
import * as moment from 'moment';
import {VOUser} from '../a-core/services/auth-http.service';

export interface VOHistoryStats {
  sold: {amount: number, price: number, priceUS: number};
  bought: {amount: number, price: number, priceUS: number};
  maxSold: {amount: number, price: number, priceUS: number};
  maxBought: {amount: number, price: number, priceUS: number};
}

export class MappersHistory {


  static getHistoryDuration(res: VOOrder[]): number {
    let l = res.length;
    let first = res[0];
    let last = res[res.length - 1];
    return (first.timestamp - last.timestamp) / 1000;
  }

  static parseData2(ar: VOOrder[], priceBase: number): VOHistoryStats {

    let totalSell = 0;
    let totalBuy = 0;
    let sumBuy = 0;
    let sumSell = 0;
    let spentBuy = 0;
    let spentSell = 0;

    let maxBought = 0;
    let maxSold = 0;
    let maxPriceBought = 0;
    let maxPriceSold = 0;

    ar.forEach(function (item) {
      if (item.action === 'SELL') {
        totalSell += item.amountBase;
        sumSell += item.rate;
        spentSell += item.amountBase * item.rate;
        if (item.amountBase > maxSold) {
          maxSold = item.amountBase;
          maxPriceSold = item.rate;
        }
      } else if (item.action === 'BUY') {
        totalBuy += item.amountBase;
        sumBuy += item.rate;
        spentBuy += item.amountBase * item.rate;
        if (item.amountBase > maxBought) {
          maxBought = item.amountBase;
          maxPriceBought = item.rate;
        }
      }

    });



    return {
      sold: {
        amount: parseFloat((totalSell * priceBase).toFixed(0)),
        price: parseFloat(totalSell ? (spentSell / totalSell).toPrecision(8) : '0'),
        priceUS: parseFloat(totalSell ? (spentSell / totalSell * priceBase).toPrecision(4) : '0')
      },
      bought: {
        amount: parseFloat((totalBuy * priceBase).toFixed(0)),
        price: parseFloat(totalBuy ? (spentBuy / totalBuy).toPrecision(8) : '0'),
        priceUS: parseFloat(totalBuy ? (spentBuy / totalBuy * priceBase).toPrecision(4) : '0'),
      },
      maxSold: {
        amount: parseFloat((maxSold  * priceBase).toFixed(0)),
        price: parseFloat(maxPriceSold.toPrecision(8)),
        priceUS: parseFloat((maxPriceSold * priceBase).toPrecision(4))
      },
      maxBought: {
        amount: parseFloat((maxBought  * priceBase).toFixed(0)),
        price: parseFloat(maxPriceBought.toPrecision(8)),
        priceUS: parseFloat((maxPriceBought * priceBase).toPrecision(4))
      }
    };

  }

  static parseData(ar: any[], priceBase: number): VOHistoryStats {

    let totalSell = 0;
    let totalBuy = 0;
    let sumBuy = 0;
    let sumSell = 0;
    let spentBuy = 0;
    let spentSell = 0;

    let maxBought = 0;
    let maxSold = 0;
    let maxPriceBought = 0;
    let maxPriceSold = 0;

    let qtySell = 0;
    let qtyBuy = 0;
    let maxCoinSell = 0;
    let maxCoinBuy = 0;

    ar.forEach(function (item) {
      if (item.OrderType === 'SELL') {
        qtySell += item.Quantity;
        totalSell += item.Total;
        sumSell += item.Price;
        spentSell += item.Total * item.Price;
        if (item.Total > maxSold) {
          maxCoinSell = item.Quantity;
          maxSold = item.Total;
          maxPriceSold = item.Price;
          // maxAmountSold = item.Total;
        }
      } else if (item.OrderType === 'BUY') {
        qtyBuy += item.Quantity;
        totalBuy += item.Total;
        sumBuy += item.Price;
        spentBuy += item.Total * item.Price;
        if (item.Total > maxBought) {
          maxCoinBuy = item.Quantity;
          maxBought = item.Total;
          maxPriceBought = item.Price;
          // maxAmountBought = item.Total;
        }
      }

    });



    return {
      sold: {
        amount: parseFloat((totalSell * priceBase).toFixed(0)),
        price: parseFloat(totalSell ? (spentSell / totalSell).toPrecision(8) : '0'),
        priceUS: parseFloat(totalSell ? (spentSell / totalSell * priceBase).toPrecision(4) : '0')
      },
      bought: {
        amount: parseFloat((totalBuy * priceBase).toFixed(0)),
        price: parseFloat(totalBuy ? (spentBuy / totalBuy).toPrecision(8) : '0'),
        priceUS: parseFloat(totalBuy ? (spentBuy / totalBuy * priceBase).toPrecision(4) : '0'),
      },
      maxSold: {
        amount: parseFloat((maxSold  * priceBase).toFixed(0)),
        price: parseFloat(maxPriceSold.toPrecision(8)),
        priceUS: parseFloat((maxPriceSold * priceBase).toPrecision(4))
      },
      maxBought: {
        amount: parseFloat((maxBought  * priceBase).toFixed(0)),
        price: parseFloat(maxPriceBought.toPrecision(8)),
        priceUS: parseFloat((maxPriceBought * priceBase).toPrecision(4))
      }
    };

  }
}
