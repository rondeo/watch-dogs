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
import {BuySellCommands} from './buy-sell.commands';


export enum SellingSignal {
  NONE = '[SellingSignal] NONE',
  DONE = '[SellingSignal] DONE'
}

export class SellCoinController{
  signal$: BehaviorSubject<SellingSignal> = new BehaviorSubject(SellingSignal.NONE);
  config: VOWatchdog;
  subs: Subscription[] = [];
  timeout
  constructor(private bus: BotBus, private commands: BuySellCommands) {
   bus.config$.subscribe(cfg => this.config = cfg);
   this.init();
   this.sellCoin();
  }

  init() {
    let sub = this.bus.balanceCoin$.subscribe(balanceCoin => {
      console.log(balanceCoin);
      if(balanceCoin.balance === 0) this.signal$.next(SellingSignal.DONE);
      else this.sellCoin();
    })

  }

  async sellCoin() {
    clearTimeout(this.timeout);

    await this.commands.cancelOrdersPromise(this.bus.openOrders);

    const market = this.config.market;
    const available = this.bus.balanceCoin.available;
    try {
      await this.commands.sellCoinInstant(market, available);
    } catch (e) {
     this.timeout = setTimeout(() => this.sellCoin(), 20e3);
    }


  }

  unsubscribe() {
    this.subs.forEach(function (item) {
      item.unsubscribe();
    });
    this.subs = []
  }

  destroy(reason: string): void{
    console.log(reason);
   this.unsubscribe();
    this.commands = null;
    this.bus = null;
  }

}
