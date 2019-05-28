import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {ApisPublicService} from '../apis/api-public/apis-public.service';
import {Observable} from 'rxjs/internal/Observable';
import {ApisPrivateService} from '../apis/api-private/apis-private.service';
import {VOBalance, VOBooks} from '../../amodels/app-models';
import {Subject} from 'rxjs/internal/Subject';
import {ApiMarketCapService} from '../apis/api-market-cap.service';
import {UtilsBooks} from '../../acom/utils-books';
import {filter, map, pairwise} from 'rxjs/operators';
import {ViewState} from '../../trader/live-trader/live-trader.component';

const STATE0: ViewState = {
  selected: null,
  exchange: null,
  market: null,
  allMarkets: false,
  botList: true,
  active:null
};

@Injectable({
  providedIn: 'root'
})
export class TradeMarketService {

  private _state$: BehaviorSubject<ViewState> = new BehaviorSubject(STATE0);
  get state$() {
    return this._state$.asObservable()
  }
  get viewState(): ViewState {
    return {...this._state$.getValue()};
  }

  setViewState(state: ViewState) {
    this._state$.next(state);
  }

  get stateChanges$() {
    return this.state$.pipe(pairwise())
  }

  exchanges$: Observable<string[]> = new Observable();
  markets$: Observable<string[]> = new Observable();
  books$: BehaviorSubject<VOBooks> = new BehaviorSubject(null);
  pots$: BehaviorSubject<number> = new BehaviorSubject(1);
  priceSell$: BehaviorSubject<number> = new BehaviorSubject(0);
  priceBuy$: BehaviorSubject<number> = new BehaviorSubject(0);

  balanceBase$: BehaviorSubject<VOBalance> = new BehaviorSubject(new VOBalance());
  balanceCoin$: BehaviorSubject<VOBalance> = new BehaviorSubject(new VOBalance());
  marketPrecision: number;

  constructor(
    public apisPublic: ApisPublicService,
    public apisPrivate: ApisPrivateService,
    private marketCap: ApiMarketCapService
  ) {

    this.exchanges$ = this.apisPrivate.exchanges$;
    this.state$.pipe(pairwise()).subscribe(([s1, s2]) => {
      let exchange = s2.exchange;
      if(s1 && s1.exchange === exchange) return;
      const api = this.apisPublic.getExchangeApi(exchange);
      if(api) this.markets$ = api.markets$.pipe(map(o => o.sort()));
    });

    this._state$.pipe(pairwise())
      .subscribe(([o,n]) => {
    //   console.log(o,n);
    });
  }

}
