import { Component, OnInit } from '@angular/core';
import {FollowOrdersService} from '../../apis/open-orders/follow-orders.service';
import {MarketBot} from '../../app-services/app-bots-services/market-bot';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {CandlesService} from '../../app-services/candles/candles.service';
import {VOCandle} from '../../models/api-models';
import * as _ from 'lodash';
import {TestCandlesService} from '../../test/test-candles.service';

@Component({
  selector: 'app-follow-market',
  templateUrl: './follow-market.component.html',
  styleUrls: ['./follow-market.component.css']
})
export class FollowMarketComponent implements OnInit {
  bots: any[];
  candles: VOCandle[];
  volumes: number[];

  testbot: MarketBot;
  constructor(

    private apisPublic: ApisPublicService,
    private followOrder: FollowOrdersService,
    private marketCap: ApiMarketCapService,
    private candelsService: CandlesService,
    private testCandles: TestCandlesService
  ) { }



  onStartClick(){

    if(this.testCandles.interval)this.testCandles.stop();
    else this.testCandles.start();
  }



  ngOnInit() {

    this.testCandles.candlesSub.subscribe(candles=>{
      this.candles = candles;
      this.volumes = _.map(candles,'Volume');
      this.testbot.tick(candles);

    })
    this.followOrder.botsSub.subscribe(bots =>{
      if(!bots) return;
      this.testbot = _.find(bots, {market:'BTC_BLZ'});
      setTimeout(()=>this.testbot.stop(), 1000);

      this.bots = bots.map(function (item) {
        return {
          market: item.market,
          amountCoin: item.amountCoin
        }
      });
    });

    setTimeout(()=>{
     //  this.createBot('BTC_BLZ', 100);
    }, 2000)

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
        this.showMarket(market);
        break
    }
  }

  async  showMarket(market: string) {
   const candles =  await this.candelsService.getCandles('binance', market, '5m');
   this.volumes = _.map(candles,'Volume');
    this.candles = candles;
  }
}
