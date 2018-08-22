import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {VOGraphs} from '../../ui/line-chart/line-chart.component';
import {GRAPHS} from '../../com/grpahs';
import * as moment from 'moment';
import * as _ from 'lodash'
import {MongoService} from '../../apis/mongo.service';
import {Moment} from 'moment';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApiCryptoCompareService, VOHistHour} from '../../apis/api-crypto-compare.service';
import {P} from '@angular/core/src/render3';

import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {VOLineGraph} from '../../ui/line-graph/line-graph.component';
import {VOCoinWeek} from '../../models/api-models';
import {MovingAverage} from '../../com/moving-average';
import {VOMarketCap} from '../../models/app-models';

@Component({
  selector: 'app-coin-day',
  templateUrl: './coin-day.component.html',
  styleUrls: ['./coin-day.component.css']
})
export class CoinDayComponent implements OnInit, OnChanges {


  @Output() coindatas: EventEmitter<VOCoinWeek[]> = new EventEmitter<VOCoinWeek[]>();
  @Input() coin: string;
  mcCoin: VOCoinWeek;

  coinMC: VOMarketCap;
  myGraps: VOGraphs;
  myGraps2: VOLineGraph[];

  isExchanges: boolean;

  rankFirst: number;
  rankLast: number;

  skips: number;

  from: string = '';
  to: string = '';

  momentTo: Moment;
  exchange: string;
  market: string;

  constructor(
    //  private route: ActivatedRoute,
    private apiMarketCap: ApiMarketCapService,
    private cryptoCompare: ApiCryptoCompareService,
    private apiPublic: ApisPublicService
  ) {
  }

  ngOnChanges(data: { [val: string]: SimpleChange }) {
    if (data.coin) {
      //  console.warn(data);
      this.controller();
    }
  }

  ngOnInit() {
    this.momentTo = moment();
    this.setCoinMC();
  }

  setCoinMC() {
    this.apiMarketCap.ticker$().subscribe(MC => {
      this.coinMC = MC[this.coin];
    })
  }


  async controller() {
    const coinData = await this.getCoinHistory();
    this.drawData(coinData);
  }

  async filterDay() {
    // console.warn(' using ');
    if (!this.coin) return;

    // console.warn(this.coin);
    /* this.fullHistory = await this.getCoinHistory();

     const to = this.momentTo.valueOf();
     const from = moment(to).subtract(1, 'd').valueOf();


     let history = this.fullHistory.filter(function (item) {
       return item.timestamp < to && item.timestamp > from;
     });
     this.drawData(history);
 */

    //this.showExchanges();
  }

  async getCoinHistory(): Promise<any[]> {
    const to: string = moment().toISOString();
    const from: string = moment().subtract(30, 'hours').toISOString();
    const coinData = await this.apiMarketCap.getCoinHistory(this.coin, from, to).toPromise();
    return coinData;
  }

  fullHistory: VOCoinWeek[];

  async drawData(history: any[]) {
    // console.log(history);

    /*  const l = history.length;

      history = history.filter(function (item) {
        return !!item;
      })
      this.skips = l - history.length;
  */
    const first = _.first(history);
    const last = _.last(history);

    this.mcCoin = last;

    this.from = moment(first.date).format('M/D, h:mm a');
    this.to = moment(last.date).format('M/D, h:mm a');


    //this.rankFirst = Object.values(first).rank;
    //this.rankLast = last.rank;
    const labels = [];
    let trigger = false;
    const pricebtcs = [];
    const priceusds = [];
    const volumes = [];
    const total_supply = [];
    const ranks = [];

    //  console.log(history);

    history.forEach(function (item, i) {
      labels.push(' ');
      if (item) {
        const data: VOMarketCap =item[this.coin];
        pricebtcs.push(data.price_btc);
        ranks.push(data.rank);
        volumes.push(data.volume_24h);
        // item.price_btc = stepprice;
        /*  pricebtcs.push(item.price_btc);
          priceusds.push(item.price_usd);
          volumes.push(item.volume);
          total_supply.push(item.total_supply);
          ranks.push(item.rank);*/

      }
    }, {coin: this.coin});


    /* const histohour = (await this.cryptoCompare.getHistoMinute('BTC', this.coin).toPromise()).reduce(function (s, item: VOHistHour) {
       for (let str in item) {
         const ar = s[str] || [];
         ar.push(item[str])
         s[str] = ar;
       }
       return s
     }, {
       avg: [],
       date: [],
       last: [],
       timestamp: [],
       volumefrom: [],
       volumeto: []
     });
 */

    //  console.log(histohour);
    // const coinsDay = await this.apiMarketCap.downloadCoinsDayHours30().toPromise();

    //const coinDay = coinsDay[this.coin].slice(8);

    // console.log(coinDay);

   // const medians = await MovingAverage.createMedianPriceBTC(history);

    // const ma = await MovingAverage.movingAvarage(history);
    //  console.log(medians);

    const min = _.min(pricebtcs);
    const max = _.max(pricebtcs);

   /* medians.med_1hs[0] = min;
    medians.med_1hs[1] = max;
    medians.med_2hs[0] = min;
    medians.med_2hs[1] = max;*/


    /* ma.price_1h[0] = min;
     ma.price_1h[1] = max;
     ma.price_2h[0] = min;
     ma.price_2h[0] = max;*/

    const graphs = [
      {
        ys: volumes,
        color: '#969794',
        label: 'Vol'
      },
      {
        ys: pricebtcs,
        color: '#ff7f56',
        label: 'BTC'
      },
      {
        ys: ranks,
        color: '#00b922',
        label: 'ranks'
      }
      /*  {
          ys:histohour.last,
          color: '#0b8318',
          label: 'last  '
        },
         {
          ys: histohour.volumeto,
          color: '#83193f',
          label: 'V@ '
        }*/

      /* {
          ys: ma.price_1h,
          color: '#0b8318',
          label: 'MA 1h '
        },
        {
          ys:ma.price_2h,
          color: '#133075',
          label: 'MA 2h'
        }*/
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
