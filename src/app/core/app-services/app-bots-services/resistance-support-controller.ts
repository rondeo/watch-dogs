import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {StorageService} from '../../services/app-storage.service';
import {ResistanceSupport} from '../../../trader/libs/levels/resistance-support';
import * as moment from 'moment';
import * as _ from 'lodash';
import {VOCandle} from '../../../models/api-models';

export class ResistanceSupportController {
  interval;
  resistanceSupport: ResistanceSupport;


  static isOutOfDate(candles: VOCandle[]) {
    const last = _.last(candles);
    const diff = moment().diff(last.to, 'hours');
    return diff > 5;
  }

  constructor(
    private market: string,
    private candlesInterval: string,
    private apiPublic: ApiPublicAbstract,
    private storage: StorageService) {
  }

  async init() {
    let candles = (await this.storage.select(this.market + this.candlesInterval));

    if (!candles || ResistanceSupportController.isOutOfDate(candles)) candles = await this.downloadCandles();
    this.resistanceSupport = new ResistanceSupport(candles);
    this.start();
  }

  start() {
    if (this.interval) return;
    const timer = Math.round(200000 * (Math.random() + 1));
    this.interval = setInterval(() => this.tick(), timer);
  }

  stop() {
    clearInterval(this.interval);
    this.interval = 0;
  }

  async downloadCandles() {
    const candles = await this.apiPublic.downloadCandles(this.market, this.candlesInterval, 200);
    this.storage.upsert(this.market + this.candlesInterval, candles);
    return candles;
  }

  getSupportLevel(price: number) {
    if (!this.resistanceSupport) return null;
    const supports = this.resistanceSupport.getSupports();
    const delta = price * 0.01;
    const max = price + delta;
    const min = price - delta;
    // const vmed = this.resistanceSupport.getVmed();

    const closeSupport = supports.filter(function (item, i) {
      return item.close < max && item.close > min;
    });


    return closeSupport;
  }

  destroy() {
    this.storage.remove(this.market + this.candlesInterval);
    this.stop();
  }

  private async tick() {

    if (ResistanceSupportController.isOutOfDate(this.resistanceSupport.candles)) {
      const candles = await this.downloadCandles();
      this.resistanceSupport = new ResistanceSupport(candles);
    }
  }
}
