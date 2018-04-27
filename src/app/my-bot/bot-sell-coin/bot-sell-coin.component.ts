import {Component, OnInit} from '@angular/core';
import {ApiMarketCapService} from "../../apis/api-market-cap.service";
import {ActivatedRoute} from "@angular/router";
import {VOMarketCap, VOMarketCapExt, VOWatchdog} from "../../models/app-models";
import {BotSellCoinService, VOSellCoin} from "../services/bot-sell-coin.service";
import {RunScript} from "../../com/run-script";
import {StorageService} from "../../services/app-storage.service";
import * as moment from 'moment';
import * as _ from 'lodash';


@Component({
  selector: 'app-bot-sell-coin',
  templateUrl: './bot-sell-coin.component.html',
  styleUrls: ['./bot-sell-coin.component.css']
})
export class BotSellCoinComponent implements OnInit {

 // sellCoins: VOSellCoin[]

  constructor(
    private marketcap: ApiMarketCapService,
    private sellService: BotSellCoinService,
    private route: ActivatedRoute,
    private storage:StorageService
  ) {
  }


  ngOnInit() {

    this.sellService.soldCoin$().subscribe(sellCoin =>{
      //this.storage
      console.log(' SOLD coin ', sellCoin);

      //this.storage.setSoldCoin(sellCoin);
    })
    this.initAsync();;
    this.startCheckMC();
  }


  async initAsync(){

    const allSellCoins:VOSellCoin[] = await this.storage.getWatchDogs();

   // console.log(allSellCoins);
    const toSell = _.filter(allSellCoins, {status:'SELL'})
   // console.log(' to sell ', toSell);

   const results = await this.checkMC(toSell);
   console.log(results);

  }

  interval
  startCheckMC() {
    this.interval = setInterval(()=>this.initAsync(), 3* 60000);

  }


  async checkMC(sellCoins) {
    const MC = await  this.marketcap.downloadTicker().toPromise();
    //console.log(this.sellCoins);

    const result = [];

    sellCoins.forEach( (coin:VOSellCoin) => {

      const coinMC:VOMarketCapExt = <VOMarketCapExt>MC[coin.coin];
      if(coinMC){
       // console.log(coinMC);

        const baseMC = MC[coin.base];

        console.log(coin.script)
        console.log(baseMC.symbol +' ' + baseMC.percent_change_1h);
        console.log(coinMC.symbol +' ' +coinMC.percent_change_1h);

        const percent_change_1h = coinMC.percent_change_1h - baseMC.percent_change_1h;

        coinMC.percent_change_1h = percent_change_1h;

        coinMC.tobase_change_1h = percent_change_1h;
       // coinMC.percent_change_1h = -3;

        console.log( 'TO base ' +coinMC.percent_change_1h);

        const sellResult =  RunScript.runScriptSell(coinMC, coin.script);

        if(sellResult.length){
          const msg = moment().format() + ' ' +coin.script + '  sellResults: '+ sellResult.toString()
            + ' MC coin price '+ coinMC.price_usd + ' MC base price: ' + baseMC.price_usd
          + '  \n ' + JSON.stringify(coinMC) + ' \n ' + JSON.stringify(baseMC);
          console.log(msg);
          result.push(sellResult);
          coin.results = [msg];
          coin.coinPrice = coinMC.price_usd;
          coin.basePrice = MC[coin.base].price_usd;

          this.storage.upsert('SELL-'+coin.exchange + '-'+ coin.base + '-'+ coin.coin, coin);
          this.sellService.sellCoin(coin);
        }
      }
    })
    return result;

  }



}
