import {Component, OnInit} from '@angular/core';
import {ApisPublicService} from '../../adal/apis/api-public/apis-public.service';
import {VOBooks, VOMarket, VOMarketCap} from '../../amodels/app-models';
import * as _ from 'lodash';
import {ApiMarketCapService} from '../../adal/apis/api-market-cap.service';
import {UtilsBooks} from '../../acom/utils-books';
import {MATH} from '../../acom/math';
import {MatSnackBar} from '@angular/material';

 interface MarketDisplay {
   market: string;
   values: number[];
   change: number;
   selected: boolean;
 }


@Component({
  selector: 'app-common-markets',
  templateUrl: './common-markets.component.html',
  styleUrls: ['./common-markets.component.css']
})
export class CommonMarketsComponent implements OnInit {

  constructor(
    private apiPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private snackBar: MatSnackBar
  ) {
  }

  id = 'CommonMarketsComponent';
  exchanges: { exchange: string, selected: boolean }[];
  private allMarkets: { [exchange: string]: { [symbol: string]: VOMarket }[] };

  // allMarketNames: string[][];
  selectedExchanges: string[];
  commonMarketNames: string[];

  dataset: MarketDisplay [];

  selected: MarketDisplay;

  ngOnInit() {
    this.initAsync();
  }

  async initAsync() {
    const allMarkets = await this.apiPublic.getAllMarkets();
    // console.log(subscribedMarkets);

    const indexed = {};
    allMarkets.forEach(function (item) {
      indexed[Object.values(item)[0].exchange] = item;
    });

    this.allMarkets = indexed;

    const selected: string[] = JSON.parse(localStorage.getItem(this.id) || '[]');

    this.exchanges = Object.keys(indexed).map(function (item) {
      return {
        exchange: item,
        selected: selected.indexOf(item) !== -1
      };
    });

    this.onExchnageChange(null);
    /*this.subscribedMarkets = subscribedMarkets;
    const marketsNames = subscribedMarkets.map(function (item) {
      return Object.keys(item);
    })*/


    // const onAll = _.intersection(...marketsNames);
    // console.log(onAll);

  }

  getValuesForMarket(market: string): number[] {
    const allMarkets = this.allMarkets;
    return this.selectedExchanges.map(function (exchange) {
      const value = allMarkets[exchange][market];
      return value ? value.Last : 0;
    });
  }

  showCommon(selected: string[]) {
    this.selectedExchanges = selected;
    const markets = selected.map((item) => {
      return this.allMarkets[item];
    });

    const marketsNames = markets.map(function (item) {
      return Object.keys(item);
    });

    this.commonMarketNames = _.intersection(...marketsNames);

    //  console.log(this.commonMarketNames);
    this.dataset = this.commonMarketNames.map((item) => {
      const values = this.getValuesForMarket(item);
      const sorted: number[] = values.sort(function (a, b) {
        return a - b;
      });
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      return {
        market: item,
        values: values,
        change: MATH.percent(last, first),
        selected: false
      };
    });


    /* const selectedExchanges = this.subscribedMarkets.filter(function (item) {
       return item
     })*/

    //  this.commonMarketNames
  }


 /* analiseDataset() {

    this.dataset.forEach(function (item) {


    })
  }
*/

  onExchnageChange(evt) {
    const selected = this.exchanges.filter(function (item) {
      return item.selected;
    }).map(function (item) {
      return item.exchange;
    });

    localStorage.setItem(this.id, JSON.stringify(selected));
    this.showCommon(selected);
  }


  analizeBooks(data: VOBooks[], amountCoin: number) {
    const booksResults = data.map(function (item) {
      return {
        exchange: item.exchange,
        market: item.market,
        buy: UtilsBooks.getRateForAmountCoin(item.buy, amountCoin),
        sell: UtilsBooks.getRateForAmountCoin(item.sell, amountCoin),
        amountCoin: amountCoin
      };
    });

    return booksResults;
  }

  showBooksAnalys(booksResults: {
    exchange: string,
    market: string,
    buy: number,
    sell: number,
    amountCoin: number
  }[] ) {

    let results = booksResults[0].market;
    let maxBuy = 0;
    let minSell = 100000;
    booksResults.forEach(function (item) {
      if (item.buy > maxBuy) maxBuy = item.buy;
      if (item.sell < minSell) minSell = item.sell;

      results += ' ' + item.exchange + ' ' + MATH.percent(item.sell, item.buy) + '%';
    });

    let color = '';
    if (maxBuy > minSell) {
      color = 'bd-red';
    }

    console.log(color);
    this.snackBar.open(results, 'x', {duration: 15000, panelClass: color});
    console.log(booksResults);
    console.log(maxBuy, minSell);

  }

  onSymbolClick(market: MarketDisplay) {

    this.selectMarket(market);
    const ar = market.market.split('_');

    const exchanges = this.selectedExchanges;
    const prs = exchanges.map((item) => {
      return this.apiPublic.getExchangeApi(item).downloadBooks(ar[0], ar[1]).toPromise();
    });

    Promise.all(prs).then(res => {
      // console.log(res);
     /* this.marketCap.getCoin(ar[1]).then(mc => {
        const price: number = mc.price_usd;
        const amountCoin = 1000 / price;
       const result =  this.analizeBooks(res, amountCoin);
       this.adjustValuesBybooks(result);
       this.showBooksAnalys(result);
        /!*const prs2 = exchanges.map((item) => {
          return this.apiPublic.getExchangeApi(item).downloadMarketHistory(ar[0], ar[1]).toPromise();

        });*!/

      });
*/
    });

      // console.log(market);
  }


  selectMarket(market: MarketDisplay) {
    if (this.selected) this.selected.selected = false;
    this.selected = market;
    market.selected = true;
  }
  onValueClick(i: number, j: number) {

    const market = this.dataset[i];
    this.selectMarket(market);

    const exchange = this.selectedExchanges[j];
    const ar = market.market.split('_');
    const url = this.apiPublic.getExchangeApi(exchange).getMarketUrl(ar[0], ar[1]);
    window.open(url, exchange);

  }


  adjustValuesBybooks(booksResults: {
    exchange: string,
    market: string,
    buy: number,
    sell: number,
    amountCoin: number
  }[]) {
    const market = this.selected;

    if (market.market !== booksResults[0].market)
      throw new Error(' ERROR markets not match ' + market.market  + ' ' + booksResults[0].market);

    const indexed = _.keyBy(booksResults, 'exchange');
    console.log(indexed);
    const values = [];
    this.selectedExchanges.forEach(function (item) {
      const books = indexed[item];
      const value = (books.buy + books.sell) / 2;
      values.push(value);

    });
    const oldValues = this.selected.values;
    console.log(oldValues, values);
    this.selected.values = values;


  }
}
