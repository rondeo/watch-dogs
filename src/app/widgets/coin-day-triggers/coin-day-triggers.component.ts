import {Component, Input, OnInit} from '@angular/core';
import {VOCoinData} from '../../models/api-models';
import {MovingAverage} from '../../com/moving-average';
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
  constructor() { }

  ngOnInit() {
  }


  onCoinDataChange(coindatas: VOCoinData[]) {
    const length = coindatas.length;
    console.log(moment(_.first(coindatas).timestamp).format());
    console.log(moment(_.last(coindatas).timestamp).format());

    const mas = MovingAverage.movingAfarageFromVOCoinData(coindatas);
    console.log(moment(_.first(mas).timestamp).format());
    console.log(moment(_.last(mas).timestamp).format());
    let triggers:{ timestamp: number, trigger: number }[] = MovingAverage.triggerMovingAvarages(mas);

    //  while(triggers.length < length) triggers.unshift(1);
    // console.log(triggers);
    const values = _.map(triggers, 'trigger');
    this.triggers = [{
      ys:values,
      color:'#4c9561',
      label:null
    }];
  }
}
