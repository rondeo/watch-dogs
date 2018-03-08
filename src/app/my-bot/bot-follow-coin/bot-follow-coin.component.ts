import {Component, OnInit} from '@angular/core';
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {VOMarketCap} from "../../models/app-models";
import {MarketCapService} from "../../market-cap/market-cap.service";

import {MarketCollectorService} from "../../my-exchange/my-exchange-bot/bot/market-collector.service";
import {IMarketRecommended} from "../../services/utils-order";
import {CollectMarketDataService} from "../services/collect-market-data.service";
import {DatabaseService} from "../../services/database.service";

@Component({
  selector: 'app-bot-follow-coin',
  templateUrl: './bot-follow-coin.component.html',
  styleUrls: ['./bot-follow-coin.component.css']
})
export class BotFollowCoinComponent implements OnInit {

  exchange: string = 'poloniex';

  toSellCoins: IMarketRecommended[] = [
    {
      exchange: 'poloniex',
      action: 'SELL',
      base: 'USDT',
      coin: 'BTC',
      reason: '',
      result: null
    },
    {
      exchange: 'poloniex',
      action: 'SELL',
      base: 'USDT',
      coin: 'LTC',
      reason: '',
      result: null
    },
    {
      exchange: 'poloniex',
      action: 'BUY',
      base: 'USDT',
      coin: 'ETH',
      reason: '',
      result: null
    }
  ];


  private MC:{[symbol:string]:VOMarketCap};

  constructor(private allApis: ConnectorApiService,
              private marketCap: MarketCapService,
              private collectMarketDataService: CollectMarketDataService,
              private database: DatabaseService) {
  }


  analizeCoin(recommended: IMarketRecommended) {


    recommended.percent_1h_ToBase = recommended.coinMC.percent_change_1h - recommended.baseMC.percent_change_1h;

    recommended.percentBuy = recommended.tradesStats.percentBuy;
    recommended.timestamp = Date.now();
    recommended.date = new Date().toLocaleTimeString(),

      recommended.persent_1h = recommended.coinMC.percent_change_1h;
    recommended.price_US = recommended.coinMC.price_usd;
    recommended.price_B = recommended.coinMC.price_btc;
    recommended.last_US = recommended.marketStats.LastUS;

      console.log(recommended);

    this.database.saveMarket(recommended).then(res => {
      console.log(res);
    })

  }


  ngOnInit() {

    this.collectMarketDataService.marketData$().subscribe((marketStats: IMarketRecommended) => {
      this.analizeCoin(marketStats)
    });


    let sub = this.marketCap.getCoinsObs().subscribe(MC => {
      if (!MC) return;


      let toSellCoins = this.toSellCoins.map(function (item) {
        return {
          exchange: item.exchange,
          action: item.action,
          base: item.base,
          coin: item.coin,
          coinMC: MC[item.coin],
          baseMC: MC[item.base],
          reason: '',
          result: null
        }
      });

      console.log(toSellCoins);

      let losers = toSellCoins.filter(function (item) {
        if (item.action === 'SELL' && item.coinMC.percent_change_1h < -2) return item;
        // else if(item.action ==='BUY' && item.coinMC.percent_change_1h > 2) return item;
      });

      console.log('loosers ' + losers.length);
      this.collectMarketDataService.collectMarketData(this.exchange, losers);

      this.analizeGainers(MC)

    })


  }

  setMC(MC){
    let prevMC = Object.values(this.MC);
    prevMC.forEach(function (item:VOMarketCap) {
      let current:VOMarketCap = MC[item.symbol];

      //if(current.rank > item.rank)

    })

    this.MC = MC;
  }

  analizeGainers(MC: { [symbol: string]: VOMarketCap }) {

    let api = this.allApis.getPublicApi(this.exchange);

    api.getCurrency().then(currency => {


      let exchange = this.exchange
      let MCAr: VOMarketCap[] = Object.values(MC);


      let gainers = MCAr.filter(function (item) {
        return item.percent_change_1h > 2;
      });

      console.log(' gainers ' + gainers.length);

      let available = gainers.filter(function (item) {
        return currency.indexOf(item.symbol) !== -1;
      });

      console.log(' available gainers ' + available.length);

      let recommended = available.map(function (item) {

        let base = item.symbol === 'BTC' ? 'USDT' : 'BTC';

        return {
          coin: item.symbol,
          base: base,
          exchange: '',
          action: 'TOBUY',
          timestamp: Date.now(),
          date: new Date().toLocaleTimeString(),
          result: null,
          reason: 'percent_change_1h > 2',
          coinMC: MC[item.symbol],
          baseMC: MC[base]
        }
      });

      console.log('recommended  to BUY ' + recommended.length);

      this.collectMarketDataService.collectMarketData(this.exchange, recommended);

    })


  }

}
