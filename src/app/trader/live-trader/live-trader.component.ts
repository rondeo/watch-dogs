import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatSnackBar} from '@angular/material';
import {OrderType, VOOrder} from '../../amodels/app-models';
import * as _ from 'lodash';
import {ApiMarketCapService} from '../../a-core/apis/api-market-cap.service';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/internal/Observable';
import {filter, skip} from 'rxjs/operators';

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
import {MarketBot} from '../../app-bots/market-bot';
import {AppBotsService} from '../../app-bots/app-bots.service';
import {UsdtBtcMarket} from '../../app-bots/usdt-btc-market';

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
  // exchange: string = null;
  amountPots = 1;
  price: number;

  base: string;
  coin: string;

  balanceBaseUS: number;
  balanceCoinUS: number;

  stopLossPercent: number = 2.5;
  stopLoss: number;

  currentBot: MarketBot;
  myOrders$: BehaviorSubject<VOOrder[]>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
   // private apisPublic: ApisPublicService,
    private snackBar: MatSnackBar,
   private dialog: MatDialog,
   // private marketsHistory: MarketsHistoryService,
   // private candleService: CandlesService,
   // private apisPrivate: ApisPrivateService,
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

  bots$: Observable<MarketBot[]>;
  usdtbtcs$: Observable<UsdtBtcMarket[]>;

  currentOrderLiquidPrice: number;

  ngOnInit() {

    this.botsService.errors$.subscribe(error => {
      this.snackBar.open(error, 'x');
    })
    const params = this.route.snapshot.params;
    this.marketService.exchange$.next(params.exchange);
    this.marketService.market$.next(params.market);
    this.bots$ = this.botsService.orders$;

    this.usdtbtcs$ = this.botsService.usdtbtc$;
    this.marketService.market$.pipe(filter(market => {
      return this.market !== market && !!market;
     //  if(this.sub1) this.sub1.unsubscribe();
    })).subscribe(market => this.market = market);

    this.marketService.exchange$.subscribe(exchange => {
      this.exchange = exchange;
    });

    UTILS.clearNull(this.marketService.market$).subscribe(market =>{
      const ar = market.split('_');
      this.base = ar[0];
      this.coin = ar[1];
    });

    this.marketService.balanceBase$.subscribe(balance => {
        this.balanceBaseUS = balance.balanceUS;
    });

    this.marketService.balanceCoin$.subscribe(balance =>{
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
    this.marketService.exchange$.next($event);
    this.setRoute();
  }

  onMarketChanged($event: string) {
    this.marketService.market$.next($event);
    this.setRoute();
  }

  onBotClick(bot: MarketBot) {
    if (this.exchange !== bot.exchange) {
      this.marketService.exchange$.next(bot.exchange);
    }

    this.marketService.market$.next(bot.market);

    if(this.currentBot) this.currentBot.selected = false;
    this.currentBot = bot;
    bot.selected = true;
    this.myOrders$ = bot.ordersOpen$;
    console.log(bot);
    this.setRoute();
  }

  onUsdtBtcClick(usdtbtc: UsdtBtcMarket) {
    this.marketService.exchange$.next(usdtbtc.exchange);
    this.marketService.market$.next('USDT_BTC');
    this.setRoute();
  }

  onUsdClick() {
    this.marketService.market$.next('USD_BTC');
    this.setRoute();
  }

  setRoute() {
    const exchange = this.exchange,
      market = this.marketService.market$.getValue(),
      bot =  this.currentBot? this.currentBot.id: '';
    this.router.navigate(['/trader/live-trader', {exchange, market, bot}])
  }

  onDeleteOrderClick(order: VOOrder) {
    if(!this.currentBot) return;
    this.currentBot.cancelOrder(order.uuid).toPromise();
  }

  onDeleteBotClick(bot: MarketBot) {
    const msg = ' Delete ' + bot.id + '?';
    if(confirm(msg)) {
      this.botsService.deleteBot(bot);
    }
  }



  onBotPriceSellClick(bot: MarketBot) {
    bot.downloadBooks();
  }

  onBotSellClick(bot: MarketBot) {
    bot.sellCoinInstant();
  }


  onEditTypeClick(bot: MarketBot) {
    const ref = this.dialog.open(OrderTypeComponent, {height: '230px', width:'350px', data: bot});
    ref.afterClosed().subscribe(res => {
    })

  }

  onStopPriceClick(bot: MarketBot) {
    const ref = this.dialog.open(StopLossEditComponent, {height: '400px', width:'600px', data: bot});
    ref.afterClosed().subscribe(res => {
    })

  }

  onAddClick() {
    const bot = this.botsService.createBot(this.exchange, this.market);

  }

  onActiveOrdersRefreshClick() {
    this.currentBot.refreshOpenOrders();

  }
}
