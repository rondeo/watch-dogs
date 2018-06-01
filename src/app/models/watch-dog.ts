import {VOMarketCap, VOWatchdog} from "./app-models";
import {VOMCAgregated} from '../apis/models';


export class WatchDog extends VOWatchdog {
  uuid: string;
  timestamp: number;
  date: string;
  baseUS: number;
  coinUS: number;
  isToSell;
  mcCoin: VOMCAgregated;
  mcBase: VOMCAgregated;


  booksDelta:number;

  constructor(public wd: VOWatchdog) {
    super();
    Object.assign(this, wd);
  }

  addUS(MC: { [symbol: string]: VOMCAgregated }) {
    this.mcBase = MC[this.base];
    this.mcCoin = MC[this.coin];

    this.baseUS = +(this.mcBase.price_usd * this.balanceBase).toFixed(2);
    this.coinUS = +(this.mcCoin.price_usd * this.balanceCoin ). toFixed(2);

  }

  copy() {
    return Object.assign({date: this.date}, this.wd)

  }

}
