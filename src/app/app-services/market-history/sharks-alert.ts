import {Subject} from 'rxjs/Subject';
import {VOOrder} from '../../models/app-models';

export class SharksAlert {
  alertSub: Subject<VOOrder[]> = new Subject();
  value:number;
  next(newOrders:VOOrder[], overlap:number){
    overlap = Math.round(overlap/1000);
    // console.log('new orders '+ newOrders.length)
    // console.log(this.value);
    let res = newOrders.filter(function (item) {
      return item.amountCoin > this.v;
    },{v:this.value});

    res = res.map(function (item) {
     return Object.assign({overlap:overlap}, item)
    })
    if(res.length) this.alertSub.next(res);
  }

  alerts$(value: number){
    this.value = value;
    return this.alertSub.asObservable()
  }
}
