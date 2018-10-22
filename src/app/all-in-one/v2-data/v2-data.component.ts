import {Component, OnInit} from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';
import {VOMarket, VOMarketCap} from '../../models/app-models';
import {ApiMarketCapService} from "../../apis/api-market-cap.service";
import {ApisPublicService} from "../../apis/api-public/apis-public.service";
import {forkJoin} from "rxjs/observable/forkJoin";
import * as _ from 'lodash';
import {V2DataHelper} from "./v2-data-helper";
import {MatSnackBar} from "@angular/material";


interface IDisplayCoins {
  cryptopia: number;
  poloniex: number;
  hitbtc: number;
}


@Component({
  selector: 'app-v2-data',
  templateUrl: './v2-data.component.html',
  styleUrls: ['./v2-data.component.css']
})
export class V2DataComponent implements OnInit {

  bases = ['BTC', 'USDT', 'ETH'];
  exchanges = ['bittrex', 'poloniex', 'binance'];
  tableHeaders: string[];
  private MC: { [index: string]: VOMarketCap };

  tableDataset: any[][];

  marketsResults: { [market: string]: VOMarket }[];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private marketCap: ApiMarketCapService,
    private apisAll: ApisPublicService,
    private snackBar: MatSnackBar
  ) {
  }

  onRefreshDataClick(){
    this.downloadAllExchanges();
  }
  async downloadBooks(exchange: string, base: string, coin: string) {
    return this.apisAll.getExchangeApi(exchange).downloadBooks(base, coin).toPromise();
  }

  onCoinClick(i: number, j: number) {
    const row = this.tableDataset[i];
    let coin = row[0];
    const base = row[1];
    const price = Number(row[j]);
    if (!price) return;
    const exchange = this.exchanges[j-2];
    console.log(exchange, base, coin, price);
    this.compareBooks(exchange, base, coin, price);
  }


  async compareBooks(exchange, base: string, coin: string, price: number) {

    const books = await this.downloadBooks(exchange, base, coin);
   //  console.log(books);
    const baseMC = this.MC[base];
    const coinPriceMC = this.MC[coin].price_usd;

    const sell:number = V2DataHelper.filterBooks(books.sell, baseMC.price_usd, 1000);
    const buy:number = V2DataHelper.filterBooks(books.buy, baseMC.price_usd, 1000);
   // console.log(buy, sell);
    const sellDiff = (100*(sell - coinPriceMC)/coinPriceMC).toFixed(1);
    const buyDiff = (100*(buy - coinPriceMC)/coinPriceMC).toFixed(1);

    const msg = base + '-' +coin  + ' ' +exchange  + ' Buy: ' +buyDiff + ' Sell: ' + sellDiff;
    this.snackBar.open(msg, 'x');
  }

  downloadAllExchanges() {

    const MC = this.MC;

    const apis = [];

  /*  this.apisAll.downloadTickers(this.exchanges)
      .subscribe((res: { [market: string]: VOMarket }[]) => {
      this.marketsResults = res;
      // console.log(res);
      const bases = this.bases;
      const MC = this.MC;
      this.tableHeaders = ['coin', 'base'].concat(this.exchanges);
      this.tableDataset = V2DataHelper.parseData(this.MC, this.bases, res);
    })*/
  }


  ngOnInit() {
    this.marketCap.downloadTicker().subscribe(MC => {
      this.MC = MC;
      this.downloadAllExchanges();
    })
  }


  static filterAndIndex(markets: VOMarket[], base: string): { [coin: string]: VOMarket } {
    const filtered = _.filter(markets, {base: base});

    return _.keyBy(filtered, 'coin');
  }


  static filterToMC(MC: { [index: string]: VOMarketCap }, markets: VOMarket[], baseVolume) {
    return markets.filter(function (item) {
      let baseMC = MC[item.base];
      let coinMC = MC[item.coin];
      if (baseMC && coinMC && item.BaseVolume > baseVolume) {
        item.usLast = item.Last * baseMC.price_usd;
        item.toMC = Math.round(1000 * (item.usLast - coinMC.price_usd) / coinMC.price_usd) / 10;
        return true;
      }
      return false;


    })
  }

  static displayData(indexed, MC, baseCoin) {
    let mcAr = Object.values(MC);
    let baseBTC = MC[baseCoin];
    const out = [];
    // const  poloniex = indexed[0];

    console.log(indexed);
    const basePrice = baseBTC.price_usd;
   /* mcAr.forEach(function (item) {
      const coin = item.symbol;
      // if(poloniex[coin]){
      const price = item.price_usd;
      const row = [];
      indexed.forEach(function (exchangeValues) {
        let coinEx: VOMarket = exchangeValues[coin];
        if (coinEx) {
          row.push(coinEx.toMC)
        } else row.push('');

      })
      if (_.sum(row)) {
        row.unshift(coin);
        out.push(row)
      }
      // }

    });*/

    return out;
  }

}
