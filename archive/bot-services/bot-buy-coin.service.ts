import { Injectable } from '@angular/core';
import {ConnectorApiService} from "../../src/app/my-exchange/services/connector-api.service";
import {MarketCapService} from "../../src/app/market-cap/services/market-cap.service";

import {IApiPublic} from "../../src/app/my-exchange/services/apis/api-base";
import {IMarketRecommended, UtilsOrder} from "../../src/app/com/utils-order";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {HttpClient} from "@angular/common/http";
import {reject} from "q";
import {VOMarket, VOMarketCap} from "../../src/app/models/app-models";
import {DatabaseService} from "../../src/app/services/database.service";

@Injectable()
export class BotBuyCoinService {


  private markets:any[]
  private MC:{[symbol:string]:VOMarketCap};
  private publicAPI:IApiPublic;
  private recommendedSub:Subject<IMarketRecommended[]> = new Subject();

  private subMC;
  recommended$():Observable<IMarketRecommended[]>{
    return this.recommendedSub.asObservable();
  }

  destroy(){

    this.subMC.unsubscribe();
  }
  constructor(
    private http:HttpClient,
   // private marketCap:MarketCapService,
    private database:DatabaseService

  ) {

    /*this.subMC = marketCap.getCoinsObs().subscribe(MC=>{
      this.MC = MC;
      this.filterGainers();
    });*/
  }

 /* saveMarkets(markets:IMarketRecommended[]){
    return new Promise((resolve, reject)=>{
      this._saveMarkets(markets, -1, resolve, reject);
    })

  }

  private _saveMarkets(markets:IMarketRecommended[], i, resolve, resject){
    i++
    if(i>=markets.length){
      resolve(markets);
      return;
    }
    let market = markets[i];

    this.database.saveMarket(market).subscribe(res=>{
      market.reports = JSON.stringify(res);
      this._saveMarkets(markets, i, resolve, resject);
    }, resject);
  }

*/


  getRecommended(api:IApiPublic):Observable<IMarketRecommended[]>{
    this.publicAPI = api;
    this.publicAPI.downloadMarkets().subscribe(markets=> {
      this.markets = markets;
      this.filterGainers();
    });

    return this.recommended$()
  }

  filterGainers(){
    if(!this.MC || !this.markets) return;
    let gainers =  this.markets.filter(function (item) {
      item.coinMC = this[item.coin];
      item.baseMC = this[item.base];
      return (item.coinMC && item.coinMC.percent_change_1h > 2);
    }, this.MC);

   // console.log(gainers);

    /*this.collectOrdersData(gainers).then(res=>{


      let recommended:IMarketRecommended[] = res.map(function (market:IMarketRecommended) {
        let priceBase = market.baseMC.price_usd;
        if(market.baseMC.symbol ==='USDT') priceBase = 1;
        market.isActive='BUY';
        market.date= new Date().toLocaleTimeString();
        market.message = 'percent_change_1h > 2';
        market.reports = null;
     /!*   market.LastUS = +(market.Last * priceBase).toPrecision(5);
        market.AskUS = +(market.Ask * priceBase).toPrecision(5);
        market.BidUS = +(market.Bid * priceBase).toPrecision(5);
        market.LowUS = +(market.low * priceBase).toPrecision(5);
        market.HighUS = +(market.high * priceBase).toPrecision(5);
*!/

        return market;
      }, );

      this.recommendedSub.next(recommended);
     // console.log(res);
    })*/
  }


 /* collectOrdersData(gainers:IMarketRecommended[]):Promise<IMarketRecommended[]>{
    let api = this.publicAPI;

    return  new Promise<IMarketRecommended[]>((resolve, reject)=>{
      this.getNextMarket(api, gainers, -1, resolve, reject)
    });

  }
*/

  /*private getNextMarket(publicAPI:IApiPublic, markets:IMarketRecommended[], i, resolve, reject ){
    i++;
    if(i>= markets.length){
      resolve(markets);
      return;
    }


    let market = markets[i];
    let coinMC = market.coinMC;
    let baseMC = market.baseMC;
    let base = market.baseMC.symbol;
    let coin = market.coinMC.symbol;
    let exchange = market.exchange;
    let priceBaseUS = baseMC.price_usd;


    publicAPI.downloadTrades(base, coin).toPromise().then(reports=>{

      reports.reverse();
      let coindatas = UtilsOrder.analizeOrdersHistory2(reports, priceBaseUS);

      market.tradesStats =  {
        exchange:'',
        timestamp:Date.now(),
        time:new Date().toLocaleTimeString(),
        avgRate:0,
        avgRateUS:0,
        priceBaseUS:priceBaseUS,
        rateLast:coindatas.rateLast,
        rateLastUS:coindatas.priceLastUS,
        priceToMC: MATH.round(10000 * (coindatas.priceLastUS - coinMC.price_usd) / coinMC.price_usd) / 100,
        //bubbles: coindatas.bubbles,
        duratinMin: coindatas.duration / 60,
        speedPerMin: (coindatas.speed * 60),
        speed:coindatas.speed,
        amountBuy:0,
        amountSell:0,
        amountBuyUS: coindatas.sumBuyUS,
        amountSellUS: coindatas.sumSellUS,
        perHourBuy: coindatas.sumBuyUS / (coindatas.duration / 60 / 60),
        perHourSell: coindatas.sumSellUS / (coindatas.duration / 60 / 60),
        coin: coindatas.coin,
        base: coindatas.base,
        volUS:coindatas.sumBuyUS +  coindatas.sumSellUS,
        totalUS: coindatas.sumBuyUS - coindatas.sumSellUS

      };

      setTimeout(()=>this.getNextMarket(publicAPI, markets, i, resolve, reject), 5000)
    })
  }
*/

}
