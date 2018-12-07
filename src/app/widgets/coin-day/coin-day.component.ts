import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {VOGraphs} from '../../ui/line-chart/line-chart.component';
import {GRAPHS} from '../../com/grpahs';
import * as moment from 'moment';
import * as _ from 'lodash';
import {MongoService} from '../../apis/mongo.service';
import {Moment} from 'moment';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApiCryptoCompareService, VOHistHour} from '../../apis/api-crypto-compare.service';


import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {VOLineGraph} from '../../ui/line-graph/line-graph.component';
import {MovingAverage} from '../../com/moving-average';
import {VOMarketCap} from '../../models/app-models';
import {VOMCObj} from '../../models/api-models';

@Component({
  selector: 'app-coin-day',
  templateUrl: './coin-day.component.html',
  styleUrls: ['./coin-day.component.css']
})
export class CoinDayComponent implements OnInit, OnChanges {


  @Output() coindatas: EventEmitter<VOMCObj[]> = new EventEmitter<VOMCObj[]>();

  @Input() coin: string;

  @Input() isWeek = false;

  myGraps: VOGraphs;
  // from: string = '';
  // to: string = '';

  duration: string;


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

  }

  async controller() {
    const coinData = await this.getCoinHistory();
    this.drawData(coinData);
  }

  async getCoinHistory(): Promise<any[]> {
    return null;
  /*  const to: string = moment().toISOString();
    const coin = this.coin;
    let coinData;
    if (this.isWeek) {
      const ago50H = moment().subtract(500, 'hours').toISOString();
      coinData = await this.apiMarketCap.getCoinHistory5Hours(coin, ago50H, to).toPromise();

    } else {
      const from: string = moment().subtract(30, 'hours').toISOString();
      coinData = await this.apiMarketCap.getCoinHistory(coin, from, to).toPromise();
    }

    return coinData;*/
  }

  async drawData(history: any[]) {

    const first = _.first(history);
    const last = _.last(history);


    // const from = moment(first.date);
    //   const to = moment(last.date);

    let dur = moment.duration(moment(last.date).diff(moment(first.date))).asHours();

    let labels = [];
    if (dur > 40) {
      this.duration = (dur / 24).toFixed(2) + ' days ' + moment(first.date)
        .format('MM-DD HH:MM') + ' - ' + moment(last.date).format('MM-DD HH:MM');
      labels = GRAPHS.createLabels12(first.date, last.date, 'DD HH');
    } else {
      labels = GRAPHS.createLabels12(first.date, last.date);
      this.duration = dur.toFixed(1) + ' hours ' + moment(first.date).format('DD HH:mm') + ' - ' + moment(last.date)
        .format('DD-HH:mm');
    }


    let trigger = false;
    const pricebtcs = [];
    const priceusds = [];
    const volumes = [];
    const total_supply = [];
    const ranks = [];

    //  console.log(history);


    history.forEach(function (item, i) {
      // console.log(item['date']);
      // let label = ' ';
      if (item) {
        // label = moment(item['date']).format('HH')

        const data: VOMarketCap = item[this.coin];
        if (!!data) {
          pricebtcs.push(data.price_btc);
          ranks.push(data.rank);
          volumes.push(data.volume_24h);
        }

      }

      // console.log(label)
      //  labels.push(label);
    }, {coin: this.coin});

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
    ];

    this.myGraps = {
      labelsX: labels,
      graphs: graphs
    };

    this.coindatas.emit(history);
  }
}
