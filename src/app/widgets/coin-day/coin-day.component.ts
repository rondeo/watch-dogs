import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {VOGraphs} from '../../ui/line-chart/line-chart.component';
import {GRAPHS} from '../../com/grpahs';
import * as moment from 'moment';
import * as _ from 'lodash'
import {MongoService} from '../../apis/mongo.service';
import {Moment} from 'moment';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApiCryptoCompareService} from '../../apis/api-crypto-compare.service';
import {P} from '@angular/core/src/render3';

import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {VOLineGraph} from '../../ui/line-graph/line-graph.component';
import {VOCoinData} from '../../models/api-models';

@Component({
  selector: 'app-coin-day',
  templateUrl: './coin-day.component.html',
  styleUrls: ['./coin-day.component.css']
})
export class CoinDayComponent implements OnInit, OnChanges {


  @Output() coindatas: EventEmitter<VOCoinData[]> = new EventEmitter<VOCoinData[]>();
  @Input() coin: string;
  mcCoin: VOCoinData;

  myGraps: VOGraphs;
  myGraps2: VOLineGraph[];

  isExchanges:boolean;

  rankFirst: number;
  rankLast: number;

  skips: number;

  from: string = '';
  to: string = '';

  momentTo: Moment;
  exchange: string;
  market:string;

  constructor(
    //  private route: ActivatedRoute,
    private apiMarketCap: ApiMarketCapService,
    private cryptoCompare: ApiCryptoCompareService,
    private apiPublic: ApisPublicService
  ) {
  }

  ngOnChanges(data: { [val: string]: SimpleChange }) {
    if (data.coin) {
      console.warn(data);
      this.filterDay();
    }
  }

  ngOnInit() {


    this.momentTo = moment();//.subtract(12,'h');


    /*this.route.params.subscribe(paramas => {
      let coin = paramas.coin;
      console.log(coin);
      this.coin = coin;

      this.cryptoCompare.getSocialStats(coin).subscribe(res => {
        console.log(res);
      })


      this.filterDay();

    });*/

    // this.filterDay();

  }

/*  async showExchanges(){
   // console.log(this.isExchanges);
    if(!this.isExchanges) return;
    const to = this.momentTo.valueOf();
    const from = moment(to).subtract(1, 'd').valueOf();
    this.market = 'BTC_' + this.coin;
    const prices = await this.apiPublic.getPriceFromExchangesByCandlesticks(['binance','bittrex'], 'BTC', this.coin, from, to);
   // console.log(prices);

    const line: VOLineGraph = {
      ys: prices[0],
      color: '#ff7f56',
      label: 'binance'
    }
    this.myGraps2 = [line];
  }*/

  async filterDay() {
    if (!this.coin) return;
   // console.warn(this.coin);
    this.fullHistory = await this.getCoinHistory();
    const to = this.momentTo.valueOf();
    const from = moment(to).subtract(1, 'd').valueOf();


    let history = this.fullHistory.filter(function (item) {
      return item.timestamp < to && item.timestamp > from;
    });
    this.drawData(history);
    //this.showExchanges();
  }

  async getCoinHistory(): Promise<VOCoinData[]> {
    if (this.fullHistory) return Promise.resolve(this.fullHistory);
    else return this.apiMarketCap.getCoinWeek(this.coin).toPromise();
  }

  fullHistory: VOCoinData[];

  drawData(history: VOCoinData[]) {

    const l = history.length;

    //  console.log(coindatas);

    history = history.filter(function (item) {
      return !!item;
    })

   // console.log('histpory', history);
    this.skips = l - history.length;


    const first: VOCoinData = _.first(history);
    const last: VOCoinData = _.last(history);

    this.mcCoin = last;

    this.from = moment(first.timestamp).format('M/D, h:mm a');
    this.to = moment(last.timestamp).format('M/D, h:mm a');

    this.rankFirst = first.rank
    this.rankLast = last.rank;
    const labels = [];
    let trigger = false;
    const pricebtcs = [];
    const priceusds = [];
    const volumes = [];
    const total_supply = [];
    const rank = [];
    const triggers = [10];

    history.forEach(function (item) {
      labels.push(' ');
      if (item) {

        pricebtcs.push(item.price_btc);
        priceusds.push(item.price_usd);
        volumes.push(item.volume);
        total_supply.push(item.total_supply);
        rank.push(item.rank);

       //  const integ = GRAPHS.integralData(item);

        /* const integ = GRAPHS.integralData(item);
         if (trigger) {
           trigger = false;
           triggers.push(0);
         } else {
           trigger =
             integ.cur_prev < 0 &&
             integ.prev5_10 < 0 &&
             integ.prev10_20 < 0 &&
             integ.prev5_10 < 0;
           triggers.push(trigger ? 2 : 1);

         }
       } else {
         //pricebtcs.push(item.price_btc);
         //// priceusds.push(item.price_usd);
         //  volumes.push(item.volume);
       }*/

      }
    })


    const graphs = [
      {
        ys: volumes,
        color: '#05ff35',
        label: 'Vol'
      },
      {
        ys: pricebtcs,
        color: '#ff7f56',
        label: 'BTC'
      },
      {
        ys: priceusds,
        color: '#88a5ff',
        label: 'US'
      },
      {
        ys: rank,
        color: '#c4bbc0',
        label: 'Rank'
      }
    ]

    this.myGraps = {
      xs: labels,
      graphs: graphs
    }

    this.coindatas.emit(history);

  }

  onAllClick() {
    this.drawData(this.fullHistory);

  }

  onMinus12h() {
    this.momentTo.subtract(12, 'hours');
    this.filterDay();

    //this.getCoinHistory(to);
  }

  onPlus12h() {
    this.momentTo.add(12, 'hours');
    this.filterDay();
  }


  onMinus1D() {
    this.momentTo.subtract(1, 'd');
    this.filterDay();

    //this.getCoinHistory(to);
  }

  onPlus1D() {
    this.momentTo.add(1, 'd');
    this.filterDay();
    //  this.getCoinHistory(to);
  }

  onNowClick() {
    this.momentTo = moment();
    this.filterDay();
  }
}