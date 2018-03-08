import {Component, OnDestroy, OnInit} from '@angular/core';
import {MarketCapService} from "../../market-cap/market-cap.service";
import {ActivatedRoute} from "@angular/router";
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {ApiBase, IApiPublic} from "../../my-exchange/services/apis/api-base";


import {UtilsOrder} from "../../services/utils-order";

import {VOMarket} from "../../models/app-models";
import {BotBuyCoinService} from "../services/bot-buy-coin.service";

@Component({
  selector: 'app-bot-buy-coin',
  templateUrl: './bot-buy-coin.component.html',
  styleUrls: ['./bot-buy-coin.component.css']
})
export class BotBuyCoinComponent implements OnInit, OnDestroy {

  exchange:string;
  publicAPI:IApiPublic;
  exchangeMarkets:VOMarket[];


  constructor(
    private route:ActivatedRoute,
    private marketCap:MarketCapService,
    private connector:ConnectorApiService,
    private buyCoinService:BotBuyCoinService
  ) { }

  private sub1;
  private sub2;
  ngOnInit() {
    this.sub1 = this.route.params.subscribe(params=>{
      this.exchange = params.exchange;
      let api  = this.connector.getPublicApi(this.exchange);
      this.buyCoinService.getRecommended(api).subscribe(recommended=>{

        /*this.buyCoinService.saveMarkets(recommended).then(res=>{
          console.log(res);
        })
*/
      })

    });
  }



  ngOnDestroy(){
    this.sub1.unsubscribe();

  }




}
