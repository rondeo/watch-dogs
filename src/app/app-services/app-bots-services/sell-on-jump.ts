import {VOCandle} from '../../models/api-models';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import * as moment from 'moment';

export class SellOnJump {
  private timeJump;

  constructor(private market: string) {

  }

  log(message: string){
    console.log(message);
  }

  sellCoin(){

  }

  isJump(candles: VOCandle[]): boolean {
    const closes = CandlesAnalys1.oc(candles);

    const lastPrice = _.last(closes);
    const last = _.last(candles);
    // const medianPrice = MATH.median(_.takeRight(closes, 7));
    const ma7 = _.mean(_.takeRight(closes, 7));
    // const prevPrice = _.mean(closes.slice(closes.length -4, closes.length -2));
   //  const priceChange = MATH.percent(lastPrice, medianPrice);
    const ma7D = MATH.percent(lastPrice, ma7);

    let change = ma7D;
     this.log('jump MA7D ' + change);
    if (change > 5) {
      this.timeJump = moment(last.to).valueOf();
    }

    if (!this.timeJump) return false;

    const dur = moment(last.to).diff(this.timeJump, 'minutes');
   this.log(' was Jump   ' + dur + ' min ago');
    if (dur > 30) {
      this.timeJump = 0;
      return false;
    }


    /*candles = _.takeRight(candles, 7);
    const max = _.max(closes);
    const min = _.min(closes);
    const avg = (max + min) /2;
    const lastRange = (last.high + last.low)/2 ;
    const change = MATH.percent(lastRange, avg);*/

    if (change < 0) {
      this.log(' jump DOWN => SELL ' + change);
      this.sellCoin();
    } else {
      this.log(' jump continue ' + change);
    }

    return true;

  }


}
