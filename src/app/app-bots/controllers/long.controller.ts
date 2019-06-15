import {VOBalance, VOBooks, VOOrder, VOWatchdog, WDType} from '../../amodels/app-models';
import {Subscription} from 'rxjs/internal/Subscription';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {BotBase} from '../bot-base';
import {Observable} from 'rxjs/internal/Observable';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {debounceTime, map, take, withLatestFrom} from 'rxjs/operators';
import {BTask, TaskName} from '../actions/bot-tasks';
import {Action, ControllerType, Lost, NeedBuy, NeedSell, TaskController, TaskNone} from './models';
import {ApiPrivateAbstaract} from '../../a-core/apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../a-core/apis/api-public/api-public-abstract';
import {config} from 'rxjs/internal-compatibility';
import {potsDifference, selectBalanceDifference, selectPotsBuying} from './selectors';
import {UtilsBooks} from '../../acom/utils-books';
import {UTILS} from '../../acom/utils';
import {StopLossAuto, StopLossSettings} from '../stop-loss-auto';

import {BotBus} from '../bot-bus';
import {BuySellCommands} from './buy-sell.commands';
import {JumpSignal} from '../jump-signal'


export enum LongSignal {
  NONE = '[LongSignal] NONE',
  DONE = '[LongSignal] DONE'
}

export class LongController {

  subs: Subscription[] = [];
  config: VOWatchdog;
  stopLossController: StopLossAuto;
  jumpSignal: JumpSignal;
  signal$: BehaviorSubject<LongSignal> = new BehaviorSubject(LongSignal.NONE);

  constructor(private bus: BotBus, private commands: BuySellCommands) {
    console.log('%c ' + bus.id + ' starting Long', 'color:red');
    bus.config$.subscribe(cfg => this.config = cfg);
    this.init();
  }

  init() {

    this.stopLossController = new StopLossAuto(this.bus, this.commands);
    this.jumpSignal = new JumpSignal(this.bus);

    this.bus.pots$.pipe(withLatestFrom(this.bus.potsBalance$)).subscribe(async ([pots, potsBalance]) => {
      const need = pots - potsBalance;
      console.log(need);
      if (Math.abs(need) > 0.3) {
        let amountCoin = need * this.config.potSize;
        const market = this.config.market;
        if (need > 0) {
          await this.commands.buyCoinInstant(market, amountCoin);
        } else {
          /////////////////// cancel stop loss and sell after///////////////////////
          amountCoin = Math.abs(amountCoin);
          if (this.stopLossController) {
            await this.stopLossController.cancelAndStop();
          }

          await this.commands.sellCoinInstant(market, amountCoin);
          if (this.stopLossController) this.stopLossController.resume()
        }
        console.log(' orders sent ');

      }
    });

    this.jumpSignal.signal$.subscribe(signal => {
      console.log(signal)
    })
  }


  unsubscribe() {
    this.subs.forEach(function (item) {
      item.unsubscribe();
    })
    this.subs = [];
  }

  destroy(reason: string) {
    console.log(' destroying ');
    this.unsubscribe();
    this.bus = null;
    if (this.jumpSignal) this.jumpSignal.destroy();
    this.commands = null;
    if (this.stopLossController) this.stopLossController.destroy();
    this.stopLossController = null;
  }

  cancel() {

  }

}
