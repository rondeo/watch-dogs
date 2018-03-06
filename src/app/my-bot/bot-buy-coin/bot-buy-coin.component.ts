import {Component, OnDestroy, OnInit} from '@angular/core';
import {MarketCapService} from "../../market-cap/market-cap.service";
import {ActivatedRoute} from "@angular/router";
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {ApiBase, IApiPublic} from "../../my-exchange/services/apis/api-base";
import {IVOMarket, IVOMarketMC, VOMarket, VOMarketCap} from "../../models/app-models";
import {IOrdersStats} from "../../my-exchange/services/my-models";
import {UtilsOrder} from "../../my-exchange/utils-order";
import {BuyCoinService} from "../services/buy-coin.service";

@Component({
  selector: 'app-bot-buy-coin',
  templateUrl: './bot-buy-coin.component.html',
  styleUrls: ['./bot-buy-coin.component.css']
})
export class BotBuyCoinComponent implements OnInit, OnDestroy {

  exchange:string;
  publicAPI:IApiPublic;
  exchangeMarkets:IVOMarket[];


  constructor(
    private route:ActivatedRoute,
    private marketCap:MarketCapService,
    private connector:ConnectorApiService,
    private buyCoinService:BuyCoinService
  ) { }

  private sub1;
  private sub2;
  ngOnInit() {
    this.sub1 = this.route.params.subscribe(params=>{
      this.exchange = params.exchange;
      let api  = this.connector.getPublicApi(this.exchange);
      this.buyCoinService.getRecommended(api).subscribe(recommended=>{

        this.buyCoinService.saveMarkets(recommended).then(res=>{
          console.log(res);
        })

      })

    });
  }



  ngOnDestroy(){
    this.sub1.unsubscribe();

  }




}
