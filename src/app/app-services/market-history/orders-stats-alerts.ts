import {Subject} from 'rxjs/Subject';
import * as _ from 'lodash';
import {VOOrder} from '../../models/app-models';
import {StorageService} from '../../services/app-storage.service';

enum OrdersAlers{
  VOLUME_UP
}

// [0:to, 1:bought, 2:sold, 3:volPerMinute, 4:ordersPerMinute];
export class OrdersStatsAlerts {
  volumeAlertSub:Subject<number> = new Subject();
  voluumeUpPercent: number;

  private statsHistory: number[][] = [];
  constructor(private exchange: string, private market: string, private storage: StorageService){

  }

  setVolumeUP(percent: number){
    this.voluumeUpPercent = percent;
  }

  async next2(ar: number[][]){
    const vols = ar.map(function (item) {
      return item[3];
    });
    const last = vols[vols.length -1];
    const prev = vols[vols.length -2] ;// _.sum(_.takeRight(vols, 10))/10;

    const diff = Math.round(100 * (last - prev)/prev);
    // console.log('diff ', diff, this.voluumeUpPercent);

    if(Math.abs(diff) > this.voluumeUpPercent) this.volumeAlertSub.next(diff);
  }

  next(ar: VOOrder[], overlap: number) {
    const to = ar[ar.length - 1].timestamp;
    const from = ar[0].timestamp;
    let bought = 0;
    let sold = 0;
    ar.forEach(function (o) {
      o.action === 'BUY' ? bought += o.amountUS : sold += o.amountUS;
    });

    const volPerMinute = 60 * (bought + sold) / (to - from);
    const ordersPerMinute = (60000 * ar.length / (to - from));
    const stats = [to, bought, sold, volPerMinute, ordersPerMinute];
    this.statsHistory.push(stats);
    if (this.statsHistory.length > 100) this.statsHistory.shift();

    this.storage.upsert('statsHistory' + this.exchange + this.market, this.statsHistory);
    this.next2(this.statsHistory);
  }

  volumeAlert$(){
    return this.volumeAlertSub.asObservable()
  }
}
