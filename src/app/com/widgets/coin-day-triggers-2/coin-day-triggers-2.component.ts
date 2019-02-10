import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange} from '@angular/core';

import {MovingAverage, VOMovingAvg} from '../../../core/com/moving-average';
import * as _ from 'lodash';
import * as moment from 'moment';
import {VOLineGraph} from '../../ui/line-graph/line-graph.component';
import {Moment} from 'moment';
import {VOGraphs} from '../../ui/line-chart/line-chart.component';
import {ApiCryptoCompareService} from '../../../core/apis/api-crypto-compare.service';
import {ApisPublicService} from '../../../core/apis/api-public/apis-public.service';
import {ApiMarketCapService} from '../../../core/apis/api-market-cap.service';

@Component({
  selector: 'app-coin-day-triggers-2',
  templateUrl: './coin-day-triggers-2.component.html',
  styleUrls: ['./coin-day-triggers-2.component.css']
})
export class CoinDayTriggers2Component implements OnInit, OnChanges {

  constructor(
    private apiMarketCap: ApiMarketCapService,
    private cryptoCompare: ApiCryptoCompareService,
    private apiPublic: ApisPublicService
  ) {
  }

  @Output() coindatas: EventEmitter<any[]> = new EventEmitter<any[]>();

  @Input() coin: string;

  triggers: VOLineGraph[];


  lastValue: any;

  myGraps: VOGraphs;

  isExchanges: boolean;

  rankFirst: number;
  rankLast: number;

  skip: number;

  from = '';
  to = '';

  momentTo: Moment;
  exchange: string;
  market: string;

  /* async getCoinHistory(): Promise<any[]> {
     if (this.fullHistory) return Promise.resolve(this.fullHistory);
     else return this.apiMarketCap.getCoinWeek(this.coin).toPromise();
   }*/

  fullHistory: any[];

  ngOnChanges(data: { [val: string]: SimpleChange }) {
    if (data.coin) {
      console.warn(data);
      this.filterDay();
    }
  }

  ngOnInit() {
    this.momentTo = moment();
  }


  async filterDay() {
    if (!this.coin) return;
    // console.warn(this.coin);
    // this.fullHistory  = await this.getCoinHistory();
    const to = this.momentTo.valueOf();
    const from = moment(to).subtract(1, 'd').valueOf();


    let history = this.fullHistory.filter(function (item) {
      return item.timestamp < to && item.timestamp > from;
    });
    this.drawData(history);

  }

  drawData(history: any[]) {

    const l = history.length;

    history = history.filter(function (item) {
      return !!item;
    });

    this.skip = l - history.length;

    const first: any = _.first(history);
    const last: any = _.last(history);

    this.lastValue = last;

    this.from = moment(first.timestamp).format('M/D, h:mm a');
    this.to = moment(last.timestamp).format('M/D, h:mm a');

    this.rankFirst = first.rank;
    this.rankLast = last.rank;
    const labels = [];

    const pricebtcs = [];
    const priceusds = [];
    const volumes = [];
    const total_supply = [];
    const ranks = [];

    history.forEach(function (item) {
      labels.push(' ');
      if (item) {

        pricebtcs.push(item.price_btc);
        priceusds.push(item.price_usd);
        volumes.push(item.volume);
        total_supply.push(item.total_supply);
        ranks.push(item.rank);
      }
    });

    console.log(history);

    const mas = MovingAverage.movingAverageGraphFromCoinWeek(history);

    const min = _.min(pricebtcs);
    const max = _.max(pricebtcs);
    const ma_3hs = [];
    const ma_2hs = [];
    const ma_1hs = [];
    const ma_05hs = [];
    const ma_03hs = [];
    console.log(mas);
    mas.reverse();
    let lastValue_3h;
    let lastValue_2h;
    let lastValue_1h;
    let lastValue_05h;
    let lastValue_03h;

    mas.forEach(function (item: VOMovingAvg) {
      if (item.price3h) {
        lastValue_3h = item.price3h;
      }
      ma_3hs.push(lastValue_3h);

      if (item.price2h) {
        lastValue_2h = item.price2h;
      }
      ma_2hs.push(lastValue_2h);

      if (item.price1h) {
        lastValue_1h = item.price1h;
      }
      ma_1hs.push(lastValue_1h);

      if (item.price05h) {
        lastValue_05h = item.price05h;
      }
      ma_05hs.push(lastValue_05h);

      if (item.price03h) {
        lastValue_03h = item.price03h;
      }
      ma_03hs.push(lastValue_03h);

    });

    mas.reverse();
    ma_3hs.reverse();
    ma_2hs.reverse();
    ma_1hs.reverse();
    ma_05hs.reverse();
    ma_03hs.reverse();

    ma_3hs[0] = min;
    ma_3hs[1] = max;

    ma_2hs[0] = min;
    ma_2hs[1] = max;

    ma_1hs[0] = min;
    ma_1hs[1] = max;

    ma_05hs[0] = min;
    ma_05hs[1] = max;

    ma_03hs[0] = min;
    ma_03hs[1] = max;

    const graphs = [
      {
        ys: volumes,
        color: '#167c2c',
        label: 'Vol'
      },
      {
        ys: ranks,
        color: '#7c7b43',
        label: 'rank'
      },
      {
        ys: pricebtcs,
        color: '#ffa3a2',
        label: 'BTC'
      },
      {
        ys: ma_3hs,
        color: '#88a5ff',
        label: '3H'
      },
      {
        ys: ma_2hs,
        color: '#9a1b99',
        label: '2H'
      }
    ];

    this.myGraps = {
      labelsX: labels,
      graphs: graphs
    };


    let triggers: { timestamp: number, trigger: number }[] = MovingAverage.triggerMovingAvarages(mas);

    //  while(triggers.length < length) triggers.unshift(1);
    // console.log(triggers);
    const values = _.map(triggers, 'trigger');
    this.triggers = [{
      ys: values,
      color: '#4c9561',
      label: null
    }];

    this.coindatas.emit(history);
    // this.onCoinDataChange(history);

  }

  onAllClick() {
    this.drawData(this.fullHistory);

  }

  onMinus12h() {
    this.momentTo.subtract(12, 'hours');
    this.filterDay();

    // this.getCoinHistory(to);
  }

  onPlus12h() {
    this.momentTo.add(12, 'hours');
    this.filterDay();
  }


  onMinus1D() {
    this.momentTo.subtract(1, 'd');
    this.filterDay();

    // this.getCoinHistory(to);
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

  onCoinDataChange(coindatas: any[]) {
    const length = coindatas.length;
    console.log(moment(_.first(coindatas).timestamp).format('M/DD HH:mm'));
    console.log(moment(_.last(coindatas).timestamp).format('M/DD HH:mm'));

    const mas = MovingAverage.movingAverageGraphFromCoinWeek(coindatas);

    console.log(moment(_.first(mas).timestamp).format('M/DD HH:mm'));
    console.log(moment(_.last(mas).timestamp).format('M/DD HH:mm'));

    let triggers: { timestamp: number, trigger: number }[] = MovingAverage.triggerMovingAvarages(mas);

    //  while(triggers.length < length) triggers.unshift(1);
    // console.log(triggers);
    const values = _.map(triggers, 'trigger');
    this.triggers = [{
      ys: values,
      color: '#4c9561',
      label: null
    }];
  }
}
