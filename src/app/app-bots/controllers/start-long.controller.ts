import {VOBalance, VOOrder, WDType} from '../../amodels/app-models';
import {Subscription} from 'rxjs/internal/Subscription';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {BotBase} from '../bot-base';
import {Observable} from 'rxjs/internal/Observable';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {debounceTime} from 'rxjs/operators';
import {BTask, TaskName} from '../actions/bot-tasks';
import {ControllerType, TaskController} from './models';

export class StartLongController implements TaskController {
  readonly type = ControllerType.START_LONG;
  active = false;
  balanceCoin: VOBalance;
  balanceBase: VOBalance;
  openOrders: VOOrder[];
  subs: Subscription[] = [];

  status: BehaviorSubject<string> = new BehaviorSubject('NONE');
  sub;
  pots: number;

  constructor(private base: BotBase) {
    console.log('%c ' + base.id + ' starting Long', 'color:red');
    this.pots = base.bus.pots$.getValue();
    this.init();

  }


  buyCoin() {
    const status = this.status.getValue();
    if (status !== 'NONE') {
      console.log(' something in progress cant buy coin');
      return
    }

    const potsBalance = this.balanceCoin.balance / this.base.config.potSize;
    const diff = this.pots - potsBalance;
    const needCoin = diff * this.base.config.potSize;
    this.status.next('BUY_COIN ' + needCoin);
    this.base.buyCoinInstant(needCoin).then(res => {
      console.log(res);
      this.status.next('BUY_COIN_RESULT' + res)
    }).catch(err => {
      console.log(err);
      this.status.next('BUY_COIN_ERROR')
    });


  }


  init() {

    this.base.ordersOpen$.subscribe(openOrders => {
      console.log(' openOrders updated ', openOrders);
      this.openOrders = openOrders;
    });

    console.log(this);
    this.sub = combineLatest(this.base.bus.balanceBase$, this.base.bus.balanceCoin$, this.base.ordersOpen$)
      .pipe(debounceTime(100))
      .subscribe(([balanceBase, balanceCoin, openOrders]) => {
        console.log(balanceCoin, balanceBase, openOrders);
        this.balanceBase = balanceBase;
        this.balanceCoin = balanceCoin;
        this.openOrders = openOrders;
        const potsBalance = balanceCoin.balance / this.base.config.potSize;
        const diff = this.pots - potsBalance;
        console.log(' balance new  ' + potsBalance + '  need ' + this.pots+ '   diff ' + diff);
        if (diff < 0.3) {
          this.status.next('DONE');
          this.destroy();
          return;
        }

        if (openOrders.length === 0) {
          if (Math.abs(diff) > 0.3) {
            if (diff > 0) this.buyCoin()
          }
        } else {
          console.log(' some open orders in progress ')
          this.base.apiPrivate.refreshAllOpenOrders();
        }
      });
    //  this.checkStatus();


  }

  destroy() {
    console.log(' destroying ' );
    this.base = null;
    this.sub.unsubscribe();

  }

  cancel() {

  }

}
