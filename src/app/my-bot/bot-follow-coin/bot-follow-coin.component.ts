import {Component, OnInit} from '@angular/core';
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {VOMarketCap} from "../../models/app-models";
import {MarketCapService} from "../../market-cap/market-cap.service";

import {MarketCollectorService} from "../../my-exchange/my-exchange-bot/bot/market-collector.service";
import {IMarketRecommended} from "../../services/utils-order";
import {CollectMarketDataService} from "../services/collect-market-data.service";

@Component({
  selector: 'app-bot-follow-coin',
  templateUrl: './bot-follow-coin.component.html',
  styleUrls: ['./bot-follow-coin.component.css']
})
export class BotFollowCoinComponent implements OnInit {

  //oredrsStats: IOrdersStats;


  /* exchange:string;
  action:string;
  result:string;
  date:string;
  reason:string;*/

  marketsFollow:IMarketRecommended[] =[
    {
      exchange:'poloniex',
      action:'SELL',
      base:'USDT',
      coin:'BTC',
      date:new Date().toISOString(),
      reason:'',
      result:null
    },
    {
      exchange:'poloniex',
      action:'SELL',
      base:'USDT',
      coin:'LTC',
      date:new Date().toISOString(),
      reason:'',
      result:null
    },
    {
      exchange:'poloniex',
      action:'BUY',
      base:'USDT',
      coin:'ETH',
      date:new Date().toISOString(),
      reason:'',
      result:null
    }
  ];


  constructor(
    private allApis: ConnectorApiService,
    private marketCap: MarketCapService,
    private collectMarketDataService:CollectMarketDataService

  ) {
  }


  ngOnInit() {

    this.collectMarketDataService.marketData$().subscribe((marketStats:IMarketRecommended)=>{

      console.log(marketStats);


    });

   let sub =  this.marketCap.getCoinsObs().subscribe(MC => {
      if(!MC) return;
     this.marketsFollow.forEach(function (item) {
       item.coinMC = MC[item.coin];
       item.baseMC = MC[item.base];
     });




     this.collectMarketDataService.collectMarketData('poloniex', this.marketsFollow);

     setTimeout(()=>sub.unsubscribe(), 100);
    })



   /* let api = this.allApis.getPrivateAPI('poloniex');

    this.marketCap.getCoinsObs().subscribe(MC => {
      if(!MC) return;

      let baseMC = MC[base];
      let coinMC = MC[coin];

      console.log(coinMC.percent_change_1h);
      if (coinMC.percent_change_1h < 0) {

        MarketCollectorService.getOrdersStats(api, coinMC, baseMC).then(stats => {

          api.mongoInsert(stats).subscribe(res=>{
            console.log(res);
          })
          this.analizeStats(stats, coinMC, baseMC);
        })
      }

    })*/
  }


  analizeStats(stats: any, coinMC: VOMarketCap, baseMC: VOMarketCap) {



  }

}
