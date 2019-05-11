import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material';
import {OrderType, VOOrder} from '../../amodels/app-models';
import * as _ from 'lodash';
import {ApiMarketCapService} from '../../a-core/apis/api-market-cap.service';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/internal/Observable';
import {filter, skip} from 'rxjs/operators';
import {AppBotsService} from '../../a-core/app-services/app-bots-services/app-bots.service';
import {MarketOrderModel} from '../../amodels/market-order-model';
import {UsdtBtcMarket} from '../../a-core/app-services/app-bots-services/usdt-btc-market';
import {TradeMarketService} from '../../a-core/services/trade-market.service';
import {MarketBot} from '../../a-core/app-services/app-bots-services/market-bot';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {MATH} from '../../acom/math';
import {Utils} from 'tslint';
import {UTILS} from '../../acom/utils';

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


    /* this.route.params.subscribe(params => {
       console.warn(params);
       if (this.market !== params.market) {
         this.market = params.market;
       }

       console.log(this.exchange);
       if (params.exchange === 'null') {

         console.warn(' exhange null ')
       } else if (this.exchange !== params.exchange) {

         this.exchange = params.exchange;
         console.log(' exchange ' + this.exchange);
         const api: ApiPublicAbstract = this.apisPublic.getExchangeApi(this.exchange);
         if (!api) {
           console.warn('no api for ' + this.exchange);
           return
         }
         const market = this.market;

         this.markets$ = api.markets$.pipe(map(markets => {
           console.log(markets);
           console.log(markets.indexOf(market));
           if (markets.indexOf(market) === -1) {
             this.market = null;
             this.onMarketChanged(null);
           }
           return markets.sort();
         }));

       } else {
         console.warn(' same exchange');
       }
     });*/
    // this.subscribe();

  }

  ngOnDestroy() {
    this.unsubscribe();
  }


  subscribe() {
    //  const ar = this.market.split('_');

    /*const hist = this.candleService.getCandlesHist(this.exchange, this.market);
    hist.candles$().subscribe(candles=>{
      if(!candles) return;
      //console.log(' NEW CANDLES ', _.last(candles));
      this.candles = _.clone(candles);

      this.volumes = candles.map(function (item) {
        return  item.close > item.open?item.Volume: -item.Volume;

      });
      this.drawSignals();
    });
*/


    /*  const ctr = this.marketsHistory.getOrdersHistory(this.exchange, this.market);

      this.sub1 = ctr.ordersVolumeAlerts$(20).subscribe(diff => {
        // console.warn('diff  ', diff);
        this.snackBar.open(' Volume ' + this.exchange + ' ' + this.market + ' ' + diff + '%', 'x');
      });
      this.marketCap.getTicker().then(MC => {
        const coinPrice = MC[ar[1]].price_usd;
        const coinAmount = 20000 / coinPrice;


        this.sub3 = ctr.sharksHistory$(200).subscribe(res => {
          if (!res) return;
          // console.log(' sharksHistory$ ',res);
          this.fishes = _.clone(res).reverse();
          this.drawSignals();

        });

        this.sub2 = ctr.sharksAlert$(coinAmount).subscribe(orders => {
          console.log('new fishes ', orders);
          //  this.drawSignals();
          // this.fishes = _.uniqBy(this.fishes.reverse().concat(orders).reverse().slice(0,100), 'uuid');
          // this.storage.upsert('fishes', this.fishes);

        });
      });*/
  }

 /* async drawSignals() {
    const candles = this.candles;
    let fishes: VOOrderExt[] = _.clone(this.fishes).reverse();

    if (!fishes.length || !candles.length) return;
    const startTime = candles[0].to;
    const length = candles.length;
    let endTime = _.last(candles).to;
    fishes = fishes.filter(function (item) {
      return item.timestamp > startTime;
    });

    const lastFishTime = _.last(fishes).timestamp;

    if (lastFishTime > endTime) endTime = lastFishTime;

    const step = (endTime - startTime) / length;
    endTime += step;
    const ordersAr = [];
    for (let i = startTime; i < endTime; i += step) {
      const fAr = [];
      while (fishes.length && fishes[0].timestamp < i) fAr.push(fishes.shift());
      ordersAr.push(fAr);
    }
    const signals = ordersAr.map(function (far) {
      let val = 0;
      if (!far.length) return 0;
      far.forEach(function (item) {
        if (item.orderType === 'BUY') val += item.amountUS;
        else val -= item.amountUS;
      });
      return val;
    });
    console.log(_.last(signals));
    this.triggers1 = signals;
  }
*/
  unsubscribe() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub1.unsubscribe();
  }

  /*getData() {
    clearInterval(this.interval);
    this.isRequesting = true;

    this.interval = setInterval(() => this.getData(), 60 * 1000);

    const api: ApiPublicAbstract = this.apiPublic.getExchangeApi(this.exchange);
    if (!api) throw new Error(' no api for ' + this.exchange);


    const ar = this.market.split('_');
    api.getCandlesticks(ar[0], ar[1], 100).then(res => {
      const highs = [];
      const closes = [];
      const lows = [];
      res.forEach(function (item) {
        closes.push(Math.round(item.close * 1e8));
        lows.push(Math.round(item.low * 1e8));
        highs.push(Math.round(item.high * 1e8));
      });

      this.closes = closes;
      this.highs = highs;
      this.lows = lows;
      this.candles = res;
      setTimeout(() => {
        this.isRequesting = false;
      }, 500);

    }, err => {
      this.isRequesting = false;
      this.snackBar.open('Error communication', 'x', {panelClass: 'error'})
    });

    /!* api.downloadMarketHistory(ar[0], ar[1]).subscribe(res =>{
      this.ordersHistory = res;
     })*!/
  }*/

