import {IApiPublic} from "../services/apis/api-base";
import {
  IMarketDataCollect, IMarketRecommended, UtilsOrder, VOMarketsStats,
  VOTradesStats
} from "../../src/app/com/utils-order";

import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {EventEmitter} from "@angular/core";

export class CollectMarketData {

  public exchange: string;
  Q: IMarketDataCollect[] = [];

  onDone:EventEmitter<string> = new EventEmitter();

  private marketDataSub: Subject<IMarketDataCollect> = new Subject();

  marketData$() {
    return this.marketDataSub.asObservable();
  }

  constructor(private publicAPI: IApiPublic) {
    this.exchange = publicAPI.exchange;
  }


  addMarkets(markets: IMarketDataCollect[]) {

    if (this.Q.length === 0){
      console.log(' np Q starting in 1 sec')
      setTimeout(() => this.getNextMarket(), 1000);
    }
    console.warn(' adding to Q ' + markets.length);
    this.Q = this.Q.concat(markets);

  }

  private getNextMarket() {

    if (this.Q.length !== 0) setTimeout(() => this.getNextMarket(), 10000);
    else{
      this.onDone.emit(this.publicAPI.exchange);
      console.log(' no more Q')
      return;
    }

    let recommended = <IMarketDataCollect>this.Q.shift();

    //let coinMC = recommended.coinMC;
    //let baseMC = recommended.baseMC;
    let base = recommended.base;
    let coin = recommended.coin;
    let exchange = recommended.exchange;
    let priceBaseUS = recommended.priceBaseUS;


    console.log(' collectong data for ' + coin + ' left ' + this.Q.length);
    this.publicAPI.downloadTrades(base, coin).toPromise().then(result => {

      result.reverse();
      let history = UtilsOrder.analizeOrdersHistory2(result, priceBaseUS);

      recommended.tradesStats = {

        exchange: exchange,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString(),
        coin:coin,
        base: base,
        priceBaseUS: priceBaseUS,
        rateLast: history.rateLast10,
        rateLastUS: history.priceLast10US,
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
        percentBuy: +(100*(history.sumBuyUS - history.sumSellUS)/history.sumSellUS).toFixed(2),
        volUS: history.sumBuyUS + history.sumSellUS
      };





      setTimeout(()=>{

        this.publicAPI.downloadMarket(base, coin).subscribe(market=>{
          let marketStats = market as VOMarketsStats;
          marketStats.LastUS = +(market.Last * priceBaseUS).toPrecision(5);
          marketStats.AskUS = +(market.Ask * priceBaseUS).toPrecision(5);
          marketStats.BidUS = +(market.Bid * priceBaseUS).toPrecision(5);
          marketStats.LowUS = +(market.low * priceBaseUS).toPrecision(5);
          marketStats.HighUS = +(market.High * priceBaseUS).toPrecision(5);

          recommended.marketStats = marketStats;

          console.log('ready data for ' + coin);
          this.marketDataSub.next(recommended);

        }, error2 => {
          console.error(error2);
          this.marketDataSub.next(recommended);
        })
      }, 5000)



    })
  }


}
