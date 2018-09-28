import {Subject} from 'rxjs/Subject';
import * as _ from 'lodash';

enum OrdersAlers{
  VOLUME_UP
}

// [0:to, 1:bought, 2:sold, 3:volPerMinute, 4:ordersPerMinute];
export class OrdersStatsAlerts {
  alertSub:Subject<number> = new Subject();
  voluumeUpPercent: number;
  constructor(){

  }

  setVolumeUP(percent: number){
    this.voluumeUpPercent = percent;
  }

  async next(ar: number[][]){
    const vols = ar.map(function (item) {
      return item[3];
    });
    const last = vols[vols.length -1];
    const prev = vols[vols.length -2] ;// _.sum(_.takeRight(vols, 10))/10;

    const diff = Math.round(100 * (last - prev)/prev);
    // console.log('diff ', diff, this.voluumeUpPercent);

        if(Math.abs(diff) > this.voluumeUpPercent) this.alertSub.next(diff);
  }

  alerts$(){
    return this.alertSub.asObservable()
  }
}
