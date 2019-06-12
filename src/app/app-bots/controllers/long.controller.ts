import {VOBalance, VOBooks, VOOrder, VOWatchdog, WDType} from '../../amodels/app-models';
import {Subscription} from 'rxjs/internal/Subscription';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {BotBase} from '../bot-base';
import {Observable} from 'rxjs/internal/Observable';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {debounceTime, map, take} from 'rxjs/operators';
import {BTask, TaskName} from '../actions/bot-tasks';
import {Action, ControllerType, Lost, TaskController, TaskNone} from './models';
import {ApiPrivateAbstaract} from '../../a-core/apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../a-core/apis/api-public/api-public-abstract';
import {config} from 'rxjs/internal-compatibility';
import {potsDifference, selectBalanceDifference, selectPotsBuying} from './selectors';
import {UtilsBooks} from '../../acom/utils-books';
import {UTILS} from '../../acom/utils';
import {StopLossAuto, StopLossSettings} from '../stop-loss-auto';
import {SellOnJump} from '../sell-on-jump';



export class LongController implements TaskController {
  readonly type = ControllerType.START_LONG;
  active = false;
  balanceCoin: VOBalance;
  balanceBase: VOBalance;
  openOrders: VOOrder[];
  progressOrder: VOOrder;
  balanceDiff$: Observable<number>;
  buyAction$: Observable<any>;
  status: BehaviorSubject<Action> = new BehaviorSubject(new TaskNone());
  subs: Subscription[] = [];
  pots: number;


  stopLossController: StopLossAuto;
  sellOnJump: SellOnJump;

  constructor(private base: BotBase, private apiPrivate: ApiPrivateAbstaract, private apiPublic: ApiPublicAbstract) {
    console.log('%c ' + base.id + ' starting Long', 'color:red');
    let sub = base.bus.balanceCoin$.subscribe(balanceCoin => {


      this.balanceCoin = balanceCoin;
    })
    this.subs.push(sub);
    this.init();
  }


 /* async buyCoin(amount: number) {
    const market = this.base.bus.config$.getValue().market;
    let rate = this.base.bus.config$.getValue().entryPrice;
    if(!rate) {
      const books = await this.apiPublic.downloadBooks2(market).toPromise();
      rate = UtilsBooks.getRateForAmountCoin(books.sell, amount);
    }
    console.log(market + ' BUY coin ' + amount + ' rate ' + rate);

    this.apiPrivate.buyLimit2(market, amount, rate).then(res => {
      this.progressOrder = res;
      console.log(res);
      UTILS.wait(2).then(() => {
        this.apiPrivate.refreshAllOpenOrders();
      })
    })

  }*/

/*  async sellCoin(amount: number) {
    const market = this.base.bus.config$.getValue().market;
    let rate = this.base.bus.config$.getValue().entryPrice;
    if(!rate) {
      const books = await this.apiPublic.downloadBooks2(market).toPromise();
      rate = UtilsBooks.getRateForAmountCoin(books.buy, amount);
    }
    console.log(' SELL coin ' + amount + ' rate ' + rate);
    return ;
    this.apiPrivate.sellLimit2(market, amount, rate).then(res => {
      this.progressOrder = res;
    })
  }*/


  init() {
    let sub: Subscription;
    this.stopLossController = new StopLossAuto(this.apiPrivate, this.base.bus);
    this.sellOnJump = new SellOnJump(this.base.bus);

    sub = combineLatest(this.sellOnJump.state$, this.stopLossController.state$).subscribe(([selOnJump, stopLoss]) => {
      console.log(selOnJump, stopLoss);
    });



  /*  let sub = combineLatest( this.base.bus.balanceCoin$, this.base.ordersOpen$, this.base.bus.config$)
      .pipe(debounceTime(2000))
      .subscribe(([ balanceCoin, openOrders, config]) => {

        if(this.progressOrder) {
          const progresUid = this.progressOrder.uuid;
          const exists = openOrders.find(function (item) {
            return item.uuid === progresUid;
          });
          if(exists) this.progressOrder = null;
          else openOrders.push(this.progressOrder);
        }


        const prevBalance = this.balanceCoin?this.balanceCoin.balance - (config.potSize/ 10):0;
        const current = balanceCoin.balance - (config.potSize/ 10);

        if(prevBalance > 0 && current < 0) {
          this.status.next(new Lost());
          sub.unsubscribe();
          return
        }

        this.balanceCoin = balanceCoin;
        this.openOrders = openOrders;
        this.analyzeState(balanceCoin, openOrders, config);

      });
    this.subs.push(sub);

    this.stopLossController = new StopLossOrder(this.apiPrivate, this.base.bus);
    this.sellOnJump = new SellOnJump(this.base.bus);
    this.sellOnJump.state$.subscribe(state => {
      console.log(state);
    })*/
  }

  /*async analyzeState( balanceCoin: VOBalance, openOrders: VOOrder[], config: VOWatchdog) {

    const potsRequired = config.pots;
    const potsBalance = balanceCoin.balance / config.potSize;
    const potsBuying = selectPotsBuying(openOrders, config.potSize);

    const diff = potsRequired - potsBalance - potsBuying;
   //  console.log(diff);

    if(diff > 0.3) {
      console.log(' need buy coin ' + (diff * config.potSize));
      this.buyCoin(diff * config.potSize);
    } else {

    }

    console.log(balanceCoin, openOrders, config);
  }
*/

  checkState(balanceCoin: VOBalance, openOrders: VOOrder[], books: VOBooks, config: VOWatchdog) {

  }

  unsubscribe() {
    this.subs.forEach(function (item) {
      item.unsubscribe();
    })
    this.subs = [];
  }
  destroy(reason: string) {
    console.log(' destroying ' );
    this.unsubscribe();
    this.base = null;
    if(this.sellOnJump)this.sellOnJump.destroy();
    this.sellOnJump = null;
    this.apiPrivate = null;
    if(this.stopLossController)this.stopLossController.destroy();
    this.stopLossController = null;
  }

  cancel() {

  }

}
