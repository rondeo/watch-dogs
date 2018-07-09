import {Component, Input, OnInit} from '@angular/core';
import {VOCoinWeek} from '../../models/api-models';
import {MovingAverage, VOMovingAvg} from '../../com/moving-average';
import * as _ from 'lodash';
import * as moment from 'moment';
import {VOLineGraph} from '../../ui/line-graph/line-graph.component';

@Component({
  selector: 'app-coin-day-triggers',
  templateUrl: './coin-day-triggers.component.html',
  styleUrls: ['./coin-day-triggers.component.css']
})
export class CoinDayTriggersComponent implements OnInit {

  @Input() coin: string;

  triggers: VOLineGraph[];

  grapg1: VOLineGraph[];

  constructor() {
  }

  ngOnInit() {
  }


  onCoinDataChange(coindatas: VOCoinWeek[]) {
   // console.log(coindatas)
    const length = coindatas.length;
    console.log(moment(_.first(coindatas).timestamp).format());
    console.log(moment(_.last(coindatas).timestamp).format());

    const mas = MovingAverage.movingAverageGraphFromCoinWeek(coindatas);

    const ma_4hs = [];
    const ma_2hs = []
    const ma_2hDs = [];

    const ma_1hs = [];
    const ma_05hs = [];
    const ma_03hs = [];

    mas.reverse();
    let lastValue_4h;
    let lastValue_2h;
    let lastValue_2hD;

    let lastValue_1h;
    let lastValue_05h;
    let lastValue_03h;

    mas.forEach(function (item) {
      if (item.price4h) {
        lastValue_4h = item.price4h;
      }
      ma_4hs.push(lastValue_4h);

      if (item.price2h) {
        lastValue_2h = item.price2h;
      }
      ma_2hs.push(lastValue_2h);

      if (item.price2hD) {
        lastValue_2hD = item.price2hD;
      }
      ma_2hDs.push(lastValue_2hD);

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
    ma_4hs.reverse();
    ma_2hs.reverse();
    ma_2hDs.reverse();
    ma_1hs.reverse();
    ma_05hs.reverse();
    ma_03hs.reverse();
    console.log(moment(_.first(mas).timestamp).format());
    console.log(moment(_.last(mas).timestamp).format());

    let triggers: { timestamp: number, trigger: number }[] = MovingAverage.triggerMovingAvarages(mas);

    //  while(triggers.length < length) triggers.unshift(1);
    // console.log(triggers);
    const values = _.map(triggers, 'trigger');
    this.triggers = [
      {
        ys: values,
        color: '#4c9561',
        label: null
      },
      {
        ys: ma_2hs,
        color: '#406995',
        label: null
      }
    ];
  }
}
