import {Component, OnInit} from '@angular/core';
import {ApiMarketCapService} from "../../src/app/apis/api-market-cap.service";
import {ActivatedRoute} from "@angular/router";
import {VOGraphs} from "../../src/app/ui/line-chart/line-chart.component";
import * as moment from "moment";
import * as _ from 'lodash';
import {VOMarketCap} from "../../src/app/models/app-models";
import {ApisPublicService} from "../../src/app/apis/api-public/apis-public.service";
import {ApiPublicAbstract} from "../../src/app/apis/api-public/api-public-abstract";
import {ApisBooksService} from "../../src/app/apis/apis-books.service";
import {UtilsBooks} from "../../src/app/com/utils-books";
import {MongoService} from "../../src/app/apis/mongo.service";
import {UtilsBot} from "../../src/app/com/utils-bot";
import {GRAPHS} from "../../src/app/com/grpahs";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";


@Component({
  selector: 'app-coin-graph',
  templateUrl: './coin-graph.component.html',
  styleUrls: ['./coin-graph.component.css']
})
export class CoinGraphComponent implements OnInit {

  myGraps: VOGraphs;
  coinMC: VOMarketCap;

  dateForm: FormGroup;

  coin: string;
  from: string = '';
  to: string = '';

  constructor(private route: ActivatedRoute,
              private marketcap: ApiMarketCapService,
              private allPublic: ApisPublicService,
              private mongo: MongoService,
              private fb: FormBuilder
              // private booksService: ApisBooksService
  ) {

    this.dateForm = fb.group({
      dateTo: [moment(), Validators.required]

    })
  }

  onGoClick() {

    let values = this.dateForm.value;
    const from = values.dateTo.format();
    const to = moment(from).add(1, 'd').format();
    this.from = from;
    this.to = to;

    this.buildMongoGraph();
   //  console.log(from, to);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const coin = params.coin;
      if (!coin) return;
      this.coin = coin;
      this.marketcap.getCoin(coin).then(res => this.coinMC = res);
      this.to = moment().format();
      this.from = moment().subtract(1, 'd').format();
      this.buildMongoGraph();

      //this.getCoinHistory(to);
    })
  }

  async buildMongoGraph() {

   /* const history: VOMCAgregated[] = await this.mongo.downloadCoinHistory(this.to, this.from, this.coin, 300);
    console.log(history[0])
    const anl = GRAPHS.mcAggregatedToGraphs(history);
    // console.log(anl);
    const graphs = [];
    graphs.push({
      ys: anl.price_btc,
      color: '#885a6a',
      label: 'price_btc'
    });*/


    /*
        graphs.push({
          ys: anl.prev10_20,
          color: '#252288',
          label: 'prev10_20'
        });*/
    /*
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
    */

   /* this.myGraps = {
      xs: anl.labels,
      graphs: graphs
    }
*/
  }


  async getCoinHistory(to: string) {



    throw new Error(' con day OFF')
    // this.to = to;
    // const base = 'BTC';
  /*  const coin = this.coin;
    const ticker = await this.marketcap.downloadTicker().toPromise();
    // const btcMC = ticker['BTC'];
    const coinMC = ticker[coin];


    const graphs: { ys: number[], color: string, label: string }[] = [];

    const from = moment(to).subtract(1, 'd').format();

    const coinHistory = await this.marketcap.getCoinDay(this.coin, from, to).toPromise();

    console.log(coinHistory);
    const stamps = coinHistory.stamps;
    this.from = stamps[0];
    this.to = stamps[stamps.length - 1];


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
*/

  }

  onMinus12h() {
    this.to = moment(this.to).subtract(12, 'h').format();
    this.from = moment(this.to).subtract(1, 'd').format();
    this.buildMongoGraph();

    //this.getCoinHistory(to);
  }

  onPlus12h() {
    this.to = moment(this.to).add(12, 'hours').format();
    this.from = moment(this.to).subtract(1, 'd').format();
    this.buildMongoGraph();
  }


  onMinus1D() {
    this.to = moment(this.to).subtract(1, 'd').format();
    this.from = moment(this.to).subtract(1, 'd').format();
    this.buildMongoGraph();

    //this.getCoinHistory(to);
  }

  onPlus1D() {
    this.to = moment(this.to).add(1, 'd').format();
    this.from = moment(this.to).subtract(1, 'd').format();
    this.buildMongoGraph();
    //  this.getCoinHistory(to);
  }

  onMinus1W() {
    this.to = moment(this.to).subtract(1, 'w').format();
    this.from = moment(this.to).subtract(1, 'd').format();
    this.buildMongoGraph();
    // this.getCoinHistory(to);
  }

  onPlus1W() {
    this.to = moment(this.to).add(1, 'w').format();
    this.from = moment(this.to).subtract(1, 'd').format();
    this.buildMongoGraph();
    // this.getCoinHistory(to);
  }

}
