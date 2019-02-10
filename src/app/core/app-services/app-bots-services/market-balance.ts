import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {VOBalance, VOOrder} from '../../../models/app-models';
import {StorageService} from '../../services/app-storage.service';
import {StopLossOrder} from './stop-loss-order';
import * as _ from 'lodash';
import {MarketCapService} from '../../../market-cap/services/market-cap.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';

export enum BalanceState {
  NONE = 'NONE',
  BOUGHT = 'BOUGHT',
  SOLD = 'SOLD',
  DUAL = 'DUAL'
}

export class MarketBalance {
  state$: BehaviorSubject<BalanceState>;
  balance$: BehaviorSubject<VOBalance>;
  balanceBase: VOBalance;
  priceUS:number;
  coin: string;
  base: string;
  sub1;
  sub2;
  id: string;

  constructor(
    private market: string,
    private apiPrivate: ApiPrivateAbstaract,
    private storage: StorageService,
   private marketCap: ApiMarketCapService
  ) {
    const ar = market.split('_');
    this.base = ar[0];
    this.coin = ar[1];
    this.id = apiPrivate.exchange + this.coin + '-balance'
    marketCap.ticker$().subscribe(MC =>{
      if(!MC) return;
      this.priceUS = MC[this.coin].price_usd;
    })
  }

  get baseBalance() {
    return this.balanceBase.available
  }

  get available() {
    return this.balance$.getValue().available;
  }

  get balance() {
    let total = this.balance$.getValue().available + this.balance$.getValue().pending;
    if (total * this.priceUS < 10) total = 0;
    return total;
  }

  get availableUS(){
    return +((this.balance$.getValue().available) * this.priceUS).toFixed(2)
  }
  get balanceUS() {
    return +((this.balance$.getValue().available + this.balance$.getValue().pending) * this.priceUS).toFixed(2)
  }

  get state(): BalanceState {
    return this.state$.getValue();
  }

  async init() {

    this.state$ = new BehaviorSubject(BalanceState.NONE);
    const exchange = this.apiPrivate.exchange;
    this.balance$ = new BehaviorSubject<VOBalance>(
      (await this.storage.select(this.id)) || new VOBalance({
        exchange: exchange,
        symbol: this.coin,
        available: 0,
        pending: 0
      })
    );

    this.balance$.subscribe(bc => {
      const available = bc.available * this.priceUS;
      const selling = bc.pending * this.priceUS;
      const total = available + selling;
      if (available > 10 && selling > 10) this.state$.next(BalanceState.DUAL);
      else if (available < 10 && selling < 10) this.state$.next(BalanceState.SOLD);
      else if (available > 10 || selling > 10) this.state$.next(BalanceState.BOUGHT);
    });

    this.sub1 = this.apiPrivate.balances$().subscribe(balances => {
      if (!balances) return;
      this.balanceBase = _.find(balances, {symbol: this.base});
      let bc = _.find(balances, {symbol: this.coin}) || new VOBalance({
        exchange: exchange,
        symbol: this.coin,
        available: 0,
        pending: 0,
        change: 0
      });

      const balance = this.balance$.getValue();
      if (bc.available !== balance.available || bc.pending !== balance.pending) {
        bc.change = (bc.available + bc.pending) - (balance.available + balance.pending);
        this.balance$.next(bc);
      }

      this.storage.upsert(this.id, bc);

    });
  }

  destroy() {
    if (this.sub1) this.sub1.unsubscribe();
    this.storage.remove(this.id);
    this.storage = null;
    this.apiPrivate = null;
  }
}
