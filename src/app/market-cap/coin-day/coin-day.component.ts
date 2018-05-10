import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {VOGraphs} from "../../shared/line-chart/line-chart.component";
import {GRAPHS} from "../../com/grpahs";
import * as moment from "moment";
import * as _ from 'lodash'
import {MongoService} from "../../apis/mongo.service";
import {Moment} from "moment";
import {VOMCAgregated} from "../../apis/api-market-cap.service";

@Component({
  selector: 'app-coin-day',
  templateUrl: './coin-day.component.html',
  styleUrls: ['./coin-day.component.css']
})
export class CoinDayComponent implements OnInit {

  mcCoin:VOMCAgregated;
  coin: string;
  myGraps: VOGraphs;

  rankFirst: number;
  rankLast: number

  skips: number;

  from: string = '';
  to: string = '';

  momentTo: Moment;

  constructor(
    private route: ActivatedRoute,
    private mongo: MongoService
  ) {
  }

  ngOnInit() {
    this.momentTo = moment();//.subtract(12,'h');
    this.route.params.subscribe(paramas => {
      let coin = paramas.coin;
      console.log(coin);
      this.coin = coin;
      this.drawData();

    });
  }

  async drawData() {
    const coin = this.coin;
    let history = await this.mongo.downloadCoinHistory(
      this.momentTo.format(),
      moment(this.momentTo.format()).subtract(1, 'd').format(),
      coin,
      300
    );

    const l = history.length;

    history = history.filter(function (item) {
      return !!item;
    })

    this.skips = l - history.length;


    const first: VOMCAgregated = _.first(history);
    const last: VOMCAgregated = _.last(history);

    this.mcCoin = last;

    this.from = moment(first.timestamp).format('M/D, h:mm a');
    this.to = moment(last.timestamp).format('M/D, h:mm a');

    this.rankFirst = first.rank
    this.rankLast = last.rank;


    const labels = []
    let trigger = false;
    const pricebtcs = [];
    const priceusds = [];
    const volumes = [];
    const triggers = [10];

    history.forEach(function (item) {

      labels.push(' ');
      if (item) {

        pricebtcs.push(item.price_btc);
        priceusds.push(item.price_usd);
        volumes.push(item.volume);
        const integ = GRAPHS.integralData(item);
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
      }


    })


    const graphs = [
      {
        ys: volumes,
        color: '#2abc50',
        label: 'Vol'
      },
      {
        ys: pricebtcs,
        color: '#551c1c',
        label: 'BTC'
      },
      {
        ys: priceusds,
        color: '#545511',
        label: 'US'
      },
      {
        ys: triggers,
        color: '#095531',
        label: 'T'
      }
    ]

    this.myGraps = {
      xs: labels,
      graphs: graphs
    }

  }


  onMinus12h() {
    this.momentTo.subtract(12, 'hours');
    this.drawData();

    //this.getCoinHistory(to);
  }

  onPlus12h() {
    this.momentTo.add(12, 'hours');
    this.drawData();
  }


  onMinus1D() {
    this.momentTo.subtract(1, 'd');
    this.drawData();

    //this.getCoinHistory(to);
  }

  onPlus1D() {
    this.momentTo.add(1, 'd');
    this.drawData();
    //  this.getCoinHistory(to);
  }

  onNowClick() {
    this.momentTo = moment();
    this.drawData();
  }
}
