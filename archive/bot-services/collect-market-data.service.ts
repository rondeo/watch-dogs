import {EventEmitter, Injectable} from '@angular/core';
import {IApiPublic} from "../../src/app/my-exchange/services/apis/api-base";
import {ConnectorApiService} from "../../src/app/my-exchange/services/connector-api.service";
import {CollectMarketData} from "./collect-market-data";

import {Subject} from "rxjs/Subject";
import {IMarketDataCollect, IMarketRecommended} from "../../src/app/com/utils-order";
import {MarketCapService} from "../../src/app/market-cap/services/market-cap.service";

@Injectable()
export class CollectMarketDataService {

  onDone:EventEmitter<string> = new EventEmitter();

  constructor(
    private connector:ConnectorApiService
  ) {

  }



  downloadBooks(exchange, markets:IMarketRecommended[] ){

  }


  marketData$(){
    return this.marketDataSub.asObservable();
  }

  private marketDataSub: Subject<IMarketDataCollect> = new Subject();
  collectors:CollectMarketData[] = [];

  getCollector(exchange:string):CollectMarketData{
    let exists = this.collectors.find(function (item) {
      return item.exchange === exchange;
    })

    if(!exists){
      exists = new CollectMarketData(this.connector.getPublicApi(exchange));
      this.collectors.push(exists);

        exists.marketData$().subscribe(res=>{
        this.marketDataSub.next(res);

      });
        exists.onDone.subscribe(exchange=>this.onDone.emit(exchange));
    }
    return exists;
  }

  collectMarketData(exchange:string, markets:IMarketDataCollect[]){
    if(markets.length ===0) return;
   let collector:CollectMarketData = this.getCollector(exchange);
    collector.addMarkets(markets);
  }


}
