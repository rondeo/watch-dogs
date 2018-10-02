import {Subject} from 'rxjs/Subject';
import {VOOrderExt, VOOrder} from '../../models/app-models';
import {StorageService} from '../../services/app-storage.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import * as _ from 'lodash';

export class SharksAlert {
  alertSub: Subject<VOOrderExt[]> = new Subject();
  historySub: BehaviorSubject<VOOrderExt[]> = new BehaviorSubject(null);

  value: number;
  length: number;
  private strorageIndex: string;

  constructor(public exchange: string, public market: string, private storage: StorageService) {
    this.strorageIndex = 'SharksAlert-history-' + exchange + '_' + market;
    storage.select(this.strorageIndex).then(res => this.historySub.next(res));
  }

  next(newOrders: VOOrder[], overlap: number) {
    overlap = Math.round(overlap / 1000);
    // console.log('new orders '+ newOrders.length)
    // console.log(this.value);


    const indexed = {};
    newOrders.forEach(function (item) {
      const id = item.action + item.amountCoin;
      const exists = indexed[id];
      if(!exists) {
        indexed[id] = Object.assign({overlap: overlap,  orders:1}, item)
      } else {
        exists.orders ++;
      }
    });


    let res = Object.values<VOOrderExt>(indexed).filter(function (item:VOOrderExt) {
      return item.amountCoin > this.v || (item.orders * item.amountCoin) > this.v;
    }, {v: this.value});

    const resExt: VOOrderExt[] = res;
    // console.log(res)

    /*const resExt: VOOrderExt[] = res.map(function (item) {
      return Object.assign({overlap: overlap}, item)
    })*/;

    let history = this.historySub.getValue() || [];
    if (resExt.length) {
      history = _.uniqBy(history.concat(resExt), 'uuid');
      if (history.length > this.length) history = history.slice(history.length - this.length);
      this.storage.upsert(this.strorageIndex, history);
      this.alertSub.next(resExt);
      this.historySub.next(history);
    }
  }
  summSaneAmounts(){

  }


  history$(length = 100) {
    this.length = length;
    return this.historySub.asObservable();
  }

  alerts$(value: number) {
    this.value = value;
    return this.alertSub.asObservable()
  }
}
