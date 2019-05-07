import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {ApisPublicService} from '../apis/api-public/apis-public.service';
import {Observable} from 'rxjs/internal/Observable';
import {ApisPrivateService} from '../apis/api-private/apis-private.service';
import {VOBalance, VOBooks} from '../../amodels/app-models';
import {Subject} from 'rxjs/internal/Subject';
import {ApiMarketCapService} from '../apis/api-market-cap.service';
import {UtilsBooks} from '../../acom/utils-books';

@Injectable({
  providedIn: 'root'
})
export class TradeMarketService {

  market$: BehaviorSubject<string> = new BehaviorSubject('');
  exchange$: BehaviorSubject<string> = new BehaviorSubject('');

  exchanges$: Observable<string[]> = new Observable();
  markets$: Observable<string[]> = new Observable();
  books$: BehaviorSubject<VOBooks> = new BehaviorSubject(null);
  amount$: BehaviorSubject<number> = new BehaviorSubject(100);
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
      if(api) this.markets$ = api.markets$;
    });

    this.market$.subscribe(market => {
      const exchange = this.exchange$.getValue();
      if(!exchange) {
        console.warn(' no exchange ');
        return;
      }
      const api = this.apisPublic.getExchangeApi(exchange);
      if(api) {
        const apiPrivate = this.apisPrivate.getExchangeApi(exchange);
        if(apiPrivate) {
          apiPrivate.balances$().subscribe(balances =>{
            const ar = market.split('_');
            const base = ar[0];
            const coin = ar[1];
            const balanceBase: VOBalance = balances.find(function (item) {
              return item.symbol === base;
            }) || new VOBalance();
            const balanceCoin: VOBalance = balances.find(function (item) {
              return item.symbol === coin;
            }) || new VOBalance();

            this.marketCap.ticker$().subscribe(MC => {
              balanceBase.balanceUS = Math.round(balanceBase.balance * MC[base].price_usd);
              balanceCoin.balanceUS = Math.round(balanceCoin.balance * MC[coin].price_usd);
              this.balanceCoin$.next(balanceCoin);
              this.balanceBase$.next(balanceBase);
            });
          });
        }

        this.refreshBooks();

      }
    });
    this.amount$.subscribe(amount => {
      this.calculateBooks();
    })
  }

  calculateBooks(){
    const books: VOBooks = this.books$.getValue();
    const amountUS: number = this.amount$.getValue();
    const market: string = this.market$.getValue();
    if(!books || !amountUS || !market) return;
    const base = market.split('_')[0];
    this.marketCap.ticker$().subscribe(mc => {

      const price = mc[base].price_usd;
      const amount = amountUS / price;
      const sellPrice = UtilsBooks.getRateForAmountBase(books.buy, amount);
      const buyPrice = UtilsBooks.getRateForAmountBase(books.sell, amount);
      this.marketPrecision = sellPrice.toString().length > buyPrice.toString().length?sellPrice.toString().length:buyPrice.toString().length;
      this.priceSell$.next(sellPrice);
      this.priceBuy$.next(buyPrice);
    })

  }


  refreshBooks() {
    const exchange = this.exchange$.getValue();
    const market = this.market$.getValue();
    const api = this.apisPublic.getExchangeApi(exchange);
    api.downloadBooks2(market).subscribe(books => {
      this.books$.next(books);
      this.calculateBooks();
    })
  }
}
