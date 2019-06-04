import {BotBus} from '../bot-bus';
import {pairwise, take, withLatestFrom} from 'rxjs/operators';
import {WDType} from '../../amodels/app-models';
import {BTask, TaskName} from '../actions/bot-tasks';
import {ApiPrivateAbstaract} from '../../a-core/apis/api-private/api-private-abstaract';
import {BotBase} from '../bot-base';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {Subject} from 'rxjs/internal/Subject';




export class AdjustPotsLong implements BTask{
  readonly name: TaskName = TaskName.ADJUST_POTS_LONG;
  active = false;
  progress: Subject<string> = new Subject();
  constructor(public payload) {

  }

  start(bot: BotBase ) {

    combineLatest(bot.bus.potsBalance$, bot.bus.ordersOpen$).subscribe(([pots, orders]) => {
      console.log(pots, orders);
      const diff = pots - this.payload.pots1;
      const amountCoin = Math.abs(diff) * bot.config.potSize;

      console.log(diff)
      if(Math.abs(diff) > 0.3) {

        console.log(diff);
        if (diff > 0) bot.buyCoinInstant(amountCoin).then(res => {
          console.log( '  followPots BUY ', res)
        }).catch(console.error);

        else bot.sellCoinInstant(amountCoin).then(res => {
          console.log('  followPots SELL ', res)
        }).catch(console.error);
      }

      if(orders.length === 0) {


      }
    })

    console.log(this.payload);

    return this.progress;

  }
  cancel() {

  }
  destroy(): void {
  }
}
export class FromLongToShort implements BTask{
  readonly name: TaskName = TaskName.FROM_LONG_TO_SHORT;
  active = false;
  progress: Subject<string> = new Subject();
  constructor(public payload) {

  }

  start(bot: BotBase ) {

    return this.progress
  }
  cancel() {

  }

  destroy(): void {
  }

}

export class FromShortToLong implements BTask{
  readonly name: TaskName = TaskName.FROM_SHORT_TO_LONG;
  active = false;
  progress: Subject<string> = new Subject();
  constructor(public payload) {

  }

  start(bot: BotBase ) {

    return this.progress
  }
  cancel() {

  }
  destroy(): void {
  }
}
export class TurnOFFBot implements BTask{
  readonly name: TaskName = TaskName.TURN_OFF;
  active = false;
  progress: Subject<string> = new Subject();
  constructor(public payload) {

  }

  start(bot: BotBase ) {

    return this.progress
  }
  cancel() {

  }
  destroy(): void {
  }
}
export class CancelOpdersTask implements BTask {
  readonly name: TaskName = TaskName.CANCEL_ALL_ORDERS;
  active = false;
  progress: Subject<string> = new Subject();
  constructor(public payload) {

  }

  start(bot: BotBase ) {

    return this.progress;
  }
  cancel() {

  }
  destroy(): void {
  }
}

export class BuyMorePotsTask implements BTask {
  readonly name: TaskName = TaskName.BUY_MORE_POTS;
  active = false;
  progress: Subject<string> = new Subject();
  constructor(public payload) {

  }

  start(bot: BotBase ) {

    return this.progress
  }
  cancel() {

  }
  destroy(): void {
  }
}





export class SettingsController {
  constructor(private bus: BotBus) {

  }

  async init() {
    this.bus.settings$.pipe(
      pairwise(),
    ).subscribe(([[wd0, pots0],[wd1, pots1]]) => {
      if(wd1 === WDType.OFF && wd0 !== WDType.OFF) {
        this.bus.setTask(new TurnOFFBot({wd0, pots0, wd1, pots1}) )
      } else if(wd0 === WDType.LONG && wd1 === WDType.LONG) {
        if(pots0 !== pots1) this.bus.setTask(new AdjustPotsLong({wd0, pots0, wd1, pots1}))
      } else if(wd0 === WDType.LONG && wd1 === WDType.SHORT) {
       //  this.bus.setTask(new FromLongToShort({wd0, pots0, wd1, pots1}))
      } else if(wd0 === WDType.SHORT && wd1 === WDType.LONG) {
        this.bus.setTask(new FromShortToLong({wd0, pots0, wd1, pots1}))
      }  else if(wd0 === WDType.OFF && wd1 === WDType.LONG) {
        //this.bus.setTask(new StartLong({wd0, pots0, wd1, pots1}))
      }
    });
  }
}
