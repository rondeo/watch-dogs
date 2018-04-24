import {Component, OnInit} from '@angular/core';
import {ApiMarketCapService} from "../../apis/api-market-cap.service";
import {ActivatedRoute} from "@angular/router";
import {VOMarketCap, VOWatchdog} from "../../models/app-models";
import {BotSellCoinService, VOProcessCoin} from "../services/bot-sell-coin.service";

@Component({
  selector: 'app-bot-sell-coin',
  templateUrl: './bot-sell-coin.component.html',
  styleUrls: ['./bot-sell-coin.component.css']
})
export class BotSellCoinComponent implements OnInit {

  sellCoins: VOProcessCoin[]

  constructor(
    private marketcap: ApiMarketCapService,
    private sellService: BotSellCoinService,
    private route: ActivatedRoute
  ) {
  }


  ngOnInit() {
    this.sellService.getCoinsToSell().then(coins=>{
      console.log(coins);
      if(coins.length){
        this.sellCoins = coins.map(function (dog: VOWatchdog) {
          return {
            coin:dog.coin,
            base:dog.base,
            exchange: dog.exchange,
            script:dog.script,
            action: dog.action
          }
        });
        this.checkMC();
      }
    })
    /*this.route.params.subscribe(params => {
      this.sellCoins = params.markets.split(',').map(function (item) {
        const ar = item.split('_');
        return {
          exchange: ar[0],
          base: ar[1],
          coin: ar[2],
          action:'SELL'
        }
      });
      this.checkMC();
    });*/
  }

  startCheckMC() {

  }


  async checkMC() {
    const MC = await  this.marketcap.downloadTicker().toPromise();
    console.log(this.sellCoins);

    this.sellCoins.forEach( (coin:VOProcessCoin) => {

      const coinMC:VOMarketCap = MC[coin.coin];

      if(coinMC){
        console.log(coinMC);
        const baseMC = MC[coin.base];
        const percent_change_1h = coinMC.percent_change_1h - baseMC.percent_change_1h;
        console.warn(percent_change_1h);
        if(percent_change_1h < 1.8) {
          coin.coinPrice = coinMC.price_usd;
          coin.basePrice = MC[coin.base].price_usd;

          this.sellService.sellCoin(coin);

        }
      }
    })

  }



}
