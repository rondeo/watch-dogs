import { Injectable } from '@angular/core';
import {BooksService} from "../../../services/books-service";
import {UtilsOrder, VOTradesStats} from "../../../services/utils-order";
import {ApiBase} from "../../services/apis/api-base";


import {promise} from "selenium-webdriver";
import {VOBooksStats, VOMarketCap} from "../../../models/app-models";

@Injectable()
export class MarketCollectorService {

  constructor() { }

  collectMarketHistories(api:ApiBase, coinsMC:VOMarketCap[], baseMC:VOMarketCap,  callback){
    let i = -1;
    let results = [];

    this.collectMarketsData(api, coinsMC, baseMC, i, results, ()=>{

      callback(results);

    } )
  }

  private collectMarketsData(api:ApiBase, coins:VOMarketCap[], baseMC:VOMarketCap,  i , results:any[], callBack:Function){

    i++;
    if(i>=coins.length){
      callBack()
    }else {
      setTimeout(()=>{
        let mc = coins[i];

        this.getMarketHistory(api, mc, baseMC,(summary)=>{

          results.push(summary);

          this.collectMarketsData(api, coins, baseMC, i, results, callBack)
        });
      }, 1000)


    }

  }

  getMarketHistory(api:ApiBase,  coinMC:VOMarketCap, baseMC:VOMarketCap, callBack){

    MarketCollectorService.getOrdersStats(api, coinMC, baseMC)
      .then(res=>{
        callBack(res);
      }).catch(console.error)

  }

  static getBooksStats(api:ApiBase, coinMC:VOMarketCap, baseMC:VOMarketCap):Promise<VOBooksStats>{

    let priceBaseUS = baseMC.price_usd;
    let base = baseMC.symbol;
    let coin = coinMC.symbol;
    let amountBase = 1000 / priceBaseUS;
    let priceCoinMC = coinMC.price_usd;

    return new Promise(function (resolve, reject) {
      api.downloadBooks(base, coin).subscribe(books => {


        let rateBuy = BooksService.getRateForAmountBase(books.buy, amountBase);
        let rateSell = BooksService.getRateForAmountBase(books.sell, amountBase);

        let rateToSellUS = +(rateBuy * priceBaseUS).toPrecision(4);
        let rateToBuyUS = +(rateSell * priceBaseUS).toPrecision(4);

        let percentDiff = +(100 * (rateSell - rateBuy) / rateSell).toFixed(2);

        //console.log(rateToBuyUS, rateToSellUS, percentDiff);
        // console.log(books);

        let priceToMC = Math.round(10000 * (rateToBuyUS - priceCoinMC) / priceCoinMC) / 100;

        let stats: VOBooksStats = {
          exchange: api.exchange,
          coin:coin,
          base: base,
          coinMC:coinMC,
          baseMC:baseMC,
          booksDiff: percentDiff,
          rateToBuy: rateSell,
          rateToSell: rateBuy,
          priceToSellUS: rateToSellUS,
          priceToBuyUS: rateToBuyUS,
          priceToMC: priceToMC,
          priceBaseUS:priceBaseUS
        };

        resolve(stats);

      })

    })
  }


  static getOrdersStats(api:ApiBase, coinMC:VOMarketCap, baseMC:VOMarketCap):Promise<VOTradesStats> {

    let priceBaseUS = baseMC.price_usd;
    let base = baseMC.symbol;
    let coin = coinMC.symbol;
    let amountBase = 1000 / priceBaseUS;

    return new Promise(function (resolve, reject) {

      api.downloadMarketHistory(base, coin).subscribe(res => {
        res.reverse();
        //console.log(res);
        let history = UtilsOrder.analizeOrdersHistory2(res, priceBaseUS);

            let stats: VOTradesStats = {
              exchange: api.exchange,
              timestamp:Date.now(),
              time:new Date().toLocaleTimeString(),
              amountBuy:0,
              amountSell:0,
              speed:0,
              volUS:0,
              //coinMC: coinMC,
              //baseMC:baseMC,
              priceBaseUS:priceBaseUS,
              rateLast:history.rateLast,
              rateLastUS:history.priceLastUS,
              priceToMC: Math.round(10000 * (history.priceLastUS - coinMC.price_usd) / coinMC.price_usd) / 100,
              //bubbles: history.bubbles,
              duratinMin: history.duration / 60,
              speedPerMin: (history.speed * 60),
              amountBuyUS: history.sumBuyUS,
              amountSellUS: history.sumSellUS,
              perHourBuy: history.sumBuyUS / (history.duration / 60 / 60),
              perHourSell: history.sumSellUS / (history.duration / 60 / 60),
              coin: history.coin,
              base: history.base,
              totalUS: history.sumBuyUS - history.sumSellUS

            };

            resolve(stats);
      })
    })
  }


 /* static getHistoryAndBooksStats(api:ApiBase, mc:VOMarketCap, baseMC:VOMarketCap){
     console.log('getMarketStats   ', api);
    let priceBaseUS = baseMC.price_usd;
    let base = baseMC.symbol;
    let coin = mc.symbol;
    let amountBase = 1000/priceBaseUS;
    return new Promise(function(resolve, reject){
      api.downloadMarketHistory(base, coin).subscribe(res=>{
        res.reverse();
        //console.log(res);
        let history = UtilsOrder.analizeOrdersHistory2(res, priceBaseUS);
        setTimeout(()=>{

          api.downloadBooks(base, coin).subscribe(books=>{



            let rateBuy =  BooksService.getRateForAmountBase(books.buy, amountBase);
            let rateSell = BooksService.getRateForAmountBase(books.sell, amountBase);

            let rateToSellUS = +(rateBuy * priceBaseUS).toPrecision(4);
            let rateToBuyUS = +(rateSell * priceBaseUS).toPrecision(4);

            let percentDiff = +(100 * (rateSell - rateBuy)/rateSell).toFixed(2);

            //console.log(rateToBuyUS, rateToSellUS, percentDiff);
            // console.log(books);

            let priceToMC = Math.round(10000* (rateToBuyUS - mc.price_usd)/mc.price_usd)/100;

            let summary:IMarketSummary = {
              exchange:api.exchange,
              MC:mc,
              bubbles:history.bubbles,
              duratinMin:history.duration/60,
              speedPerMin:(history.speed * 60),
              sumBuyUS:history.sumBuyUS,
              sumSellUS:history.sumSellUS,
              perHourBuy:history.sumBuyUS/ (history.duration/60/60),
              perHourSell:history.sumSellUS/ (history.duration/60/60),
              coin:history.coin,
              base:history.base,
              booksDiff:percentDiff,
              rateToBuy:rateSell,
              rateToSell:rateBuy,
              priceToSellUS:rateToSellUS,
              priceToBuyUS:rateToBuyUS,
              totalUS:history.sumBuyUS - history.sumSellUS,
              priceToMC:priceToMC,
              priceBaseUS:priceBaseUS

            };

            resolve(summary);

          })

        }, 1000);



      })
    })
  }*/

}
