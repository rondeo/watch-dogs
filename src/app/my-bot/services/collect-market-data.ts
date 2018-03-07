import {IApiPublic} from "../../my-exchange/services/apis/api-base";
import {IMarketRecommended, UtilsOrder, VOMarketsStats, VOTradesStats} from "../../services/utils-order";

import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

export class CollectMarketData {

  public exchange: string;
  Q: IMarketRecommended[] = [];

  private marketDataSub: Subject<IMarketRecommended> = new Subject();

  marketData$() {
    return this.marketDataSub.asObservable();
  }

  constructor(private publicAPI: IApiPublic) {
    this.exchange = publicAPI.exchange;
  }


  addMarkets(recommended: IMarketRecommended[]) {

    if (this.Q.length === 0) setTimeout(() => this.getNextMarket(), 1000);
    this.Q = this.Q.concat(recommended);

  }

  private getNextMarket() {

    let recommended = <IMarketRecommended>this.Q.shift();

    if (this.Q.length !== 0) setTimeout(() => this.getNextMarket(), 10000);

    let coinMC = recommended.coinMC;
    let baseMC = recommended.baseMC;
    let base = recommended.baseMC.symbol;
    let coin = recommended.coinMC.symbol;
    let exchange = recommended.exchange;
    let priceBaseUS = baseMC.price_usd;


    this.publicAPI.downloadTrades(base, coin).toPromise().then(result => {

      result.reverse();
      let history = UtilsOrder.analizeOrdersHistory2(result, priceBaseUS);


      recommended.tradesStats = {

        exchange: exchange,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString(),
        coin: coinMC.symbol,
        base: baseMC.symbol,
        priceBaseUS: priceBaseUS,
        rateLast: history.rateLast10,
        rateLastUS: history.priceLast10US,
        priceToMC: Math.round(10000 * (history.priceLast10US - coinMC.price_usd) / coinMC.price_usd) / 100,
        //bubbles: history.bubbles,
        duratinMin: history.duration / 60,
        speedPerMin: (history.speed * 60),
        speed: history.speed,
        amountBuy: 0,
        amountSell: 0,
        amountBuyUS: history.sumBuyUS,
        amountSellUS: history.sumSellUS,
        perHourBuy: history.sumBuyUS / (history.duration / 60 / 60),
        perHourSell: history.sumSellUS / (history.duration / 60 / 60),
        totalUS: history.sumBuyUS - history.sumSellUS,
        buyToSellPercent: +(100*(history.sumBuyUS - history.sumSellUS)/history.sumSellUS).toFixed(2),
        volUS: history.sumBuyUS + history.sumSellUS
      };


      let priceBase = recommended.baseMC.price_usd;
      if (recommended.baseMC.symbol === 'USDT') priceBase = 1;

      setTimeout(()=>{
        this.publicAPI.downloadMarket(base, coin).subscribe(market=>{
          let marketStats = market as VOMarketsStats;
          marketStats.LastUS = +(market.Last * priceBase).toPrecision(5);
          marketStats.AskUS = +(market.Ask * priceBase).toPrecision(5);
          marketStats.BidUS = +(market.Bid * priceBase).toPrecision(5);
          marketStats.LowUS = +(market.Low * priceBase).toPrecision(5);
          marketStats.HighUS = +(market.High * priceBase).toPrecision(5);

          recommended.marketStats = marketStats;

          this.marketDataSub.next(recommended);

        }, error2 => {
          console.error(error2);
          this.marketDataSub.next(recommended);
        })
      }, 5000)



    })
  }


}
