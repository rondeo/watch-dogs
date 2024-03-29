import {VOCandle} from '../amodels/api-models';
import {CandlesAnalys1} from '../a-core/app-services/scanner/candles-analys1';
import * as _ from 'lodash';
import {MATH} from '../acom/math';
import * as moment from 'moment';
import {CandlesService} from '../a-core/app-services/candles/candles.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

import {distinctUntilChanged} from 'rxjs/operators';
import {MarketState} from '../a-core/app-services/alerts/btc-usdt.service';
import {BuySellState} from './models';
import {BotBus} from './bot-bus';
import {VOWatchdog} from '../amodels/app-models';
import {CandlesUtils} from '../a-core/app-services/candles/candles-utils';
import {Subscription} from 'rxjs/internal/Subscription';


export enum Status {
  NONE='NONE',
  GOING_UP='GOING_UP',
  GOING_DOWN='GOING_DOWN',
  JUMPING='JUMPING',
  SELL_ON_JUMP = 'SELL_ON_JUMP'
}

export class SellOnJumpState {
  constructor(public type: Status, public payload: number[]) {

  }
}

export class SellOnJump {

  private _state:BehaviorSubject<SellOnJumpState>;
  private subs: Subscription[] = [];
  get state$(){
    return this._state.asObservable().pipe(distinctUntilChanged())
  }
  get state(){
    return this._state.getValue();
  }
  reason: string;
  private prev:number;

  config: VOWatchdog;
  constructor(
    private bus: BotBus
  ) {

    bus.config$.subscribe(config => this.config = config);
    this._state = new BehaviorSubject(new SellOnJumpState(Status.NONE, []));
    this.init();
  }


  init(){

   const sub = this.bus.closes$.subscribe(closes5m =>{
      const closes = closes5m; // CandlesUtils.convertCloses5mTo15min(closes5m);
      const mas = CandlesUtils.mas(closes);
      const ma3_7 = MATH.percent(mas.ma3, mas.ma7);
      this.reason = ' ma3_7 ' + ma3_7 + '  prev ' + this.prev;
      console.log(this.reason);

      if(ma3_7 > 3) this._state.next(new SellOnJumpState(Status.JUMPING, [ma3_7]));
      else this._state.next(new SellOnJumpState(Status.NONE, []));

      if(this.state.type === Status.JUMPING){
        if(this.prev > ma3_7) {
          this._state.next(new SellOnJumpState(Status.SELL_ON_JUMP, [ma3_7, this.prev]));
        }
      }
      this.prev = ma3_7;
    });
    this.subs.push(sub);
  }

  log(log: {action: string, reason: string}){
   //  console.log(this.market , log);
  }
  private timeJump;

  static isJumpEnd(candles: VOCandle[]) {
    const last = _.last(candles);
    const closes = CandlesAnalys1.closes(candles);

    /*const last4 = _.takeRight(candles, 4);

    const ocs4 = CandlesAnalys1.oc(last4);
    const minLast4OCs = _.min(ocs4);
    const minLast4 = _.min(last4);
    const lastOC = _.last(ocs4);
    const position = MATH.percent(lastOC, minLast4OCs);

    console.log('  position ' + position);*/

    const ma3 = _.mean(_.takeRight(closes, 3));
    const ma7 = _.mean(_.takeRight(closes, 7));
    const ma25 = _.mean(_.takeRight(closes, 25));

    const ma3_7D = MATH.percent(ma3, ma7);
    const ma3_25D = MATH.percent(ma3, ma25);
    const ma7_25D = MATH.percent(ma7, ma25);

    console.log(moment(last.to).format('HH:mm') + ' ma3-7D  ' + ma3_7D + ' ma3_25D ' + ma3_25D + ' ma7_25D  ' + ma7_25D);
    if (ma3_7D < -1 && Math.abs(ma3_7D) > ma7_25D) {
      console.warn(' sell coin');
      return true;
    }
    // const medianPrice = MATH.median(_.takeRight(closes, 7));

    // const prevPrice = _.mean(closes.slice(closes.length -4, closes.length -2));
    //  const priceChange = MATH.percent(lastPrice, medianPrice);


  }


  sellOnSecondMax() {

  }

  sellCoin() {

  }

  isJump(candles: VOCandle[]): boolean {
    const prices = CandlesAnalys1.closes(candles);
    const closes = _.map(candles, 'close');
    const lastPrice = _.last(prices);

    const last = _.last(candles);
    // const medianPrice = MATH.median(_.takeRight(closes, 7));
    const ma7 = _.mean(_.takeRight(prices, 7));
    const ma25 = _.mean(_.takeRight(prices, 25));
    // const prevPrice = _.mean(closes.slice(closes.length -4, closes.length -2));
    //  const priceChange = MATH.percent(lastPrice, medianPrice);
    const ma3 = _.mean(_.takeRight(closes, 3));

    const ma3_7 = MATH.percent(ma3, ma7);
    const ma3_25 = MATH.percent(ma3, ma25);
    const ma7_25 = MATH.percent(ma7, ma25);
    // console.log(change1, change2);
    let message = ' jump  ma3_7  ' + ma3_7 + '  ma3_25 ' + ma3_25 + ' ma7_25 ' + ma7_25 + ' close ' + last.close;

    if (this.timeJump && ma7_25 < 0) {
      //this.log(' TOO LATE ' + message);
      this.timeJump = 0;
      return false;
    }

    if (ma3_25 > 4) {
      //this.log(' JUMP > 4 ');
      this.timeJump = moment(last.to).valueOf();
    }

    if (!this.timeJump) return false;
    const dur = moment(last.to).diff(this.timeJump, 'minutes');
    //this.log(message);
    if (dur > 20) {
     // this.log(' RESETTING JUMP by duration > ' + dur);
      this.timeJump = 0;
      return false;
    }

    if (ma3_7 < -1 && Math.abs(ma3_7) > ma7_25) {
      //this.log(' jump DOWN => SELL  ma3_7D < -1 && Math.abs(ma3_7D) > ma7_25D)');

    } else {
      //this.log(' jump continue ');
    }

    return true;

  }

  unsubscribe() {
    this.subs.forEach(function (item) {
      item.unsubscribe();
    })
    this.subs = [];
  }

  destroy() {
    this.unsubscribe();
    this.bus = null;
  }
}
