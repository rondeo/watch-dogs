import {VOMarketCap, VOWatchdog} from "../../models/app-models";

export class WatchDog extends VOWatchdog {
  uuid: string;
  timestamp: number;
  date: string;
  baseUS: number;
  coinUS: number;
  isToSell;
  mcCoin: VOMarketCap;
  mcBase: VOMarketCap;


  booksDelta:number;

  constructor(public wd: VOWatchdog) {
    super();
    Object.assign(this, wd);
  }

  addUS(MC: { [symbol: string]: VOMarketCap }) {
    this.mcBase = MC[this.base];
    this.mcCoin = MC[this.coin];

    this.baseUS = +(this.mcBase.price_usd * this.balanceBase).toFixed(2);
    this.coinUS = +(this.mcCoin.price_usd * this.balanceCoin ). toFixed(2);

  }

  copy() {
    return Object.assign({date: this.date}, this.wd)

  }

}
