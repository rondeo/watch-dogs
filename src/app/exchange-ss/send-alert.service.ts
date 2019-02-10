import { Injectable } from '@angular/core';
import {Http} from '@angular/http';
import {VOMarketCap} from '../amodels/app-models';

@Injectable()
export class SendAlertService {

  marketsHistory: {[s: string]: VOMarketCap}[];

  tollerance = 5;
  change_1h = 10;
  chamge_24h = 10;

  constructor(private http: Http) {

  }


  comparePriceUsd(newVal: VOMarketCap, oldVal: VOMarketCap, tolerance: number): number {

    let newUsd = newVal.price_usd;
    let oldUsd = oldVal.price_usd;

    return (Math.abs(newUsd - oldUsd) > oldUsd * tolerance) ? newUsd : 0;

  }
 /* comparePrice1h(newVal:VOExchangeData, oldVal:VOExchangeData, tolerance:number):number{

    let newV = newVal.percent_change_1h;
    let oldV= oldVal.percent_change_1h;

    return (MATH.abs(newV - oldV) > oldUsd * tolerance) ? newUsd:0

  }*/



  analiseData(newMarket: {[s: string]: VOMarketCap}) {

    if (!this.marketsHistory) {
      this.marketsHistory = [newMarket];
      return;
    }

    let alerts: any[] = [];

    let lastMarket: {[s: string]: VOMarketCap} = this.marketsHistory[this.marketsHistory.length - 1];

    let tollerance = 100 / this.tollerance;



    for (let str in newMarket) {

      let newM = newMarket[str];

      let newPrice = this.comparePriceUsd( newM, lastMarket[str], tollerance);
      if (newPrice) {
        alerts.push({
          symbol: str,
          lastPrice: lastMarket[str].price_usd,
          newPrice: newMarket[str].price_usd,

        });
      }

      if (Math.abs(newM.percent_change_1h)  > this.change_1h ) {
        alerts.push({
          symbol: str,
          lastchange_1h: lastMarket[str].percent_change_1h,
          newchange_1h: newMarket[str].percent_change_1h,

        });
      }


    }



/*

    let alerts:any[] = [];

    newMarket.forEach(function (market) {

      let newMarket = market[wallet.symbol];

      let newUsd = newMarket.price_usd;

      let newBTC = (newMarket.price_btc / 1000);

      if (!wallet.analitics) wallet.analitics = {
        price_usd_history: [newUsd],
        price_btc_history: [newBTC],
        price_usd_historyDisplay: ''
      };

      let usdHistory = wallet.analitics.price_usd_history;
      let lastUsd = usdHistory[usdHistory.length - 1];

      let report
      if (MATH.abs(newUsd - lastUsd) > lastUsd * tollerance) {
        usdHistory.push(newUsd);
        //if(ar1.length>10) ar1.shift();


        wallet.analitics.price_usd_historyDisplay = usdHistory.map(function (item) {
          return item.toFixed(2);
        }).toString();

        report = {
          symbol: newMarket.symbol,
          coindatas: wallet.analitics.price_usd_historyDisplay

        }
      }


      console.log(wallet.analitics.price_usd_history);
      wallet.market = newMarket;

      wallet.usd = (wallet.market.price_usd * wallet.balanceDisplay).toFixed(2);
      if (report) {
        report.have = wallet.usd;
        alerts.push(report)
      }
    })
*/


    this.marketsHistory.push(newMarket);
  }
  sendMarketChange(data: any) {


  }


}


