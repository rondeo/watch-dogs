import { Injectable } from '@angular/core';
import {IApiPublic} from "../../my-exchange/services/apis/api-base";
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {CollectMarketData} from "./collect-market-data";

import {Subject} from "rxjs/Subject";
import {IMarketRecommended} from "../../services/utils-order";
import {MarketCapService} from "../../market-cap/market-cap.service";

@Injectable()
export class CollectMarketDataService {

  constructor(
    private connector:ConnectorApiService,
    private marketCap:MarketCapService
  ) {

  }



  marketData$(){
    return this.marketDataSub.asObservable();
  }

  private marketDataSub: Subject<IMarketRecommended> = new Subject();
  collectors:CollectMarketData[] = [];

  getCollector(exchange:string):CollectMarketData{
    let exists = this.collectors.find(function (item) {
      return item.exchange === exchange;
    })

    if(!exists){
      exists = new CollectMarketData(this.connector.getPublicApi(exchange));
      this.collectors.push(exists);
    }
    return exists;
  }

  collectMarketData(exchange:string, markets:IMarketRecommended[]){

   let collector:CollectMarketData = this.getCollector(exchange);
   collector.marketData$().subscribe(res=>{
     this.marketDataSub.next(res);
   });

    collector.addMarkets(markets);

  }

  private subMC
  subdcribeForMC(){
    this.subMC = this.marketCap.getCoinsObs().subscribe(MC =>{
      this.collectors.forEach(function (item:CollectMarketData) {

      })
    })
  }



}
