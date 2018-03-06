import {Component, OnInit} from '@angular/core';
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {VOMarketCap} from "../../models/app-models";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {IOrdersStats} from "../../my-exchange/services/my-models";
import {MarketCollectorService} from "../../my-exchange/my-exchange-bot/bot/market-collector.service";

@Component({
  selector: 'app-bot-follow-coin',
  templateUrl: './bot-follow-coin.component.html',
  styleUrls: ['./bot-follow-coin.component.css']
})
export class BotFollowCoinComponent implements OnInit {

  //oredrsStats: IOrdersStats;

  coin = 'BTC';
  base = 'USDT';

  constructor(
    private allApis: ConnectorApiService,
    private marketCap: MarketCapService,

  ) {
  }

  ngOnInit() {

    let coin = 'BTC';
    let base = 'USDT';

    let api = this.allApis.getPrivateAPI('poloniex');

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

    })
  }


  analizeStats(stats: IOrdersStats, coinMC: VOMarketCap, baseMC: VOMarketCap) {



  }

}
