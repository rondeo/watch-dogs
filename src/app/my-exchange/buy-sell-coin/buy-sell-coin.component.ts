import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {VOBalance, VOMarket, VOOrder} from '../../amodels/app-models';
import {MarketCapService} from '../../market-cap/services/market-cap.service';

import * as _ from 'lodash';
import {MatSnackBar} from '@angular/material';

import {ApisPrivateService} from '../../adal/apis/api-private/apis-private.service';
import {ApiPrivateAbstaract} from '../../adal/apis/api-private/api-private-abstaract';
import {ApiMarketCapService} from '../../adal/apis/api-market-cap.service';
import {VOMCObj} from '../../amodels/api-models';
import {MATH} from '../../acom/math';

@Component({
  selector: 'app-buy-sell-coin',
  templateUrl: './buy-sell-coin.component.html',
  styleUrls: ['./buy-sell-coin.component.css']
})
export class BuySellCoinComponent implements OnInit {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private marketCap: ApiMarketCapService,
    private snackBar: MatSnackBar,
    private apisPrivate: ApisPrivateService
  ) {
  }

  isSellDisabled = false;
  isBuyDisabled = false;


  isCoinDay = false;
  exchange: string;
  market: string;
  coin: string;

  marketsAvailable: VOMarket[];
  currentMarket: VOMarket = new VOMarket();
  amountUS = 100;

  userRate: number;
  userPriceUS: number;
  basePriceUS: number;

  private sub1;
  private sub2;

  triggerOpenOrders = 0;
  triggerAllOrders = 0;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      console.warn(params);
      if (params.market) {
        this.setMarket(params.market);
      }
    });

    this.sub1 = this.route.params.subscribe(params => {
      console.log(params);
      this.exchange = params.exchange;
      const ar: string[] = params.coin.split('_');
      if (ar.length === 1) {
        this.coin = ar[0];
        this.getMarkets();
      } else {
        this.coin = ar[1];
        this.getMarkets(ar[0] + '_' + ar[1]);
      }
    });
  }

  setMarket(market: string) {
    if (this.market === market) return;
    const base = market.split('_')[0];
    if (!this.market || this.market.split('_')[0] !== base) {
      
      this.marketCap.getTicker().then(MC => {
        this.basePriceUS = MC[base].price_usd;
      });
    }
    this.market = market;

  }

  async getMarkets(marketSymbol?: string) {
    //  if (!this.MC) this.MC = await this.marketCap.getTicker();
   /* const markets = await this.myService.getMarketsForCoin(this.exchange, this.coin);
    if (markets.length === 0) {
      console.log(await this.myService.getAllMarkets());
      this.snackBar.open(' No Markets for ' + this.coin + ' on ' + this.exchange, 'x', {duration: 3000, panelClass: 'bg-red'});
    }
    this.marketsAvailable = markets;
    if (marketSymbol) {
      this.currentMarket = markets.find(function (item) {
        return item.base + '_' + item.coin === marketSymbol;
      });
      if (this.currentMarket) this.onMarketChanged(null);
      else this.currentMarket = new VOMarket();
    } else if (markets.length === 1) {
      this.currentMarket = markets[0];
      this.onMarketChanged(null);
    }
*/

  }

  onMarketChanged(evt) {
    const base = this.currentMarket.base;
    const coin = this.currentMarket.coin;
    // this.market = this.currentMarket.base + '_' + this.currentMarket.coin;
    /// console.log(this.market);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        market: base + '_' + coin
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });


  }

  async onPriceClick(rate: number) {
    this.userRate = rate;
    const basePrice = this.basePriceUS;
    this.userPriceUS = +(rate * basePrice).toFixed(3);

  }

  async onUserPriceChanged(price) {
    console.log(price);
    const basePrice = await this.basePriceUS;
    this.userPriceUS = +(this.userRate * basePrice).toFixed(3);
    // this.userRate = MATH.toValue(price / basePrice);
  }

  async onBuyClick() {
    const action = 'BUY';
    const market = this.market;
    const ar = market.split('_');
    const base = ar[0];
    const coin = ar[1];

    const basePriceUS = this.basePriceUS;
    const rate = this.userRate;
    let amountBase = this.amountUS / basePriceUS;
    const api = this.apisPrivate.getExchangeApi(this.exchange);

    const balanceBase = await api.getBalance(base);
   //  console.log(balanceBase);
    const left = balanceBase.available - amountBase;
    let isMax = false;
    if (left * basePriceUS < 10) {
      isMax = true;
      amountBase = balanceBase.available;
      amountBase = amountBase - (amountBase * 0.0025);

    }
    if ((amountBase * basePriceUS) < 1) {
      this.snackBar.open(
        'Amount ' + base + ' too low $' + (amountBase * basePriceUS).toFixed(4),
        'x', {panelClass: 'alert-red', duration: 5000});
      return;
    }

    const amountCoin = +(amountBase / rate).toFixed(8);
    this.confirmOrder(base, coin, action, rate, amountCoin, basePriceUS, isMax);
  }


  async onSellClick() {
    const action = 'SELL';
    const market = this.market;
    const ar = market.split('_');
    const base = ar[0];
    const coin = ar[1];
    const basePriceUS = this.basePriceUS;
    const rate = this.userRate;

    let amountCoin = +(this.amountUS / basePriceUS / rate).toFixed(8);
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    const balanceCoin = await api.getBalance(coin);
   //  console.log(balanceCoin);
    const left = (balanceCoin.available - amountCoin) * rate;
    let isMax = false;
    if (left * basePriceUS < 10) {
      isMax = true;
      amountCoin = balanceCoin.available;
    }
    this.confirmOrder(base, coin, action, rate, amountCoin, basePriceUS, isMax);
  }

  confirmOrder(base: string, coin: string, action: string, rate: number, amountCoin: number, priceBaseUS: number, isMax: boolean) {
    //  console.log(arguments);
    let msg;
    if (isNaN(rate) || isNaN(amountCoin) || isNaN(priceBaseUS)) {
      msg = ' rate: ' + rate + ' amountCoin: ' + amountCoin + ' priceBaseUS: ' + priceBaseUS;
      this.snackBar.open(msg, 'x', {panelClass: 'alert-red'});
      return;
    }

    action = action.toUpperCase();
    let rateUS = +(rate * priceBaseUS).toPrecision(4);
    if (!isMax) amountCoin = +(amountCoin).toPrecision(5);

    let amountUS = (amountCoin * rate * priceBaseUS).toFixed(0);
    let feeUS = (+amountUS * 0.0025).toFixed(2);
    console.log(action + ' ' + base + '_' + coin + ' amountCoin ' + amountCoin + ' rate ' + rate + ' baseUS ' + priceBaseUS);
    msg = action + '  ' + coin + ' \n' +
      'Price: $' + rateUS + ' \n' +
      'Amount: $' + amountUS + (isMax ? ' (max)' : '') + '\n' +
      'Fee: $' + feeUS;

    if (confirm(msg)) {
     /* this.placeOrder(action, base, coin, rate, amountCoin)
        .subscribe((order) => this.onResult(order), (err) => this.onError(err))
        */
    }
  }

  private onResult(res: VOOrder) {
    console.log(res);
    // let amountUS = (amountCoin * rate * this.MC[this.base].price_usd).toFixed(2);
    let msg = 'Order Set! ';

    if (res && res.uuid) {
      msg += ' id ' + res.uuid;
      if (res.amountCoin) {
        if (res.isOpen) {
          msg += ' OPEN';

        } else {
          msg += ' CLOSED';
        }
      }
      this.snackBar.open(msg, 'x', {panelClass: 'alert-green', duration: 2000});
      setTimeout(() => {
        this.refreshData(res.base, res.coin);
      }, 3000);

    } else {
      this.onError(res);
    }
  }

  private onError(error) {
    console.error(error);
    let msg;
    if (error.error) {
      if (error.error.msg) msg = error.error.msg;
      else msg = JSON.stringify(error.error);
    } else msg = error.message;

    this.snackBar.open('Error ' + msg, 'x', {panelClass: 'alert-red'});
  }

/*
  placeOrder(action: string, base: string, coin: string, rate: number, amountCoin: number): Observable<VOOrder> {
    let obs: Observable<VOOrder>;
    const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);
    if (action === 'SELL') obs = api.sellLimit(base, coin, amountCoin, rate);
    else if (action === 'BUY') obs = api.buyLimit(base, coin, amountCoin, rate);
    return obs;
  }
*/

  onAmountChanged(amount: number) {
    this.amountUS = amount;
  }

  refreshData(base, coin) {
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    api.refreshBalances();
    api.refreshAllOpenOrders();
  }

}