/*
  onResSupChange(evt) {
    const ar = this.overlays.slice(0);
    const ind = ar.indexOf(EnumOverlay.SUPPORT_RESISTANCE);
    if (evt.checked && ind === -1) {

      ar.push(EnumOverlay.SUPPORT_RESISTANCE);
      this.overlays = ar;
    } else {
      if (ind !== -1) ar.splice(ind, 1);
    }
    this.overlays = ar;
  }
*/

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

    const sub = this.marketService.priceBuy$.pipe(skip(1)).subscribe(price => {
      this.price = price;
      sub.unsubscribe()
    });

    this.marketService.market$.next(bot.market);
    if(this.currentBot) this.currentBot.selected = false;
    this.currentBot = bot;
    bot.selected = true;
    this.myOrders$ = bot.orders$;
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

  onBuyClick() {
    const pots = this.amountPots;
    let price = +this.price;
    if(isNaN(price)) return;
   //  if(!price) price = this.marketService.priceBuy$.getValue();
    const exchange = this.marketService.exchange$.getValue();
    const market = this.marketService.market$.getValue();
    const bot: MarketBot = this.botsService.getBot(exchange, market);
    bot.setBuyOrder(price, pots, this.stopLoss);
   // bot.addPots(pots);

  }

  onSellClick() {
    const pots = this.amountPots;
    const price = +this.price;
    if(isNaN(price)) return;
    const exchange = this.marketService.exchange$.getValue();
    const market = this.marketService.market$.getValue();
    const bot: MarketBot = this.botsService.getBot(exchange, market);
    bot.setSellOrder(price, pots, this.stopLoss);
  }

  onAmountChanged() {
    const pots = this.amountPots;
    if(isNaN(pots)) return;
    this.marketService.pots$.next(pots)

  }

  onPriceBuyClick() {
    this.price = MATH.toPrecision(this.marketService.priceBuy$.getValue(), 4);
    this.calculateStopLoss();
  }

  onPriceSellClick() {
    this.price =  MATH.toPrecision(this.marketService.priceSell$.getValue(), 4);
    this.calculateStopLoss();
  }

  onStopLossPercentChanged() {
   this.calculateStopLoss();

  }

  onDeleteOrderClick(order: VOOrder) {
    if(!this.currentBot) return;
    this.currentBot.removeOrder(order)
  }

  onRefreshBooksClick() {
    this.marketService.refreshBooks();
  }

  onDeleteBotClick(bot: MarketBot) {
    const msg = ' Delete ' + bot.id + '?';
    if(confirm(msg)) {
      this.botsService.deleteBot(bot)
    }
  }

  onPriceChanged() {
   this.calculateStopLoss();
  }

  calculateStopLoss(){
    const num = this.price - (this.price * (this.stopLossPercent/100));
    this.stopLoss = MATH.toPrecision(num, 4);//+num.toString().substr(0,this.marketService.marketPrecision)
  }

  onCurrentLiquidSaveClick(bot: MarketBot) {
    bot.setNewLiquidPrice();
    bot.isPriceLiquidEdit = false;
  }

  onPriceLiquidClick(bot: MarketBot) {
    bot.isPriceLiquidEdit = true;
  }

  onCancelEditClick(bot: MarketBot) {
    bot.isPriceLiquidEdit = false;
  }

  onBotPriceSellClick(bot: MarketBot) {
    bot.downloadBooks();
  }

  onBotSellClick(bot: MarketBot) {
    bot.sellCoinInstant();
  }
}
