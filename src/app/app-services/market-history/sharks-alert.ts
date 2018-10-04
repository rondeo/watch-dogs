import {Subject} from 'rxjs/Subject';
import {VOOrderExt, VOOrder} from '../../models/app-models';
import {StorageService} from '../../services/app-storage.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import * as _ from 'lodash';

export enum BuySellType {
  NONE = 'NONE',
  SELL_WEAK = 'SELL_WEAK',
  SELL_OK='SELL_OK',
  BUY_WEAK = 'BUY_WEAK',
  BUY_OK = 'BUY_OK',
  SELL_STRONG = 'SELL_STRONG',
  BUY_STRONG = 'BUY_STRONG'
}

export interface SignalBuySell {
  rate: number,
  type: BuySellType
}

export class SharksAlert {
  alertSub: Subject<VOOrderExt[]> = new Subject();
  historySub: BehaviorSubject<VOOrderExt[]> = new BehaviorSubject(null);
  signalBuySellSub: Subject<SignalBuySell> = new Subject();
  value: number;
  length: number;
  private strorageIndex: string;

  constructor(public exchange: string, public market: string, private storage: StorageService) {
    this.strorageIndex = 'SharksAlert-history-' + exchange + '_' + market;
    // storage.select(this.strorageIndex).then(res => this.historySub.next(res));
  }

  next(newOrders: VOOrder[], overlap: number) {
    overlap = Math.round(overlap / 1000);
    // console.log('new orders '+ newOrders.length)
    // console.log(this.value);
    const indexed = {};
    newOrders.forEach(function (item) {
      const id = item.action + item.amountCoin;
      const exists = indexed[id];
      if (!exists) {
        indexed[id] = Object.assign({overlap: overlap, orders: 1}, item)
      } else {
        exists.orders++;
      }
    });


    let res = Object.values<VOOrderExt>(indexed).filter(function (item: VOOrderExt) {
      return item.amountCoin > this.v || (item.orders * item.amountCoin) > this.v;
    }, {v: this.value});

    const resExt: VOOrderExt[] = res;
    // console.log(res);
    this.alertSub.next(resExt);
    this.analizeSignal(resExt);
    // console.log(res)

    /*const resExt: VOOrderExt[] = res.map(function (item) {
      return Object.assign({overlap: overlap}, item)
    })*/

    //let history = this.historySub.getValue() || [];
    //if (resExt.length) {
    /// history = _.uniqBy(history.concat(resExt), 'uuid');
    // if (history.length > this.length) history = history.slice(history.length - this.length);
    // this.storage.upsert(this.strorageIndex, history);

    // this.historySub.next(history);
    // }
  }


  dispatchSignal(type: BuySellType, orders: VOOrderExt[]) {
    orders = _.orderBy(orders, 'rate');
    const mid = Math.floor(orders.length / 2);
    const rate = orders[mid].rate;
    this.signalBuySellSub.next({
      type,
      rate
    });
  }

  async analizeSignal(orders: VOOrderExt[]) {
    await Promise.resolve();
    let buy = orders.filter(function (o) {
      return o.action === 'BUY';
    });
    let sell = orders.filter(function (o) {
      return o.action === 'SELL'
    });
    const diff = buy.length - sell.length;

    let rate: number;
    let signal;

    if (diff > 4) {
      this.dispatchSignal(BuySellType.BUY_STRONG, buy);
    } else if (diff < -4) {
      this.dispatchSignal(BuySellType.SELL_STRONG, sell);

    } else if (diff > 1) {
      this.dispatchSignal(BuySellType.BUY_OK, buy);

    } else if (diff < -1) {
      this.dispatchSignal(BuySellType.SELL_OK, sell);
    }  else if (diff > 0) {
      this.dispatchSignal(BuySellType.BUY_WEAK, buy);

    } else if (diff < 0) {
      this.dispatchSignal(BuySellType.SELL_WEAK, sell);
    }

  }

  signalBuySell$() {
    return this.signalBuySellSub.asObservable();
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
