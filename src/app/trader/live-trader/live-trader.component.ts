import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatSnackBar} from '@angular/material';
import {OrderType, VOOrder} from '../../amodels/app-models';
import * as _ from 'lodash';
import {ApiMarketCapService} from '../../a-core/apis/api-market-cap.service';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/internal/Observable';
import {filter, map, skip} from 'rxjs/operators';

import {MarketOrderModel} from '../../amodels/market-order-model';

import {TradeMarketService} from '../../a-core/services/trade-market.service';

import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {MATH} from '../../acom/math';
import {Utils} from 'tslint';
import {UTILS} from '../../acom/utils';
import {BotEditComponent} from '../../aui/dialogs/bot-edit/bot-edit.component';
import {StopLossEditComponent} from '../../aui/dialogs/stop-loss-edit/stop-loss-edit.component';
import {OrderTypeComponent} from '../../aui/dialogs/order-type/order-type.component';
import {Subject} from 'rxjs/internal/Subject';
import {AppBotsService} from '../../app-bots/app-bots.service';
import {UsdtBtcMarket} from '../../app-bots/usdt-btc-market';
import {BotBase} from '../../app-bots/bot-base';


export interface ViewState {
  active: string;
  selected: string;
  exchange: string;
  market: string;
  botList: boolean;
  isAllMarkets: boolean
  isCandles: boolean;
}

@Component({
  selector: 'app-live-trader',
  templateUrl: './live-trader.component.html',
  styleUrls: ['./live-trader.component.css']
})

export class LiveTraderComponent implements OnInit, OnDestroy {

  exchanges$: Observable<string[]>;
  markets$: Observable<string[]>;

  market: string;
  exchange: string;

  closes: number[];
  isAllMarkets: boolean;
  // exchange: string = null;
  amountPots = 1;
  price: number;

  base: string;
  coin: string;

  balanceBaseUS: number;
  balanceCoinUS: number;

  stopLossPercent: number = 2.5;
  stopLoss: number;
  currentBot: BotBase;
  myOrders$: BehaviorSubject<VOOrder[]>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    // private apisPublic: ApisPublicService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private botsService: AppBotsService,
    public marketService: TradeMarketService,
    // private tradesHistoryService: TradesHistoryService,
    private marketCap: ApiMarketCapService,
    //    private storage: StorageService
  ) {

  }

  sub1: Subscription;
  sub2: Subscription;
  sub3: Subscription;

  bots$: Observable<BotBase[]>;
  usdtbtcs$: Observable<UsdtBtcMarket[]>;

  currentOrderLiquidPrice: number;
  isCandles: boolean;

  ngOnInit() {
   this.route.params.subscribe(state => {
     this.marketService.setViewState(state as ViewState);
    });


    this.botsService.errors$.subscribe(error => {
      this.snackBar.open(error, 'x');
    });

    this.bots$ = this.botsService.orders$;
    this.usdtbtcs$ = this.botsService.usdtbtc$;

    this.marketService.state$.subscribe(state => {
      this.market = state.market;
      this.exchange = state.exchange;
      if(this.market) {
        const ar = this.market.split('_');
        this.base = ar[0];
        this.coin = ar[1];
      } else {
        this.base = null;
        this.coin = null;
      }
      this.isAllMarkets = state.isAllMarkets;
      this.isCandles = state.isCandles;

    })


    this.marketService.balanceBase$.subscribe(balance => {
      this.balanceBaseUS = balance.balanceUS;
    });

    this.marketService.balanceCoin$.subscribe(balance => {
      this.balanceCoinUS = balance.balanceUS;
    });

  }

  ngOnDestroy() {
    this.unsubscribe();
  }


  subscribe() {

  }

  unsubscribe() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub1.unsubscribe();
  }

  onExchangeChanged($event: string) {
    //  this.marketService.exchange$.next($event);
    const state = this.marketService.viewState;
    state.exchange = $event;
    this.setUrl(state);

  }

  onMarketChanged($event: string) {
    const state = this.marketService.viewState;
    state.market = $event;
    this.setUrl(state);
    // this.marketService.market$.next($event);

  }


  onBotClick(bot: BotBase) {
   // if (this.currentBot) this.currentBot.selected = false;
    this.currentBot = bot;
   // bot.selected = true;
    this.myOrders$ = bot.ordersOpen$;
    const state = this.marketService.viewState;
   //  state.selected = bot.config.;
    state.market = bot.config.market;
    state.exchange = bot.config.exchange;
    this.setUrl(state);
  }

  onUsdtBtcClick(usdtbtc: UsdtBtcMarket) {
    const state = this.marketService.viewState;
    state.exchange = usdtbtc.exchange;
    state.market = 'USDT_BTC';
    this.setUrl(state);
    //  this.marketService.exchange$.next(usdtbtc.exchange);
    // this.marketService.market$.next('USDT_BTC');

  }


  onUsdClick() {
    // this.marketService.market$.next('USD_BTC');
    const state = this.marketService.viewState;
    state.market = 'USDT_BTC';
    this.setUrl(state);
    //  this.setRoute();
  }

  setUrl(state: ViewState) {
    /* const exchange = this.exchange,
       market = this.marketService.market$.getValue(),
       bot =  this.currentBot? this.currentBot.id: '';*/

    this.router.navigate(['/trader/live-trader', state])
  }

  onDeleteOrderClick(order: VOOrder) {
    if (!this.currentBot) return;
   // this.currentBot.cancelOrder(order.uuid).toPromise();
  }

  onDeleteBotClick(bot: BotBase) {
    const msg = ' Delete ' + bot.id + '?';
    if (confirm(msg)) {
      this.botsService.deleteBot(bot);
    }
  }


  onBotSellClick(bot: BotBase) {
    // bot.sellCoinInstant();
  }


  onEditTypeClick(bot: BotBase) {
    const ref = this.dialog.open(OrderTypeComponent, {height: '330px', width: '350px', data: bot});
    ref.afterClosed().subscribe(res => {
    })

  }

  onStopPriceClick(bot: BotBase) {
    const ref = this.dialog.open(StopLossEditComponent, {height: '400px', width: '600px', data: bot});
    ref.afterClosed().subscribe(res => {
    })

  }

  onAddClick() {

    const bot = this.botsService.createBot(this.exchange, this.market);

  }

  onActiveOrdersRefreshClick() {
    this.currentBot.refreshOpenOrders();

  }

  onAllMarketsChanged() {
    const state = this.marketService.viewState;
    state.isAllMarkets = this.isAllMarkets;
    this.setUrl(state);
  }

  onCandlesChanged() {
    const state = this.marketService.viewState;
    state.isCandles = this.isCandles;
    this.setUrl(state);
  }
}
