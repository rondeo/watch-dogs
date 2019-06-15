import {BotBus} from '../bot-bus';
import {ApiPublicAbstract} from '../../a-core/apis/api-public/api-public-abstract';
import {ApiPrivateAbstaract} from '../../a-core/apis/api-private/api-private-abstaract';
import {VOBalance, VOOrder, VOWatchdog} from '../../amodels/app-models';
import {UtilsBooks} from '../../acom/utils-books';
import {UTILS} from '../../acom/utils';

export class BuySellCommands {
  config: VOWatchdog;
  constructor(private bus: BotBus, private apiPrivate: ApiPrivateAbstaract, private apiPublic: ApiPublicAbstract) {

    bus.config$.subscribe(cfg => this.config = cfg);
  }

  async buyCoinInstant(market: string, amountCoin: number) {
    return this.sendOrder(market, 'BUY', amountCoin, 0);
  }

  async sendOrder(market: string, type: string, amountCoin: number, rate: number) {

    if(this.bus.isDirty) {
      console.log(' DATA DIRTY');
      return
    }

    if(amountCoin === 0) {
      console.warn(' amount 0');
      return;
    }

    if(type === 'SELL') {
      const available = this.bus.balanceCoin.available;
      if(available < amountCoin) {
        console.log(' DONT have available balance coin ' + amountCoin + ' available ' + available);
        return
      }
    }


    this.bus.isDirty = true;
    if(!rate) {
      console.log(' DOWNLOADING BOOKS FOR Rate ');
      const books = await this.apiPublic.downloadBooks2(market).toPromise();
      const myBooks = type === 'BUY'?books.sell:books.buy;
      rate = UtilsBooks.getRateForAmountCoin(myBooks, amountCoin);
      await UTILS.wait(10);
    }

    if(type === 'BUY') {
      const balanceBase: VOBalance = this.bus.balanceBase;
      if(balanceBase.available < amountCoin * rate) {
        console.log(' DONT HAVE enough balance base ' +(amountCoin * rate) + '  available' +  balanceBase.available);
        return
      }
    }
    console.log(market +' sending order ' + type + ' amountCoin ' + amountCoin + ' rate ' + rate);
    let res;
    try {
      if (type === 'BUY') res = await this.apiPrivate.buyLimit2(market, amountCoin, rate);
      else res = await this.apiPrivate.sellLimit2(market, amountCoin, rate);
    } catch (e) {
      console.log(e);
    }

    await UTILS.wait(5);
    await this.apiPrivate.refreshBalancesNow();
    await this.apiPrivate.refreshAllOpenOrders();
    this.bus.isDirty = false;
    return res;
  }

  async sellCoinInstant(market: string, amountCoin: number) {
    console.warn('SELL_INSTANT ' + amountCoin);
    return this.sendOrder(market, 'SELL', amountCoin, 0);
  }

}
