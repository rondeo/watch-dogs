import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MyExchangeService} from '../services/my-exchange.service';
import {VOBalance, VOMarket, VOOrder} from '../../models/app-models';
import {MarketCapService} from '../../market-cap/services/market-cap.service';

import * as _ from 'lodash';
import {ApiBase} from '../services/apis/api-base';
import {MatSnackBar} from '@angular/material';
import {Observable} from 'rxjs/Observable';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOMCObj} from '../../models/api-models';

@Component({
  selector: 'app-buy-sell-coin',
  templateUrl: './buy-sell-coin.component.html',
  styleUrls: ['./buy-sell-coin.component.css']
})
export class BuySellCoinComponent implements OnInit {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private myService: MyExchangeService,
    private marketCap: ApiMarketCapService,
    private snackBar: MatSnackBar,
    private apisPrivate: ApisPrivateService
  ) {
  }

  isCoinDay = false;
  exchange: string;
  market: string;
  coin: string;
  base: string;
  marketsAvailable: VOMarket[];
  currentMarket: VOMarket = new VOMarket();

  balanceBaseUS: number;
  balanceCoinUS: number;

  balanceBase: VOBalance;
  balanceCoin: VOBalance;

  amountUS = 100;

  balances: VOBalance[];

  MC: VOMCObj;

  userPriceUS: number;

  private sub1;

  isSellDisabled = true;
  isBuyDisabled = true;

  orderId: string;
  lastOrder: VOOrder;

  ngOnInit() {

    /*  this.sub2 = this.apiService.connector$().subscribe(connector=>{
        this.currentAPI = connector;
        if(!connector) return;

        this.currentAPI.balances$().subscribe(balances=>{
          this.setBalances();
        });*/

    this.route.queryParams.subscribe(params => {
      console.warn(params);
      if(params.market && params.market !== this.market) {
        this.market = params.market;
        this.getBalances();
      }

    })

    this.sub1 = this.route.params.subscribe(params => {
      console.log(params)
      this.exchange = params.exchange;
      const ar: string[] = params.coin.split('_');
      if (ar.length === 1) {
        this.coin = ar[0];
        this.getMarkets();
      } else {
        this.coin = ar[1]
        this.getMarkets(ar[0] + '_' + ar[1]);
      }

    });

  }

  isLoadinBalances = false;

  async getBalances(isRefresh = false) {
    this.isLoadinBalances = true;
    const base = this.currentMarket.base, coin = this.currentMarket.coin
    const balances: VOBalance[] = await this.myService.getBalances(this.exchange, [base, coin], isRefresh);
    this.balanceBase = _.find(balances, {symbol: base})
    this.balanceCoin = _.find(balances, {symbol: coin})

    if (!this.balanceCoin) {
      this.balanceCoin = new VOBalance();
      this.balanceCoin.symbol = coin;
      this.balanceCoin.balance = 0;
    }
    if (!this.balanceCoin) {
      this.balanceBase = new VOBalance();
      this.balanceBase.symbol = base;
      this.balanceCoin.balance = 0;
    }

    this.balanceBaseUS = Math.round(this.balanceBase.balance * this.MC[base].price_usd);
    this.balanceCoinUS = Math.round(this.balanceCoin.balance * this.MC[coin].price_usd);
    this.isBuyDisabled = this.balanceBaseUS < 1;
    this.isSellDisabled = this.balanceCoinUS < 1;
    this.isLoadinBalances = false;
    // console.log(this.balanceBase, this.balanceCoin);
  }

  async downloadTrades() {
    const base = this.currentMarket.base, coin = this.currentMarket.coin;

  }


  async getMarkets(marketSymbol?: string) {
    if (!this.MC) this.MC = await this.marketCap.getData();
    const markets = await this.myService.getMarketsForCoin(this.exchange, this.coin);
    if (markets.length === 0) {
      console.log(await this.myService.getAllMarkets(this.exchange));
      this.snackBar.open(' No Markets for ' + this.coin + ' on ' + this.exchange, 'x', {duration: 3000, extraClasses: 'alert-red'});
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
      this.onMarketChanged(null)
    }
  }

  onMarketChanged(evt) {
    this.base = this.currentMarket.base;
    this.coin = this.currentMarket.coin;
    this.market = this.currentMarket.base + '_' + this.currentMarket.coin;
    /// console.log(this.market);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        market: this.market
      },
      queryParamsHandling: 'merge'
     // skipLocationChange: true
    });


  }

  onRefreshBalancesClick() {
    this.getBalances(true);
  }


  onPriceClick(price: number) {
    this.userPriceUS = price;

  }

  onUserPriceChanged(price) {
    console.log(price);
  }

  onBuyClick() {
    const action = 'BUY';

    const priceBaseUS = this.MC[this.base].price_usd;

    const rate = +(this.userPriceUS / priceBaseUS).toPrecision(5);

    let amountCoin = +(this.amountUS / priceBaseUS / rate).toFixed(8);


    const left = this.balanceBase.balance - (amountCoin * rate);

    let isMax = false;
    if (left < (this.balanceBase.balance * 0.0025)) {
      isMax = true;
      let amountBase = this.balanceBase.balance;
      amountBase = amountBase - (amountBase * 0.0025);
      amountCoin = +(amountBase / rate).toFixed(8);
    }

    this.confirmOrder(action, rate, amountCoin, priceBaseUS, isMax);
  }


  onSellClick() {
    const action = 'SELL';
    const priceBaseUS = this.MC[this.base].price_usd;
    const rate = +(this.userPriceUS / priceBaseUS).toPrecision(5)

    let amountCoin = +(this.amountUS / priceBaseUS / rate).toFixed(8);

    const left = this.balanceCoin.balance - amountCoin;
    let isMax = false;
    if ((left * this.MC[this.coin].price_usd) < 10) {
      isMax = true;
      amountCoin = this.balanceCoin.balance;
    }

    this.confirmOrder(action, rate, amountCoin, priceBaseUS, isMax);
  }

  confirmOrder(action: string, rate: number, amountCoin: number, priceBaseUS: number, isMax: boolean) {
    //  console.log(arguments);
    if (!this.base || !this.coin || isNaN(rate) || isNaN(amountCoin) || isNaN(priceBaseUS)) {
      const msg = this.base + this.coin + ' rate: ' + rate + ' amountCoin: ' + amountCoin + ' priceBaseUS: ' + priceBaseUS
      this.snackBar.open(msg, 'x', {extraClasses: 'alert-red'});
      return
    }
    const base = this.base;
    const coin = this.coin;
    action = action.toUpperCase();
    let rateUS = +(rate * priceBaseUS).toPrecision(4);
    amountCoin = +(amountCoin).toPrecision(5);
    let amountUS = (amountCoin * rate * priceBaseUS).toFixed(0);
    let feeUS = (+amountUS * 0.0025).toFixed(2);
    console.log(action + ' ' + base + '_' + coin + ' amountCoin ' + amountCoin + ' rate ' + rate + ' baseUS ' + priceBaseUS);

    const msg = action + '  ' + coin + ' \n' +
      'Price: $' + rateUS + ' \n' +
      'Amount: $' + amountUS + (isMax ? ' (max)' : '') + '\n' +
      'Fee: $' + feeUS;

    if (confirm(msg)) {
      this.placeOrder(action, base, coin, rate, amountCoin)
        .subscribe((order) => this.onResult(order), (err) => this.onError(err))
    }
  }


  private onResult(res: VOOrder) {
    console.log(res);
    // let amountUS = (amountCoin * rate * this.MC[this.base].price_usd).toFixed(2);

    if (res && res.uuid) {
      const msg = res.uuid;

      if (res.amountCoin) {
        this.showOrder(res);
        if (res.isOpen) {
          this.checkOrder(res.uuid);
        }
      } else this.checkOrder(res.uuid);

      this.snackBar.open('Order Set! ' + msg, 'x', {extraClasses: 'alert-green', duration: 2000});
      setTimeout(() => {
        this.getBalances(true);
      }, 3000);

    } else {
      this.onError(res);
    }
  }

  private onError(error) {
    this.snackBar.open('Error ' + error.message, 'x', {extraClasses: 'alert-red'});
  }

  placeOrder(action: string, base: string, coin: string, rate: number, amountCoin: number): Observable<VOOrder> {

    let obs: Observable<VOOrder>;
    const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);
    if (action === 'SELL') obs = api.sellLimit(base, coin, amountCoin, rate);
    else if (action === 'BUY') obs = api.buyLimit(base, coin, amountCoin, rate);
    return obs;
  }

  checkOrder(orderId) {
    this.orderId = orderId;
    const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);
    api.getOrder(orderId, this.base, this.coin).subscribe(res => {
      console.warn(res);

      if (res.amountCoin) {
        this.showOrder(res);
        this.orderId = null;
      }


      if (res.isOpen) {
        setTimeout(() => this.checkOrder(orderId), 5000);
        this.snackBar.open('Order in progress', 'x', {extraClasses: 'alert-red', duration: 2000});
      } else {
        this.orderId = null;
        this.getBalances(true);
      }
    })

  }

  onAmountChanged(amount: number) {
    this.amountUS = amount;
  }

  onCancelOrderClick() {
    if (!this.orderId) return;
    const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);
    api.cancelOrder(this.orderId).subscribe(order => {
      if (order.isOpen) {
        this.snackBar.open('Cancel Order ' + this.orderId, 'x', {extraClasses: 'alert-red', duration: 2000});
        setTimeout(() => this.onCancelOrderClick(), 5000);
      } else {
        this.snackBar.open('Order Canceled ', 'x', {extraClasses: 'alert-green', duration: 5000});
        this.orderId = null;
        this.getBalances(true);
      }
    })
  }

  showOrder(order: VOOrder) {
    order.action = order.action==='B'?'Buy': 'Sell';
    const coinMC = this.MC[order.coin];
    const baseMC = this.MC[order.base];
    order.feeUS = +(order.fee *  baseMC.price_usd).toFixed(2)
    order.priceUS = +(order.rate * baseMC.price_usd).toPrecision(4);
    order.amountUS = +(order.amountCoin * coinMC.price_usd).toFixed(0);
    this.lastOrder = order;
  }
}
