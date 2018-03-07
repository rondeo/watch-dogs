import { Injectable } from '@angular/core';
import {MarketHistoryData} from "./market-history-data";
import {ApiBase, IApiPublic} from "../../my-exchange/services/apis/api-base";
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {Observable} from "rxjs/Observable";
import {VOAnalytics, VOBubble, VOTradesStats} from "../../services/utils-order";

import {ApiPublicBittrex} from "../../my-exchange/services/apis/bittrex/api-public-bittrex";
import {HttpClient} from "@angular/common/http";
import {ApiPublicBitfinex} from "../../my-exchange/services/apis/bitfinex/api-public-bitfinex";

import {TradesData} from "./trades-data";
import {Subject} from "rxjs/Subject";
import {ApiPublicPoloniex} from "../../my-exchange/services/apis/poloniex/api-public-poloniex";
import {ApiPublicBinance} from "../../my-exchange/services/apis/binance/api-public-binance";
import {ApiPublicOkex} from "../../my-exchange/services/apis/okex/api-public-okex";
import {BotSellCoin} from "./bot-sell-coin";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";


@Injectable()
export class BotServiceService {



  private data:MarketHistoryData[] = [];
  private apisPublic:IApiPublic[];

  constructor(
    private apiService:ConnectorApiService,
    private http:HttpClient,
    private marketCap:MarketCapService

  ) {

  }

  botsSell:BotSellCoin[];
  botsSellSub:BehaviorSubject<BotSellCoin[]> = new BehaviorSubject<BotSellCoin[]>(null)


  addSellMarket(exchange:string, base:string, coin:string){
    //let bottSell = new BotSellCoin()

    this.marketCap.getCoinsObs().subscribe(MC=>{
      if(!MC) return;
      let baseMC = MC[base];
      let coinMC = MC[coin];
      let botSell:BotSellCoin = new BotSellCoin(baseMC, coinMC, this.marketCap);
      this.getBotsSell().push(botSell);
      this.botsSellSub.next(this.botsSell);
    });

  }

  getBotsSell(){
    if(!this.botsSell) this.botsSell = JSON.parse(localStorage.getItem('bot-sell-coin') || '[]');
    return  this.botsSell
  }



 createApis(){
   let apis:any[] = [];
   apis.push(new ApiPublicBittrex(this.http));
   apis.push(new ApiPublicBitfinex(this.http));
   apis.push(new ApiPublicPoloniex(this.http));
   apis.push(new  ApiPublicBinance(this.http));
   apis.push(new ApiPublicOkex(this.http));


   this.apisPublic = apis;
 }

 getTrades(base:string, coin:string, priceBaseUS:number):TradesData[]{
   if(!this.apisPublic)this.createApis();

 //  let sub: Subject<VOOrder[]> = new Subject();

   let tradesData:TradesData[] = this.apisPublic.map(function (item) {

     return new TradesData(item, base, coin, priceBaseUS, 180, 100);
   });


  /* tradesData.forEach(function (item) {

     console.log(item);

     item.trades$().subscribe(res=>{
       sub.next(res)
     })
     item.start();
   })
*/
   return tradesData;

 }

  subscribeForHistory(marketInit: { base: string; coin: string; exchange: string; market: string; priceBaseUS: number; rate: number }, currentAPI: ApiBase) {
    let id = marketInit.exchange + '_'+ marketInit.base + '_'+ marketInit.coin;
    let marketHistoryData = this.data.find(function (item) {
      return item.id === id;
    });

    if(!marketHistoryData){
      if(!currentAPI) currentAPI = this.apiService.getPrivateAPI(marketInit.exchange);

      marketHistoryData = new MarketHistoryData(marketInit.exchange , marketInit.base , marketInit.coin, marketInit.priceBaseUS, currentAPI)

      this.data.push(marketHistoryData)
    }

    return marketHistoryData.history$();
  }
}
