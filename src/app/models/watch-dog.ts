import {VOMarketCap, VOWATCHDOG, VOWatchdog} from './app-models';
import {VOMCAgregated} from './api-models';


export class WatchDog extends VOWatchdog {
  uuid: string;
  timestamp: number;
  date: string;
  baseUS: number;
  coinUS: number;
  isToSell;
  mcCoin: VOMCAgregated;
  mcBase: VOMCAgregated;
  booksDelta: number;

  constructor(public wd: VOWatchdog) {
    super(wd);
  }

  addUS(MC: { [symbol: string]: VOMCAgregated }) {
    this.mcBase = MC[this.base];
    this.mcCoin = MC[this.coin];

    this.baseUS = +(this.mcBase.price_usd * this.balanceBase).toFixed(2);
    this.coinUS = +(this.mcCoin.price_usd * this.balanceCoin).toFixed(2);

  }

  toJSON(): VOWatchdog {
    return {
      id: this.id,
      exchange: this.exchange,
      base: this.base,
      coin: this.coin,
      action: this.action,
      name: this.name,
      isActive: this.isActive,
      status: this.status,
      isEmail: this.isEmail,
      results : this.results,
      sellScripts: this.sellScripts,
      buyScripts: this.buyScripts,
      balanceCoin: this.balanceCoin,
      balanceBase: this.balanceBase,
      amount: this.amount
    }

  }

  copy() {

  }

}
