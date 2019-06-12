import {
  Action,
  BuyOrderSet,
  ControllerType,
  SetBuyOrder,
  Shorting,
  TaskController,
  TaskDone,
  TaskName,
  TaskNone,
  TimeToBuy
} from './models';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {BotBus} from '../bot-bus';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {ApiPrivateAbstaract} from '../../a-core/apis/api-private/api-private-abstaract';
import {Subscription} from 'rxjs/internal/Subscription';
import {CandlesUtils} from '../../a-core/app-services/candles/candles-utils';
import {StochasticRSI} from '../../trader/libs/techind';
import {VOWatchdog} from '../../amodels/app-models';
import {filter, withLatestFrom} from 'rxjs/operators';


export class ShortController  implements TaskController {
  type: ControllerType = ControllerType.SORT;
  status: BehaviorSubject<Action> = new BehaviorSubject(new TaskNone());
  config: VOWatchdog;
  private subs: Subscription[] = [];
  constructor(private bus: BotBus, private apiPrivate: ApiPrivateAbstaract) {
    console.log('%c ' + bus.id + ' ShortController ', 'color:red');
    bus.config$.subscribe(config => this.config = config);
   this.init();
  }


  init() {

    console.log('%c STARTING SHORT ' + this.bus.market, 'color:red');
    let sub =  this.bus.candles$.subscribe(candles5m => {
      const status = this.status.getValue();
      if(status.type !== TaskName.SHORTING) return;

      const closes5m = CandlesUtils.closes(candles5m);
      const closes15m = CandlesUtils.convertCloses5mTo15min(closes5m);

     // const closes30m =  CandlesUtils.convertCloses5mto30min(closes5m);

      const input = {
        values: closes15m,
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3
      };

      const stochRSI = new StochasticRSI(input);
      const results: {stochRSI: number, k: number, d: number}[] = stochRSI.getResult();

      const lastStoch = results[results.length -1];
      const preLastStoch = results[results.length -2];

      console.log('%c ' + preLastStoch.d + '   ' + lastStoch.d, 'color:red');
      console.log('%c ' + preLastStoch.k + '   ' + lastStoch.k, 'color:blue');
      if(preLastStoch.d > preLastStoch.k &&  lastStoch.d < lastStoch.k ) {
        console.log('%c  ' + this.config.id +  ' BUY ', 'color:red');
        this.status.next(new TimeToBuy('STOCH'));
      }
      /*
       const macd30m  = CandlesUtils.macd(closes30m);
       const last = macd30m[macd30m.length - 1];
       const preLast = macd30m[macd30m.length - 2];

        if(last.histogram > 0 && preLast.histogram < 0) {
          this.status.next('BUY_NOW');
        } if(last.histogram < 0 && preLast.histogram > 0) {
          this.status.next('SELL_NOW');
        } else if(last.histogram > preLast.histogram) {
          this.status.next('GOING_UP');
        } else {
          this.status.next('GOING_DOWN')
        }
  */

    });

    this.subs.push(sub);

    sub = combineLatest(this.bus.balanceCoin$, this.bus.ordersOpen$).subscribe(([balanceCoin, openOrders]) => {
      if(openOrders.length) {
        console.log(' have open orders ', openOrders);
        return
      }
      const config: VOWatchdog = this.config;
      const needToBuy =  (config.pots * config.potSize) - balanceCoin.balance;


      if(needToBuy < (config.potSize / 5)) {
        console.log(this.config.id + ' balance complete ' + needToBuy);
        this.status.next(new TaskDone(balanceCoin));
      } else this.status.next(new Shorting());
    });
    this.subs.push(sub);


////////////////////////////////// time to buy/
    const timeToBuy = this.status.pipe(filter(state => state.type === TaskName.TIME_TO_BUY));

    sub = timeToBuy.pipe(withLatestFrom(this.bus.balanceCoin$, this.bus.ordersOpen$, this.bus.candles$))
      .subscribe(([status, balanceCoin, openOrders, candles]) => {

      if(openOrders.length) {
          console.log(this.config.id + ' some orders in progress EXIT');
          return
       }
      const config: VOWatchdog = this.config;
      const amountCoin =  (config.pots * config.potSize) - balanceCoin.balance;
      const price = candles[candles.length -1].close;
      this.status.next(new SetBuyOrder({amountCoin, price}));

    });
    this.subs.push(sub);

    sub = this.status.pipe(filter(s => s.type === TaskName.SET_BUY_ORDER))
      .subscribe((task: SetBuyOrder) => {
        console.log(task);
        console.log(' SENDING BUY ORDER');
      this.apiPrivate.buyLimit2(this.config.market, task.payload.amountCoin, task.payload.price).then(res => {
        this.status.next(new BuyOrderSet(res));
        this.bus.addOrder(res);
      })
    })


  /*  sub = this.status.pipe(withLatestFrom(this.bus.balanceCoin$, this.bus.ordersOpen$)).subscribe(([status, balanceCoin, openOrders]) => {
      console.log(status, balanceCoin, openOrders);
      if(status.type === TaskName.SHORTING) {
        if(openOrders.length) {
          console.log(this.config.id + ' some orders in progress EXIT');
          return
        }

        console.log(' BUYING COIN ')
        const config: VOWatchdog = this.config;
        const needToBuy =  (config.pots * config.potSize) - balanceCoin.balance;

        let rate;
        this.apiPrivate.downloadBooks(this.config.market, 10).then(books => {
          rate = UtilsBooks.getRateForAmountCoin(books.sell, needToBuy);
          UTILS.wait(5).then(() => {

            this.apiPrivate.buyLimit2(this.config.market, needToBuy, rate).then(order => {
              console.log('RESULT ', order);
              this.bus.addOrder(order);
              UTILS.wait(10).then(() => {
                this.apiPrivate.refreshAllOpenOrders();
              })
            })
          })
        })
      }
    });
    this.subs.push(sub);*/
  }

 //  sellSub;

/*  startSell() {

    this.sellSub = combineLatest(this.bus.balanceCoin$, this.bus.ordersOpen$).subscribe(([balanceCoin, openOrders]) => {
      console.log(balanceCoin, openOrders);
      if(openOrders.length) {

        console.log(this.bus.market + ' orders in progress ' );


      } else {

        if(balanceCoin.pending) {
          console.log(' ERROR SOME BALANCE IS PENDING ');
          this.apiPrivate.refreshAllOpenOrders();
        } else {
          const available: number = balanceCoin.available;
          if(available && (available > this.bus.min)) {
            this.sellAvailable(available);
          } else {
            setTimeout(() =>  sub.unsubscribe(), 50)
            this.startShort();
          }

        }

      }
    });


  }

  stopSell() {

  }*/

 /* sellAvailable(available) {
   const sub =  this.bus.books$.subscribe(books => {
      if(!books) this.apiPrivate.downloadBooks(this.bus.market, 10).then(books => {
        this.bus.books$.next(books);
      });
      else {
        const sell = UtilsBooks.getRateForAmountCoin( books.sell, available);
        this.apiPrivate.sellLimit2(this.bus.market, available, sell).then((sellOrder) => {
          console.log(this.bus.market + '  sellOrder  ', sellOrder );
        })
      }
    });
    setTimeout(() => sub.unsubscribe(), 100);
  }
*/



  destroy(): void {

    this.subs.forEach(function (sub) {
      sub.unsubscribe();
    });

    this.bus = null;
    this.apiPrivate = null;
  }

}
