import {VOCandle} from '../../models/api-models';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import * as moment from 'moment';

export class SellOnJump {
  private timeJump;

  constructor(private market: string) {

  }

  sellOnSecondMax() {

  }

  log(message: string) {
    console.log(message);
  }

  sellCoin(rate: number) {

  }

  isJump(candles: VOCandle[]): boolean {
    const prices = CandlesAnalys1.meds(candles);
    const closes = _.map(candles, 'close');

    const lastPrice = _.last(prices);
    const last = _.last(candles);
    // const medianPrice = MATH.median(_.takeRight(closes, 7));
    const ma7 = _.mean(_.takeRight(prices, 7));
    const ma25 = _.mean(_.takeRight(prices, 25));
    // const prevPrice = _.mean(closes.slice(closes.length -4, closes.length -2));
    //  const priceChange = MATH.percent(lastPrice, medianPrice);
    const ma7D = MATH.percent(lastPrice, ma7);
    const ma25D = MATH.percent(lastPrice, ma25);
    let change1 = ma7D;
    let change2 = ma25D;

    // console.log(change1, change2);

    if (this.timeJump && change2 < 0) {
      this.log(' TOO LATE to sell  jump MA7D ' + ma7D + ' ma25D ' + ma25D + JSON.stringify(last));
      this.timeJump = 0;
      return;
    }

    if (Math.abs(change2) > 2) this.log(' MA7D ' + ma7D + ' ma25D ' + ma25D);
    if (change2 > 4) {
      this.log(' JUMP > 4 ');
      this.timeJump = moment(last.to).valueOf();
    }

    if (!this.timeJump) return false;

    const dur = moment(last.to).diff(this.timeJump, 'minutes');
    this.log(' jump MA7D ' + ma7D + ' ma25D ' + ma25D + ' dur ' + dur + ' ' + JSON.stringify(last));

    if (dur > 30) {
      this.log(' RESETTING JUMP MA7D ' + ma7D + ' ma25D ' + ma25D);
      this.timeJump = 0;
      return false;
    }


    /*candles = _.takeRight(candles, 7);
    const max = _.max(closes);
    const min = _.min(closes);
    const avg = (max + min) /2;
    const lastRange = (last.high + last.low)/2 ;
    const change = MATH.percent(lastRange, avg);*/


    if (change1 < 0) {
      MATH.sort(closes);
      const secondPrice = closes[closes.length - 2];
      this.log(' jump DOWN => SELL ' + change1);
      this.sellCoin(secondPrice);
    } else {
      this.log(' jump continue ');
    }

    return true;

  }


}
