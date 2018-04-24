import {Component, OnInit} from '@angular/core';
import {ApiMarketCapService} from "../../apis/api-market-cap.service";
import {ActivatedRoute} from "@angular/router";
import {VOGraphs} from "../../shared/line-chart/line-chart.component";
import * as moment from "moment";
import * as _ from 'lodash';
import {VOMarketCap} from "../../models/app-models";
import {ApisPublicService} from "../../apis/apis-public.service";
import {ApiPublicAbstract} from "../../apis/api-public/api-public-abstract";
import {ApisBooksService} from "../../apis/apis-books.service";
import {UtilsBooks} from "../../com/utils-books";

@Component({
  selector: 'app-coin-graph',
  templateUrl: './coin-graph.component.html',
  styleUrls: ['./coin-graph.component.css']
})
export class CoinGraphComponent implements OnInit {

  myGraps: VOGraphs;
  coinMC: VOMarketCap;

  coin: string;
  from: string;
  to: string;

  constructor(private route: ActivatedRoute,
              private marketcap: ApiMarketCapService,
              private allPublic: ApisPublicService
              // private booksService: ApisBooksService
  ) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const coin = params.coin;
      if (!coin) return;
      this.coin = coin;
      this.marketcap.getCoin(coin).then(res => this.coinMC = res);
      const to = moment().format();
      this.getCoinHistory(to);
    })
  }

  async getCoinHistory(to :string) {

    this.to = to;
    const base = 'BTC';
    const coin = this.coin;
    const ticker = await this.marketcap.downloadTicker().toPromise();
    const btcMC = ticker['BTC'];
    const coinMC = ticker[coin];


    const graphs: { ys: number[], color: string, label: string }[] = [];

    const from = moment(to).subtract(1, 'd').format();

    const coinHistory = await this.marketcap.getCoinHistory(this.coin, from, to).toPromise()

    const labels = coinHistory.labels;

   graphs.push({
      ys: coinHistory.percent_change_1h,
      color: '#14886f',
      label: 'percent_change_1h'
    });

    graphs.push({
      ys: coinHistory.price_usd,
      color: '#884644',
      label: 'price'
    });


    this.myGraps = {
      xs: labels,
      graphs: graphs
    }
    console.log(coinHistory);
    /*const priceCoin = coinMC.price_usd;

    const exchanges = ['hitbtc', 'binance', 'bittrex', 'poloniex', 'cryptopia'];

    const fork = await this.allPublic.downloadBooks(exchanges, base, coin);

    const books = await fork.toPromise();

    const priceBTC = btcMC.price_usd;
    console.log(books);

    const amountBase = 1000 / priceBTC;


    const out = books.map(function (item) {
      const buy = MappersBooks.getAvgBooksForAmountBase(item.buy, amountBase) * priceBTC;
      const sell = MappersBooks.getAvgBooksForAmountBase(item.sell, amountBase) * priceBTC;
      return {
        exchange: item.exchange,
        buy: +(100 * (buy - priceCoin)/priceCoin ).toFixed(2),
        sell:+(100 * (sell - priceCoin)/priceCoin ).toFixed(2),
      }
    });

*/


    //console.log(out);


    /* console.log(fork)
     fork.subscribe(books =>{

     console.warn(books);
   })*/



       /* const from = moment(to).subtract(1, 'd').format();

        var exchange = 'hitbtc';



        var api: ApiPublicAbstract = this.allPublic.getExchangeApi(exchange);

        var market = await api.getMarketDay(base, coin, from, to).toPromise();
        if (market) graphs.push({

        ys: market.Last,
          color: '#14886f',
          label: exchange
        });

        var exchange = 'binance';
        var api: ApiPublicAbstract = this.allPublic.getExchangeApi(exchange);

         market = await api.getMarketDay(base, coin, from, to).toPromise();

        if (market) graphs.push({
          ys: market.Last,
          color: '#887337',
          label: exchange
        });

       var exchange = 'bittrex';
        var api: ApiPublicAbstract = this.allPublic.getExchangeApi(exchange);

        market = await api.getMarketDay(base, coin, from, to).toPromise();

        if (market) graphs.push({
          ys: market.Last,
          color: '#700788',
          label: exchange
        });

*/

        // const hitbtc = await this.coinDay.getCoinDayHitbtc(base, coin, from, to).toPromise();

        // console.log(binance);

/*
        this.marketcap.getCoinHistory(this.coin, from, to).subscribe(res => {
          //console.log(res);


          graphs.push( {
            ys: res.volume_usd_24h,
            color: '#0d9abc',
            label: 'Volume'
          });
          graphs.push({
            ys: res.price_usd,
            color: '#880b49',
            label: 'price'
          });
            /!*graphs.push({
              ys: res.percent_change_1h,
              color: '#88881e',
              label: 'price'
            })


          this.from = _.first(res.stamps);
          this.to = _.last(res.stamps);

          this.myGraps = {
            xs: res.labels,
            graphs: graphs
          }

        })*/
  }

  onMinus12h() {
    const to = moment(this.to).subtract(12, 'hours').format();
    this.getCoinHistory(to);
  }

  onPlus12h() {
    const to = moment(this.to).add(12, 'hours').format();
    this.getCoinHistory(to);
  }

}
