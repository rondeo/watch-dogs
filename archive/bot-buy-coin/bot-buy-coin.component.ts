import {Component, OnDestroy, OnInit} from '@angular/core';

import {ActivatedRoute} from "@angular/router";
import {ConnectorApiService} from "../../src/app/my-exchange/services/connector-api.service";
import {ApiBase, IApiPublic} from "../../src/app/my-exchange/services/apis/api-base";


import {UtilsOrder} from "../../src/app/com/utils-order";

import {VOMarket} from "../../src/app/models/app-models";
import {ApisPublicService} from "../../src/app/apis/api-public/apis-public.service";
import {ApiMarketCapService} from "../../src/app/apis/api-market-cap.service";
import {ApiPublicAbstract} from "../../src/app/apis/api-public/api-public-abstract";
import {Result1, UtilsBot} from "../../src/app/com/utils-bot";
import * as moment from "moment";

@Component({
  selector: 'app-bot-buy-coin',
  templateUrl: './bot-buy-coin.component.html',
  styleUrls: ['./bot-buy-coin.component.css']
})
export class BotBuyCoinComponent implements OnInit, OnDestroy {


  display: Result1[];

  result:{[symbol:string]:VOMarket[]};


  exchange:string;
  publicAPI:IApiPublic;
  exchangeMarkets:VOMarket[];
  exchangeApi:ApiPublicAbstract;
  constructor(
    private route:ActivatedRoute,
    private marketCap:ApiMarketCapService,
    private apis:ApisPublicService
   // private buyCoinService:BotBuyCoinService
  ) { }

  private sub1;
  private sub2;

  ngOnInit() {
    this.sub1 = this.route.params.subscribe(params=>{
      this.exchange = params.exchange;
      this.exchangeApi = this.apis.getExchangeApi(this.exchange);
      this.download2Records();
    });

  }


  async download2Records(){
  /*  const now = moment().format()
    const MC = await this.marketCap.download2Recors(moment().subtract(3,'h').format(), moment().format()).toPromise();
    console.log(MC['stamps']);
    const exchangeCoins =  await this.exchangeApi.getAllCoins();


    UtilsBot.filterMCandExchange(MC, exchangeCoins);
    this.result = MC;

    // console.log(MC);
    const result = UtilsBot.mapResult(MC);

    const ar = Object.values(result);
    //console.log(ar);

    const gainers = ar.filter(function (item:Result1) {
      return item.price_to_btcD > 0. && item.rankD >0;
    })

    console.log(gainers);
    this.display = gainers.length?gainers: ar;*/

  }

/*
  async loadMarketCap(){
    const MC = await  this.marketCap.downloadHistoryForLast3Hours().toPromise();

    const exchangeCoins =  await this.exchangeApi.getAllCoins();
    UtilsBot.filterMCandExchange(MC, exchangeCoins);
   // console.log(MC);
    const percent_ih = UtilsBot.mapResult(MC);
    console.log(percent_ih)

  }
*/


  ngOnDestroy(){
    this.sub1.unsubscribe();

  }




}
