import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {CandlesService} from '../../../../adal/app-services/candles/candles.service';
import {StorageService} from '../../../../adal/services/app-storage.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';


@Component({
  selector: 'app-candle-volume-alert',
  templateUrl: './candle-volume-alert.component.html',
  styleUrls: ['./candle-volume-alert.component.css']
})
export class CandleVolumeAlertComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;
  alerts: {value1: string, value2: string, time: string}[] = [];

  private DBID: string;
  private sub1: Subscription;
  constructor(
    private candleService: CandlesService,
    private storage: StorageService
  ) { }

  ngOnInit() {


  }

  async ngOnChanges() {

   //  this.alerts = this.storage.select('volume')
    this.subscribe();
  }

  unsubscribe() {

    if (this.DBID) this.storage.remove(this.DBID);
    if (this.sub1) this.sub1.unsubscribe();
  }

  subscribe() {
    if (!this.exchange || !this.market) return;
    this.unsubscribe();
    this.DBID = 'CandleVolumeAlert' + this.exchange + this.market;
    this.storage.select(this.DBID).then(res => this.alerts = res || []);

   /* const hist = this.candleService.getCandlesHist(this.exchange,this.market );
    this.sub1 = hist.volumeAlert$().subscribe(res =>{
      console.log(this.exchange + this.market + ' volumeAlert$ ' , res);
      const ar = this.alerts;//_.clone(this.alerts);
      if(ar.length > 100) ar.pop();

      ar.unshift({
        value1: (res.meanD).toLocaleString()+'%',
        value2: (res.medD).toLocaleString()+'%',
        time: moment(res.timestamp).format('HH:mm')
      });

      this.alerts = ar;
      this.storage.upsert(this.DBID, ar);
    });*/
  }

}
