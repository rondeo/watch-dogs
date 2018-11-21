import { Component, OnInit } from '@angular/core';
import {FollowOrdersService} from '../../apis/open-orders/follow-orders.service';
import {MarketBot} from '../../app-services/app-bots-services/market-bot';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {CandlesService} from '../../app-services/candles/candles.service';
import {VOCandle} from '../../models/api-models';
import * as _ from 'lodash';
import {TestCandlesService} from '../../test/test-candles.service';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-follow-market',
  templateUrl: './follow-market.component.html',
  styleUrls: ['./follow-market.component.css']
})
export class FollowMarketComponent implements OnInit {
  bots: any[];

  market:string;

  testbot: MarketBot;
  constructor(

    private rote:ActivatedRoute,
    private router:Router,
    private apisPublic: ApisPublicService,
    private followOrder: FollowOrdersService,
    private marketCap: ApiMarketCapService,
    private candelsService: CandlesService,
    private testCandles: TestCandlesService
  ) { }



 async onCreateClick(){
    const MC = await this.marketCap.getTicker();
    const coniMC= MC[this.market.split('_')[1]];
    if(!coniMC) return;
    this.followOrder.createBot(this.market, Math.round(100/ coniMC.price_usd));

  }

  ngOnInit() {
    this.rote.params.subscribe(params=>{
      if(params.market) this.market = params.market;
    })
    this.followOrder.botsSub.subscribe(bots =>{
      if(!bots) return;

      this.bots = bots.map(function (item) {
        return {
          market: item.market,
          amountCoin: item.amountCoin,
          x:'X'
        }
      });
    });

  }


  async createBot(market: string, amountUS:number){
    const MC = await this.marketCap.getTicker();
    const amountCoin = +(amountUS / MC[market.split('_')[1]].price_usd).toFixed(2);
    await this.followOrder.createBot(market, amountCoin);
  }


  onMarketSelected(evt){
    const market: string = evt.item.market;
    switch (evt.prop) {
      case 'market':
        this.router.navigate(['/trader/follow-market', {market}]);
        break;
      case 'x':
        if(confirm('DELETE ' + market)){
          this.followOrder.deleteBot(market);
        }
        break
    }
  }


}
