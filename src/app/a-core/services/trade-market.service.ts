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
import {AppBotsService} from '../app-services/app-bots-services/app-bots.service';

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

    this.market$.pipe(filter(v => !!v)).subscribe(market => {
      const ar = market.split('_');
      const base = ar[0];
      const coin = ar[1];

      if(!base || !coin) return;

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
    this.pots$.subscribe(amount => {
      this.calculateBooks();
    })
  }

  calculateBooks(){
    const books: VOBooks = this.books$.getValue();
    const pots: number = this.pots$.getValue() || 1;
    const market: string = this.market$.getValue();
    if(!books || !market) return;
    const base = market.split('_')[0];

    this.marketCap.getTicker().then(mc => {
      const price = mc[base].price_usd;
      const amount = pots * AppBotsService.potSoizeUS / price;
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
    if(!market || !exchange || market.split('_').length !==2) return;
    const api = this.apisPublic.getExchangeApi(exchange);
    api.downloadBooks2(market).subscribe(books => {
      this.books$.next(books);
      this.calculateBooks();
    })
  }
}
