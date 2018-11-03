import {FollowOpenOrder} from '../../apis/open-orders/follow-open-order';
import {VOCandle} from '../../models/api-models';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import * as moment from 'moment';

export class SellOnJump {
  private timeJump;
  private market:string
  constructor(private main:FollowOpenOrder) {

    this.market = main.market;
  }



  isJump(candles: VOCandle[]): boolean{

    const closes = CandlesAnalys1.closes(candles);
    const lastPrice = _.last(closes);
    const last = _.last(candles);

    const medianPrice = MATH.median(_.takeRight(closes, 7));
    // const prevPrice = _.mean(closes.slice(closes.length -4, closes.length -2));

    const priceChange = MATH.percent(lastPrice, medianPrice);

    if(priceChange > 2){
      this.timeJump = moment(last.to).valueOf();
    }

    if(!this.timeJump) return false;


    const dur = moment(last.to).diff(this.timeJump, 'minutes');


    FollowOpenOrder.status.next(this.market + ' was isJump   '+ dur +' min ago');
      if( dur > 30){
        this.timeJump = 0;
        return false;
      }

    candles = _.takeRight(candles, 7);
    const max = _.max(closes);
    const min = _.min(closes);
    const avg = (max + min) /2;
    const lastRange = (last.high + last.low)/2 ;
    const change = MATH.percent(lastRange, avg);
    let message = this.market + ' selling coin on jump ' + change;
    this.main.log(message);
    FollowOpenOrder.status.next(message);
    if(change < 0) {
      this.main.sellCoin();
    } else {
      message = this.market + ' jump continue ' + change;
      this.main.log(message);
      FollowOpenOrder.status.next(message);
    }

    return true;

  }


}
