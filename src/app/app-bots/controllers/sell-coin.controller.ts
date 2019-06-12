import {Action, ControllerType, NeedSell, SellOrderSet, SetSellOrder, TaskController, TaskDone, TaskName, TaskNone} from './models';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {BotBus} from '../bot-bus';
import {ApiPrivateAbstaract} from '../../a-core/apis/api-private/api-private-abstaract';
import {Subscription} from 'rxjs/internal/Subscription';
import {VOBalance, VOWatchdog} from '../../amodels/app-models';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {cancelOrders} from './cancel-orders';
import {Observable} from 'rxjs/internal/Observable';
import {UtilsBooks} from '../../acom/utils-books';


export class SellCoinController implements TaskController{
  type : ControllerType = ControllerType.LONG_TO_SHORT;
  status: BehaviorSubject<Action> = new BehaviorSubject(new TaskNone());
  config: VOWatchdog;
  subs: Subscription[] = [];
  constructor(private bus: BotBus, private apiPrivate: ApiPrivateAbstaract) {
   bus.config$.subscribe(cfg => this.config = cfg);
   this.init();
  }

  init() {
    console.log(this.config.id +  ' LongToShortController  ');
    this.bus.balanceCoin$.subscribe(balanceCoin => {
      if(balanceCoin.balance < this.config.potSize / 5) {
        setTimeout(() => this.status.next(new TaskDone(balanceCoin)), 100);
      } else {
        this.subscribe();
        if(balanceCoin.available && (balanceCoin.available> this.config.potSize / 5))  this.status.next(new NeedSell(balanceCoin.available));
        else {

          console.log('waiting for availabele to sell');

        }

      }
    });
  }

  subscribe() {
    if(this.subs.length || !this.bus) return;
    let sub = this.bus.stopLossOrders$.subscribe(stopLosses => {
      if(stopLosses.length) cancelOrders(stopLosses, this.apiPrivate);
    });
    this.subs.push(sub);

    sub = combineLatest(this.status, this.bus.candles$).subscribe(([status, candles]) => {
      console.log(candles);
      if(status.type !== TaskName.NEED_SELL) return;
      let price = candles[candles.length -1].close;
      const amountCoin = status.payload;
      this.apiPrivate.downloadBooks(this.config.market, 10).then(books => {

        price = UtilsBooks.getRateForAmountCoin(books.sell, amountCoin);
        this.status.next(new SetSellOrder({price, amountCoin}));
      })

      console.log(status, price);

    //   this.status.next(new SetSellOrder({price, amountCoin}));
    })
    this.subs.push(sub);

    sub = (this.status as Observable<SetSellOrder>).subscribe( status => {
      if(status.type !== TaskName.SET_SELL_ORDER) return;
      console.log(' SELLING COIN ' );

      this.apiPrivate.sellLimit2(this.config.market, status.payload.amountCoin, status.payload.price).then(res => {
        this.status.next(new SellOrderSet(res));
        this.bus.addOrder(res);
        this.apiPrivate.refreshAllOpenOrders();
      }).catch(console.log);

    })
  }

  unsubscribe() {
    this.subs.forEach(function (item) {
      item.unsubscribe();
    });
  }

  destroy(reason: string): void{
   this.unsubscribe();
    this.apiPrivate = null;
    this.bus = null;
  }

}
