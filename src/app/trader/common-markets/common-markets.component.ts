import {Component, OnInit} from '@angular/core';
import {ApisPublicService} from '../../apis/apis-public.service';
import {VOBooks, VOMarket, VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {UtilsBooks} from '../../com/utils-books';
import {MATH} from '../../com/math';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-common-markets',
  templateUrl: './common-markets.component.html',
  styleUrls: ['./common-markets.component.css']
})
export class CommonMarketsComponent implements OnInit {

  id = 'CommonMarketsComponent'
  exchanges: { exchange: string, selected: boolean }[];
  private allMarkets: { [exchange: string]: { [symbol: string]: VOMarket }[] }

  // allMarketNames: string[][];
  selectedExchanges: string[];
  commonMarketNames: string[];

  dataset: {
    market: string;
    values: number[];
    change: number;
  }[];

  constructor(
    private apiPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit() {
    this.initAsync();
  }

  async initAsync() {
    const allMarkets = await this.apiPublic.getAllMarkets();
    // console.log(allMarkets);

    const indexed = {};
    allMarkets.forEach(function (item) {
      indexed[Object.values(item)[0].exchange] = item;
    })

    this.allMarkets = indexed;

    const selected: string[] = JSON.parse(localStorage.getItem(this.id) || '[]');

    this.exchanges = Object.keys(indexed).map(function (item) {
      return {
        exchange: item,
        selected: selected.indexOf(item) !== -1
      }
    })

    this.onExchnageChange(null);
    /*this.allMarkets = allMarkets;
    const marketsNames = allMarkets.map(function (item) {
      return Object.keys(item);
    })*/


    // const onAll = _.intersection(...marketsNames);
    // console.log(onAll);

  }

  getValuesForMarket(market: string): number[] {
    const allMarkets = this.allMarkets;
    return this.selectedExchanges.map(function (exchange) {
      const value = allMarkets[exchange][market];
      return value ? value.Last : 0
    })
  }

  showCommon(selected: string[]) {
    this.selectedExchanges = selected;
    const markets = selected.map((item) => {
      return this.allMarkets[item];
    });

    const marketsNames = markets.map(function (item) {
      return Object.keys(item);
    })

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
        change: MATH.percent(last, first)
      }
    })


    /* const selectedExchanges = this.allMarkets.filter(function (item) {
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
      }
    })


    let results = booksResults[0].market;
    let maxBuy = 0;
    let minSell = 100000;
    booksResults.forEach(function (item) {
      if(item.buy > maxBuy) maxBuy = item.buy;
      if(item.sell < minSell) minSell = item.sell;

      results += ' ' +item.exchange +' ' + MATH.percent(item.sell, item.buy) + '%';
    })

    let color = '';
    if(maxBuy > minSell) {
      color ='alert';
    }

    console.log(color);
    this.snackBar.open(results, 'x', {duration: 15000, extraClasses:color});
    console.log(booksResults);
    console.log(maxBuy, minSell);

  }

  onSymbolClick(market: {
    market: string,
    values: number[],
    change: number
  }) {

    const ar = market.market.split('_');

    const exchanges = this.selectedExchanges;
    const prs = exchanges.map((item) => {
      return this.apiPublic.getExchangeApi(item).downloadBooks(ar[0], ar[1]).toPromise();
    });

    Promise.all(prs).then(res => {
      // console.log(res);
      this.marketCap.getCoin(ar[1]).then(mc =>{
        const price: number = mc.price_usd;
        const amountCoin = 1000 / price;
        this.analizeBooks(res, amountCoin);
        const prs2 = exchanges.map((item) => {
          return this.apiPublic.getExchangeApi(item).downloadMarketHistory(ar[0], ar[1]).toPromise();

        });

      })

    })

    console.log(market);
  }
}
