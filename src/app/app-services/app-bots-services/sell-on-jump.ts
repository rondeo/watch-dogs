import {VOCandle} from '../../models/api-models';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import * as moment from 'moment';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {VOOrder} from '../../models/app-models';

export class SellOnJump {
  private timeJump;

  constructor(private market: string, private apiPublic: ApiPublicAbstract) {

  }

  prevSpeed: number;
  prevSum: number;
  interval;

  lastStamp;

  async tick() {
    let trades: VOOrder[] = await this.apiPublic.downloadHistory(this.market);

    if(!this.lastStamp) this.lastStamp = moment().subtract(5, 'minutes').valueOf();
    const lastStamp = this.lastStamp;
    trades = trades.filter(function (item) {
      return item.timestamp > lastStamp;
    });

    const first = _.first(trades);
    const last = _.last(trades);




    const fishes = _.takeRight(_.orderBy(trades, 'amountCoin'), 20);


    let sum = 0;
    let bought = 0;
    let sold = 0;
    fishes.forEach(function (item) {
      if (item.action === 'BUY') bought += item.amountCoin;
      else sold += item.amountCoin;
      sum += item.amountCoin;
    });
    sum = sum / fishes.length;
    const boughtD = MATH.percent(bought, sum);
    const soldD = MATH.percent(sold, sum);
    let volD = -1;
    if(this.prevSum){
      volD = MATH.percent(sum, this.prevSum);
    }
    this.prevSum = sum;
    this.log(moment(lastStamp).format('HH:mm') + ' - '+moment(last.timestamp).format('HH:mm') +' boughtD ' + boughtD + ' soldD ' + soldD + ' volD ' + volD );

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
      this.stop();
      return;
    }

    if (Math.abs(change2) > 2) this.log(' MA7D ' + ma7D + ' ma25D ' + ma25D + ' lastPrice  '  + lastPrice);
    if (change2 > 2) {
      this.log(' JUMP > 4 ');
      this.start();
      this.timeJump = moment(last.to).valueOf();
    }

    if (!this.timeJump) return false;


    const dur = moment(last.to).diff(this.timeJump, 'minutes');
    this.log(' jump MA7D ' + ma7D + ' ma25D ' + ma25D + ' dur ' + dur + ' ' + JSON.stringify(last));

    if (dur > 30) {
      this.log(' RESETTING JUMP MA7D ' + ma7D + ' ma25D ' + ma25D);
      this.stop();
      this.timeJump = 0;
      return false;
    }


    if (change1 < 0) {
      MATH.sort(closes);
      const secondPrice = closes[closes.length - 2];
      this.log(' jump DOWN => SELL ' + change1 + ' secondPrice price ' + secondPrice);
      this.sellCoin(secondPrice);
    } else {
      this.log(' jump continue ');
    }

    return true;

  }


}
