import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {ApisPublicService} from '../apis/api-public/apis-public.service';
import {Observable} from 'rxjs/internal/Observable';
import {ApisPrivateService} from '../apis/api-private/apis-private.service';
import {VOBalance, VOBooks} from '../../amodels/app-models';
import {Subject} from 'rxjs/internal/Subject';
import {ApiMarketCapService} from '../apis/api-market-cap.service';
import {UtilsBooks} from '../../acom/utils-books';
import {filter, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TradeMarketService {

  market$: BehaviorSubject<string> = new BehaviorSubject('');
  exchange$: BehaviorSubject<string> = new BehaviorSubject('');

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
    this.exchange$.subscribe(exchange => {
      const api = this.apisPublic.getExchangeApi(exchange);
      if(api) this.markets$ = api.markets$.pipe(map(o => o.sort()));
    });

  }

}
