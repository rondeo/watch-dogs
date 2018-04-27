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
  from: string='';
  to: string='';

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

   // this.to = to;
   // const base = 'BTC';
    const coin = this.coin;
    const ticker = await this.marketcap.downloadTicker().toPromise();
   // const btcMC = ticker['BTC'];
    const coinMC = ticker[coin];


    const graphs: { ys: number[], color: string, label: string }[] = [];

    const from = moment(to).subtract(1, 'd').format();

    const coinHistory = await this.marketcap.getCoinDay(this.coin, from, to).toPromise();

    console.log(coinHistory);
    const stamps = coinHistory.stamps;
    this.from = stamps[0];
    this.to = stamps[stamps.length -1];


    const labels = coinHistory.labels;

   graphs.push({
      ys: coinHistory.available_supply,
      color: '#14886f',
      label: 'available_supply'
    });


    graphs.push({
      ys: coinHistory.tobtc_change_1h,
      color: '#252288',
      label: '% to BTC 1h'
    });
    graphs.push({
      ys: coinHistory.percent_change_1h,
      color: '#0e8857',
      label: '%  1h'
    });

    graphs.push({
      ys: coinHistory.price_usd,
      color: '#884644',
      label: 'price'
    });

    graphs.push({
      ys: coinHistory.price_btc,
      color: '#888227',
      label: 'BTC'
    });


    this.myGraps = {
      xs: labels,
      graphs: graphs
    }



  }

  onMinus12h() {
    const to = moment(this.to).subtract(12, 'hours').format();
    this.getCoinHistory(to);
  }

  onPlus12h() {
    const to = moment(this.to).add(12, 'hours').format();
    this.getCoinHistory(to);
  }


  onMinus1D() {
    const to = moment(this.to).subtract(1, 'd').format();
    this.getCoinHistory(to);
  }

  onPlus1D() {
    const to = moment(this.to).add(1, 'd').format();
    this.getCoinHistory(to);
  }

  onMinus1W() {
    const to = moment(this.to).subtract(1, 'w').format();
    this.getCoinHistory(to);
  }

  onPlus1W() {
    const to = moment(this.to).add(1, 'w').format();
    this.getCoinHistory(to);
  }

}
