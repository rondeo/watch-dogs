import {BotBus} from '../bot-bus';
import {ApiPrivateAbstaract} from '../../a-core/apis/api-private/api-private-abstaract';
import {Action, ControllerType, TaskController, TaskDone, TaskName, TaskNone} from './models';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Subscription} from 'rxjs/internal/Subscription';
import {VOWatchdog} from '../../amodels/app-models';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';

export class BuyCoinController implements TaskController{

  type : ControllerType;
  status: BehaviorSubject<Action> = new BehaviorSubject(new TaskNone());
  private subs: Subscription[] = [];
  private config: VOWatchdog;
  constructor(private bus: BotBus, private apiPrivate: ApiPrivateAbstaract) {
    bus.config$.subscribe(cfg => this.config = cfg);
    this.init();

  }

  private init() {

    console.log(this.config.id + ' creating Buy Controller ');
   let sub =  combineLatest(this.bus.pots$, this.bus.potsBalance$, this.bus.balanceCoin$).subscribe(([pots, potsbalance, balanceCoin]) => {
      const diff = pots - potsbalance;
      if(Math.abs(pots - potsbalance) < 0.1) {
        this.status.next(new TaskDone(balanceCoin));
      }
    });
   this.subs.push(sub);

    this.bus.balanceCoin$.subscribe(balanceCoin => {


    })


  }

  private subscribe() {

  }

  private unsubscribe() {
    this.subs.forEach(function (item) {
      item.unsubscribe()
    })
    this.subs = [];
  }

  destroy(reason: string): void {
    this.unsubscribe();


  }
}
