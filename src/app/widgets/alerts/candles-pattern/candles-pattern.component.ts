import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';
import {CandlesService} from '../../../app-services/candles/candles.service';
import {CandlesHist} from '../../../app-services/candles/candles-hist';
import {VOCandle, VOCandleExt} from '../../../models/api-models';
import * as _ from 'lodash';

@Component({
  selector: 'app-candles-pattern',
  templateUrl: './candles-pattern.component.html',
  styleUrls: ['./candles-pattern.component.css']
})

export class CandlesPatternComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;
  @Output() signal: EventEmitter<any> = new EventEmitter();

  candles: VOCandle[];
  volumes: number[];

  constructor(
    private candlesService: CandlesService
  ) {
  }

  ngOnInit() {

  }

  ngOnChanges() {
    this.subscribe();
  }

  private sub1: Subscription;
  private sub2: Subscription;

  subscribe() {
    this.unsubscribe();
    if (!this.exchange || !this.market) return;


   /* const hist: CandlesHist = this.candlesService.getCandlesHist(this.exchange, this.market);

   this.sub1 = hist.candles$().subscribe(candles => {
      if(!candles) return;
      this.volumes = candles.map(function (o) {
        return o.open > o.close ? -o.Volume : o.Volume;
      });

      this.candles = _.clone(candles);
    })

    this.sub2 = hist.volumeAlert$().subscribe((candle:VOCandleExt) =>{
      console.warn(candle);
    })
*/

  }

  unsubscribe() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
  }

}
