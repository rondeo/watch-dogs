import {VOCandle} from '../../models/api-models';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import * as moment from 'moment';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {VOOrder} from '../../models/app-models';
import {C} from '@angular/core/src/render3';

export class SellOnJump {
  private timeJump;

  constructor(private market: string, private apiPublic: ApiPublicAbstract) {

  }

  prevSpeed: number;
  prevSum: number;
  interval;
  lastStamp;
  boughtD: number;
  volD: number;

  async tick() {
    //  const candles = await this.apiPublic.downloadCandles(this.market, '5m', 10);

    let trades: VOOrder[] = await this.apiPublic.downloadHistory(this.market);

    /* if (!this.lastStamp) this.lastStamp = moment().subtract(5, 'minutes').valueOf();
     const lastStamp = this.lastStamp;
     trades = trades.filter(function (item) {
       return item.timestamp > lastStamp;
     });*/

    // const first = _.first(trades);
    // const last = _.last(trades);

    const fishes = trades;//_.takeRight(_.orderBy(trades, 'amountCoin'), 20);


    let sum = 0;
    let bought = 0;
    let sold = 0;
    // const sellPrices = [];
    // const buyPrices = [];

    fishes.forEach(function (item) {
      if (item.action === 'BUY') {
        bought += item.amountCoin;
        //  buyPrices.push(item.rate);
      }
      else {
        sold += item.amountCoin;
        // sellPrices.push(item.rate);
      }
      sum += item.amountCoin;
    });

    sum = sum / fishes.length;
    const boughtD = MATH.percent(bought, sum);
    const soldD = MATH.percent(sold, sum);

    let volD = -1;
    if (this.prevSum) {
      volD = MATH.percent(sum, this.prevSum);
    }
    this.prevSum = sum;

    this.boughtD = boughtD;
    this.volD = volD;
    this.log(' boughtD ' + boughtD + ' soldD ' + soldD + ' volD ' + volD);

    // this.log(' sellPrices ' + sellPrices.toString() + ' buyPrices ' + buyPrices.toString())
    // if(soldD > 90) this.sellCoin(last.rate);
  }


  stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = 0;
    this.log('ending tick')
  }

  start() {
    if (this.interval) return;
    this.log('starting tick')
    this.interval = setInterval(() => this.tick(), 30 * 1000);
  }

  analiseCandles(candles: VOCandle[]) {
    candles = _.takeRight(candles, 10);
    const OSS = CandlesAnalys1.oc(candles);
  }

  sellOnSecondMax() {

  }

  log(message: string) {
    console.log(message);
  }

  sellCoin() {

  }

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
      console.warn(' sell coin')
      return true;
    }
    // const medianPrice = MATH.median(_.takeRight(closes, 7));

    // const prevPrice = _.mean(closes.slice(closes.length -4, closes.length -2));
    //  const priceChange = MATH.percent(lastPrice, medianPrice);


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
      this.log(' TOO LATE ' + message);
      this.timeJump = 0;
      this.stop();
      return;
    }

    if (ma3_25 > 4) {
      this.log(' JUMP > 4 ');
      this.start();
      this.timeJump = moment(last.to).valueOf();
    }

    if (!this.timeJump) return false;
    const dur = moment(last.to).diff(this.timeJump, 'minutes');

    this.log(message);
    if (dur > 30) {
      this.log(' RESETTING JUMP by duration > ' + dur);
      this.stop();
      this.timeJump = 0;
      return false;
    }

    if (ma3_7 < -1 && Math.abs(ma3_7) > ma7_25) {

      this.log(' jump DOWN => SELL  ma3_7D < -1 && Math.abs(ma3_7D) > ma7_25D)');
      if (this.boughtD < 500) this.sellCoin();
    } else {
      this.log(' jump continue ');
    }

    return true;

  }


}
