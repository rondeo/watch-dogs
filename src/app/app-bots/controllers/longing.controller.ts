import {BotBase} from '../bot-base';
import {BotBus} from '../bot-bus';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Subscription} from 'rxjs/internal/Subscription';
import {StopLossOrder, StopLossSettings} from '../stop-loss-order';
import {VOWatchdog} from '../../amodels/app-models';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {ControllerType, TaskController} from './models';


export class LongingController implements TaskController {
  
  type: ControllerType = ControllerType.LONGING;
  bus: BotBus;
  status: BehaviorSubject<string> = new BehaviorSubject(null);
  subs: Subscription[] = [];
  config: VOWatchdog;
  stopLossController: StopLossOrder;
  settings: StopLossSettings = {
    stopLossPercent: -3,
    sellPercent: -2,
    resetStopLossAt: 3,
    disabled: false
  }

  constructor(private base: BotBase) {
    console.log(base);
    this.bus = base.bus;
    this.init()
  }

  init() {
    console.log(this.bus);
    this.config = this.bus.config$.getValue();
    this.config.stopLoss = Object.assign(this.settings, this.config.stopLoss);

    let sub = this.bus.potsBalance$.subscribe(potsBalance => {
      if (potsBalance === 0) {
        this.status.next('LOST');
        this.destroy()
      } else {
        /*
               console.log(this.config);
               if(!this.config.stopLoss.disabled) {
                 this.stopLossController = new StopLossOrder(this.config.market, this.config.stopLoss, this.base.apiPrivate, this.base.bus);
               }*/
      }
    });

    this.subs.push(sub);

    if(!this.bus) return;
    console.log(this.bus);

    sub = this.bus.config$.subscribe(config => {
      console.log(config);
      if (config.stopLoss.disabled) {
        if (this.stopLossController) {
          this.stopLossController.destroy();
          this.stopLossController = null;
        }
      } else {
        if (!this.stopLossController)
          this.stopLossController = new StopLossOrder(this.config.market, this.config.stopLoss, this.base.apiPrivate, this.base.bus);
      }
    });

    this.subs.push(sub);
  }


  destroy() {
    this.bus = null;
    this.base = null;
    this.subs.forEach(function (item) {
      item.unsubscribe();
    });
    if (this.stopLossController) this.stopLossController.destroy();
  }
}
