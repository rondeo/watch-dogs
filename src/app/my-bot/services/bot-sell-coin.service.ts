import { Injectable } from '@angular/core';
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {HttpClient} from "@angular/common/http";
import {VOMarket, VOMarketCap} from "../../models/app-models";


@Injectable()
export class BotSellCoinService {

  private MC:{[symbol:string]:VOMarketCap};
  private subMC;



  constructor(
    private http:HttpClient,
    private connector:ConnectorApiService,
    private marketCap:MarketCapService
  ) {


  }






  destroy(){

    this.subMC.unsubscribe();
  }

  startFollow(){
    this.subMC = this.marketCap.getCoinsObs().subscribe(MC=>{
      this.MC = MC;
      this.amalize();
    });


  }

  private amalize(){
    if(!this.MC) return;
    let MC = this.MC;
    let markets = this.markets;
    let recommended = [];

    markets.forEach(function (item) {
      let coinMC = MC[item.coin];
      let baseMC = MC[item.base];
      if(coinMC.percent_change_1h < -2){
        recommended.push({
          exchange:item.exchange,
          base:item.base,
          coin:item.coin,
          coinMC:coinMC,
          baseMC:baseMC
        })
      }
    });
  }



  collectData(recommended:any[]){



  }

  saveMarketOnServer(market:VOMarket){
    let url ='http://localhost:8080/mongodb';
    console.log(url);

    return this.http.post(url,{follow:market})

  }

  private _markets:any[];
  get markets(){
    if(!this._markets) this._markets = JSON.parse(localStorage.getItem('bot-sell-coin') || '[]');
    return this._markets;
  }


  addMarket(exchange:string, base:string, coin:string){
    let id = exchange + '_' + base + '_'+ coin;
    let exists = this.markets.find(function (item) {
      return item.exchange === exchange && item.base === base && item.coin === coin;
    });

    if(!exists) this.markets.push({
      exchange,
      base,
      coin
    });
    this.saveMarkets()
  }

  deleteMarket(exchange:string, base:string, coin:string){
    let ar = this.markets;
    for(let i= ar.length -1; i>=0;i--) {
      let m = ar[i];
      if(m.exchange === exchange && m.base === base && m.coin === coin) ar.splice(i,1);
    }
    this.saveMarkets();

  }

  saveMarkets(){
    localStorage.setItem('bot-sell-coin', JSON.stringify(this.markets))
  }

}
