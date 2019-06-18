import {VOBalance, VOWatchdog, WDType} from '../../amodels/app-models';
import {Subscription} from 'rxjs/internal/Subscription';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {pairwise, withLatestFrom} from 'rxjs/operators';
import {StopLossAuto} from '../stop-loss-auto';

import {BotBus} from '../bot-bus';
import {BuySellCommands} from './buy-sell.commands';
import {JumpSignal, JumpStatus} from '../jump-signal'
import {SellCoinController, SellingSignal} from './sell-coin.controller';
import {RsiMacdSignal} from './rsi-macd.signal';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';


export enum LongSignal {
  NONE = '[LongSignal] NONE',
  DONE = '[LongSignal] DONE',
  SELLING_ON_JUMP = '[LongSignal] SELLING_ON_JUMP'
}

export class LongController {

  subs: Subscription[] = [];
  config: VOWatchdog;
  stopLossController: StopLossAuto;
  jumpSignal: JumpSignal;
  rsiMacdSignal:RsiMacdSignal;
  sellCoinController: SellCoinController;
  signal$: BehaviorSubject<LongSignal> = new BehaviorSubject(LongSignal.NONE);

  constructor(private bus: BotBus, private commands: BuySellCommands) {
    console.log('%c ' + bus.id + ' starting Long', 'color:red');

   const sub  = bus.config$.subscribe(cfg => this.config = cfg);
   this.subs.push(sub);
    if(this.config.wdType !==WDType.LONG) throw new Error( ' not my type');
    this.init();
  }

  init() {
    let sub: Subscription;
    this.stopLossController = new StopLossAuto(this.bus, this.commands);
    sub = this.stopLossController.signal$.subscribe(signal => console.log(this.config.id + signal));
    this.subs.push(sub);

   // this.jumpSignal = new JumpSignal(this.bus);
    //sub = this.jumpSignal.stoch$.subscribe( signal => this.onJumpSignal(signal));
    // this.subs.push(sub);

   sub =  this.bus.pots$.pipe(withLatestFrom(this.bus.potsBalance$))
     .subscribe( ([pots, potsBalance]) => this.onPotsChange(pots, potsBalance));
    this.subs.push(sub);

    sub = this.bus.balanceCoin$.pipe(pairwise())
      .subscribe(([balanceOld, balanceCoin]) => this.onBalance(balanceOld, balanceCoin));
    this.subs.push(sub);

    this.rsiMacdSignal = new RsiMacdSignal(this.bus);

    sub = combineLatest(this.rsiMacdSignal.stoch$, this.rsiMacdSignal.macd$).subscribe(([rsi,macd]) =>{
      console.log(this.config.id,rsi,macd)
    });
    this.subs.push(sub);

   sub = this.rsiMacdSignal.stoch$.subscribe(signal => {
     // console.log(this.config.id + signal);
      if(signal == RsiMacdSignal.RSI_SELL) {
        if(this.jumpSignal) this.jumpSignal.destroy();
        this.jumpSignal = null;
        if(this.stopLossController)  this.stopLossController.destroy();
        this.sellCoinController = null;
        this.rsiMacdSignal.destroy(' selling coin');
        if(this.sellCoinController) this.sellCoinController.destroy(' re-init ');

        /////////////// selling coin ////////////////////////

        if(!this.sellCoinController) {
          this.sellCoinController = new SellCoinController(this.bus, this.commands);
          sub = this.sellCoinController.signal$.subscribe(signal => {
            console.log(this.config.id + signal);
            if(signal === SellingSignal.DONE) this.signal$.next(LongSignal.DONE);
          });
          this.subs.push(sub);
        }

      }
    })
    this.subs.push(sub);
  }


  async onPotsChange(pots: number, potsBalance: number) {
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
      console.log(this.config.id + ' orders sent ');

    }
  }

  async onJumpSignal (signal) {
    console.log(this.config.id + signal);
    if(signal === JumpStatus.SELL_ON_JUMP) {
      if (this.stopLossController) {
        this.stopLossController.destroy();
      }

      await this.commands.cancelOrdersPromise(this.bus.openOrders);
      let available = this.bus.balanceCoin.available;
      const market = this.config.market;
      await this.commands.sellCoinInstant(market, available);
      if(this.bus.balanceCoin.balance === 0) this.signal$.next(LongSignal.DONE);
      else {
        console.log('% ERROR sell on JUMP FAST' )
      }
    }
  }

  onBalance(balanceOld: VOBalance, balanceCoin: VOBalance) {
    if(balanceOld.balance && !balanceCoin.balance) {
      this.signal$.next(LongSignal.DONE);
    }
  }

  unsubscribe() {
    this.subs.forEach(function (item) {
      item.unsubscribe();
    })
    this.subs = [];
  }

  destroy(reason: string) {
    console.log(this.config.id + ' destroying  long ' + reason);
    this.unsubscribe();
    this.bus = null;
    if (this.jumpSignal) this.jumpSignal.destroy();
    this.commands = null;
    if (this.stopLossController) this.stopLossController.destroy();
    this.stopLossController = null;
    if(this.sellCoinController) this.sellCoinController.destroy('destroy all');
    this.sellCoinController = null;
  }

  cancel() {

  }

}
