import {VOCandle} from '../amodels/api-models';
import {ApiPrivateAbstaract} from '../a-core/apis/api-private/api-private-abstaract';
import * as _ from 'lodash';
import {CandlesAnalys1} from '../a-core/app-services/scanner/candles-analys1';
import {MATH} from '../acom/math';

export class BuyOnDown {


  constructor(
    private market: string,
    private apiPrivet: ApiPrivateAbstaract
  ) {

  }

  log(message: string){

  }

  buySignal(price:number){

  }
  checkToBuy(candles: VOCandle[]) {
    const last = _.last(candles);
    let volumes = CandlesAnalys1.volumes(candles);
    volumes = volumes.filter(function (item) {
      return item;
    })
    const volumeMedian = MATH.median(volumes);
    const prices = CandlesAnalys1.closes(candles);
    const minPrice = _.min(_.takeRight(prices, 10));
    const prevPrice = prices[prices.length - 3];
    const ma25 = _.mean(_.takeRight(prices, 25));
    //  const ma7 = _.mean(_.takeRight(prices, 7));
    const ma3 = _.mean(_.takeRight(prices, 7));
    const lastPrice = last.close;
    const ma25D = MATH.percent(lastPrice, ma25);
    // onst ma7D = MATH.percent(lastPrice, ma7);
    const volumeD = MATH.percent(last.Volume, volumeMedian);
    const priceD = MATH.percent(lastPrice, minPrice);

    if(ma25D > -1){
      return false
    }

    let message =  ' BuyOnDown ' + ['ma25D:', ma25D, 'volumeD:', volumeD, 'priceD:', priceD, last.time].toString();
    this.log(message);
    if (Math.abs(ma25D) < priceD) {
      this.log(' ROLL BACK ');
      this.buySignal(last.close);

    }

    return true;


  }
}
