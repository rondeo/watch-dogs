import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Subject} from 'rxjs/internal/Subject';
import {VOBalance, VOBooks, VOOrder, WDType} from '../amodels/app-models';
import {Observable} from 'rxjs/internal/Observable';
import {debounceTime, filter, map} from 'rxjs/operators';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';


enum StopLossState {
  OFF,
  NEED,
  SET,
  DUAL,
  SETTING
}




export class BotBus {

  static filterStopLosses(orders: VOOrder[]) {
    return orders.filter(function (item: VOOrder) {
      return item.stopPrice;
    });
  }
  static stopLossStatus([wdType, openOrders]) {
    switch (wdType) {
      case WDType.LONG:
        const stopLossesOrders = BotBus.filterStopLosses(openOrders);
        if(stopLossesOrders.length > 1) return StopLossState.DUAL;
        if(stopLossesOrders.length === 1) return  StopLossState.SET;
        return StopLossState.NEED;
      default:
        return StopLossState.OFF
    }
  }

  mas$: BehaviorSubject<{last: number, ma3: number, ma7: number, ma25: number, ma99: number }> = new BehaviorSubject(null);

  wdType$: BehaviorSubject<WDType> = new BehaviorSubject(null);
  state$: BehaviorSubject<string> = new BehaviorSubject(null);
  error$: Subject<string> = new Subject();

  priceInit$: BehaviorSubject<number> = new BehaviorSubject(0);


  pots$: BehaviorSubject<number> = new BehaviorSubject(-1);
  potsBalance$: Observable<number>;

  bookToBuy$: Observable<number>;
  bookToSell$: Observable<number>;

  books$: BehaviorSubject<VOBooks> = new BehaviorSubject(null);

  stopLossState$: Observable<StopLossState>;

  stopLossOrder$: Observable<VOOrder>;

  priceStop$: Observable<number>;


  balanceCoin$: BehaviorSubject<VOBalance> = new BehaviorSubject(null)

  ordersOpen$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);
  ordersHistory$: BehaviorSubject<VOOrder[]> = new BehaviorSubject([]);

  constructor(public id: string) {
  //  this.wdType$.subscribe(console.warn);

    this.stopLossOrder$ = this.ordersOpen$.pipe(
      // filter(v => !!v),
      map(BotBus.filterStopLosses),
      map(orders => orders.length?orders[0]: null)
    );

    this.stopLossState$ = combineLatest(this.wdType$,this.ordersOpen$)
      .pipe(debounceTime(1000), map(BotBus.stopLossStatus));
    this.stopLossState$.subscribe(res => {
      console.warn(this.id, res);
    })
      //.pipe(map( wd => wd === WDType.LONG?StopLossState.ON: StopLossState.OFF));


    this.priceStop$ = this.ordersOpen$.pipe(map(orders => {
      if(!orders) return 0;

      const stopLosses = orders.filter(function (item) {

      })

    }))
  }



}
