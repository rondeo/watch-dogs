import {Component, OnInit} from '@angular/core';
import {V2Service} from '../v2.service';
import {V2BaseSercice} from '../v2-base';
import {ActivatedRoute, Router} from '@angular/router';
import {VOMarket, VOMarketCap} from '../../models/app-models';
import {ApiMarketCapService} from "../../apis/api-market-cap.service";
import {ApiAllPublicService} from "../../apis/api-all-public.service";
import {forkJoin} from "rxjs/observable/forkJoin";
import * as _ from 'lodash';


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

  baseCoin = 'BTC';

  bases = ['BTC', 'USDT', 'ETH'];


  tableHeaders: string[] = ['bittrex', 'poloniex', 'binance', 'hitbtc'];
  private MC: { [index: string]: VOMarketCap };

  tableDataset: any[][];

  marketsResults: { [market: string]: VOMarket }[];


  constructor(
    private service: V2Service,
    private route: ActivatedRoute,
    private router: Router,
    private marketCap: ApiMarketCapService,
    private apisAll: ApiAllPublicService
  ) {
  }

  async downloadBooks(exchange, coin: string) {
    const base = this.baseCoin;
    return this.apisAll.getExchangeApi(exchange).downloadBooks(base, coin).toPromise();
  }

  onCoinClick(i: number, j: number) {
    let coin = this.tableDataset[i][0]
    const price = this.tableDataset[j];
    const exchange = this.tableHeaders[j];

    const market = this.marketsResults[j - 1][coin];
    console.log(market);


    this.compareBooks(exchange, coin, price);

    console.log(coin, exchange);
  }


  async compareBooks(exchange, coin, price) {
    const books = await this.downloadBooks(exchange, coin);
    console.log(books);

  }

  downloadAllExchanges() {

    const baseCoin = this.baseCoin;
    const MC = this.MC;
    const all = this.tableHeaders;
   // console.log(all);
    const apis = [];
    const baseVolume = 10000 / MC[baseCoin].price_usd;

    all.forEach((exchange) => {
      apis.push(this.apisAll.downloadTicker(exchange));
    })

    forkJoin(apis).subscribe((res: { [market: string]: VOMarket }[]) => {
      this.marketsResults = res;
      console.log(res);
      const bases = this.bases;
      const MC = this.MC;
      var arMC = Object.values(MC).filter(function (item: VOMarketCap) { return item.rank < 200 });
      const out = [];
      const table = [];
      const basePrices = {};
     /* bases.forEach(function (base) {
        basePrices[base] = MC[base].price_usd;
      });
      basePrices['USDT'] = 1;*/

      arMC.forEach(function (coinMC: VOMarketCap) {

        const coin = coinMC.symbol;
        const coinPriceMC = coinMC.price_usd;

        bases.forEach(function (base) {
          const row: any[] = [coin, base];
          const baseMC = MC[base];
          const basePrice = base === 'USDT'?1:baseMC.price_usd;
          const market = base + '_' + coin;

          res.forEach(function (markets, i) {
            if (markets[market]) {
              const rate = markets[market].Last;
              const coinPrice = rate * baseMC.price_usd;


              row[i+2] = Math.round(1000 * (coinPrice - coinPriceMC)/coinPriceMC)/10
            }
          });

          if (row.length >2 ) table.push(row);
        });

      })

      this.tableHeaders.unshift('coin', 'base');
      this.tableDataset = table;

    })


  }


  ngOnInit() {
    this.marketCap.downloadAllCoins().subscribe(MC => {
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
    mcAr.forEach(function (item) {
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

    });

    return out;
  }

}
