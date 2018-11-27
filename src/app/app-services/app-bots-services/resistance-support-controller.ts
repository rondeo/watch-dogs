import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {StorageService} from '../../services/app-storage.service';
import {ResistanceSupport} from '../../trader/libs/levels/resistance-support';
import * as moment from 'moment';

export class ResistanceSupportController {
  interval;
  resistanceSupport: ResistanceSupport;

  constructor(private market: string, private candlesInterval: string, private apiPublic: ApiPublicAbstract, private storage: StorageService) {

  }

  async init() {
    let candles = (await this.storage.select(this.market + this.candlesInterval));   ;
    if (!candles) candles = await this.downloadCandles();
    this.resistanceSupport = new ResistanceSupport(candles);
    this.start();
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), 20000 * (Math.random() + 5));
  }

  stop() {
    clearInterval(this.interval);
    this.interval = 0;
  }

  async downloadCandles() {
    const candles = await this.apiPublic.downloadCandles(this.market, this.candlesInterval, 120);
    this.storage.upsert(this.market + this.candlesInterval, candles);
    return candles;
  }

  getSupportLevel(price: number) {
    if (!this.resistanceSupport) return null;
    const supports = this.resistanceSupport.getSupports();
    supports.forEach(function (item) {
      item.date = moment(item.to).format('DD HH:mm');
    });
    console.log(this.market, supports);
  }

  destroy(){
    this.storage.remove(this.market + this.candlesInterval);
    this.stop();
  }

  private tick() {


  }
}
