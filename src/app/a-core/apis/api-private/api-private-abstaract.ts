import {VOBalance, VOOrder} from '../../../amodels/app-models';

import {StorageService} from '../../services/app-storage.service';
import {reject} from 'q';


import {UtilsBooks} from '../../../acom/utils-books';
import {LoginStatus, UserLoginService} from '../../services/user-login.service';
import {MarketOrderModel} from '../../../amodels/market-order-model';
import * as _ from 'lodash';
import * as moment from 'moment';
import {BehaviorSubjectMy} from '../../../acom/behavior-subject-my';
import {Subject} from 'rxjs/internal/Subject';
import {Observable} from 'rxjs/internal/Observable';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {filter, map} from 'rxjs/operators';
import {MyOrder} from '../../app-services/app-bots-services/bot-base';

export abstract class ApiPrivateAbstaract {

  abstract exchange: string;
  apiPublic: any;
  loginSub: Subject<boolean> = new Subject()

  userLogin$() {
    return this.loginSub.asObservable();  // TOD dipatch  call after user login this.userLogin.exchangeLogin$();
  }

  private credentials: { apiKey: string, password: string };

  constructor(private userLogin: UserLoginService) {
    this.refreshBalancesInterval = setInterval(() => {
      this.refreshBalances();
      console.log(this.exchange + ' orders history markets: ' + this.refreshAllOrdersHistoryNow());
    }, 60000);

  }

  /* sellCoin(sellCoin: MarketOrderModel): Observable<MarketOrderModel> {
     if (!sellCoin.coinUS) throw new Error(' need coin price')
     return this.getBalance(sellCoin.coin).switchMap(balance => {
       // console.log(balance);
       if (balance.balance * sellCoin.coinUS < 10) {
         sellCoin.balanceCoin = 0;
       } else sellCoin.balanceCoin = balance.balance;

       if (!sellCoin.balanceCoin) {
         sellCoin.balanceCoin = 0;
         return Observable.of(sellCoin);
       }

       return this.apiPublic.downloadBooks(sellCoin.base, sellCoin.coin).switchMap(books => {
         // console.log(books);

         let rate = UtilsBooks.getRateForAmountCoin(books.buy, sellCoin.balanceCoin);
         const myCoinprice = sellCoin.baseUS * rate;
         // sellCoin.booksDelta = +(100 * (myCoinprice - sellCoin.coinUS) / sellCoin.coinUS).toPrecision(2);
         rate = +(rate - (rate * 0.01)).toFixed(8);
         return this.sellLimit(sellCoin.base, sellCoin.coin, sellCoin.balanceCoin, rate).switchMap(order => {
           console.log(order);
           if (order.uuid) {
             sellCoin.id = order.uuid;
             return this.getOrder(order.uuid, sellCoin.base, sellCoin.coin).switchMap(order => {

               return Observable.of(sellCoin)
             })

           } else throw new Error(order.message)


         })


       })


     })

   }*/
/*

  cancelOrder2(orderId: string, market: string): Promise<VOOrder> {
    return new Promise<VOOrder>((resolve, reject) => {
      const ar = market.split('_');
      this.cancelOrder(orderId, ar[0], ar[1]).subscribe(order => {
        this.refreshBalances();
        this._refreshAllOpenOrders();
      }, reject)
    })
  }
*/

  cancelOrder2(orderId: string, market: string) {
    let base: string;
    let coin: string;
    if(market) {
      const ar = market.split('_');
      base = ar[0];
      coin = ar[1];
    }

    console.log('CANCEL ORDER ' + orderId);
    return this.cancelOrder(orderId, base, coin).pipe(map(res => {

      console.log(' cancel order result ', res);
      this.refreshOpenOrdersNow();
      return res;
    }))
  }

  abstract cancelOrder(orderId, base?: string, coin?: string): Observable<VOOrder>;

  abstract getOrder(orderId, base: string, coin: string): Observable<VOOrder>;


  /* stopRefreshInterval() {
     clearInterval(this.refreshBalancesInterval);
     this.refreshBalancesInterval = null;
   }*/

  refreshBalancesInterval;

  /*startRefreshBalances(delay?: number) {
    if (!delay) delay = 60;
    if (this.refreshBalancesInterval) return;

  }*/


  private _refreshBalances() {
    console.log('%c _refreshBalances ' + this.exchange, 'color:pink');
    if (!this.balancesSub) {
      //  console.warn(' no balancesSub ' + this.exchange);
      return;
    }
    this.downloadBalances().subscribe(balances => {

      this.balancesSub.next(balances);
      this.loadingBalances = 0;
    }, error => {
      //   setTimeout(() => this._refreshBalances(), 50000);
    });
  }

  balancesSub: BehaviorSubject<VOBalance[]>;
  loadingBalances;

  refreshBalances() {
    if (this.loadingBalances) return;
    this.loadingBalances = setTimeout(() => this._refreshBalances(), 3000);

  }

  //////////////////////////////// Open Orders ////////////////////////////////////////////////////////////
 /* getAllOpenOrders(): VOOrder[] {
    return this._openOrdersAll$.getValue();
  }

  allOpenOrders$(): Observable<VOOrder[]> {
    if (!this._openOrdersAll$) {
      this._openOrdersAll$ = new BehaviorSubject(null);
      this.refreshAllOpenOrders();
    }
    return this._openOrdersAll$.asObservable();
  }
*/
  get openOrdersAll$() {
    return this._openOrdersAll$.pipe(filter(v => !!v));
  }

  _openOrdersAll$: BehaviorSubject<VOOrder[]> = new BehaviorSubject(null);

  openOrders$(base: string, coin: string) {
    const sub: Subject<VOOrder[]> = new Subject<VOOrder[]>();
    this._openOrdersAll$.subscribe(res => {
      if (!res) return sub.asObservable();
      const orders: VOOrder[] = res.filter(function (item: VOOrder) {
        return item.base === base && item.coin === coin;
      });
      setTimeout(() => sub.next(orders), 20);
    })
    return sub.asObservable()
  }

  /*stopRefreshOpenOrders() {
    clearTimeout(this.refreshOrdersTimeout);
    this.refreshOrdersTimeout = null;
  }
*/


  refreshOpenOrdersNow(): Promise<VOOrder[]> {
    clearTimeout(this.refreshOrdersTimeout);
    return this._refreshAllOpenOrders();
  }
  refreshOrdersTimeout;

  private _refreshAllOpenOrders(): Promise<VOOrder[]> {
    return new Promise((resolve, reject) => {
      const num = this._openOrdersAll$.observers.length;
      if(!num) return;
      console.log('%c _refreshAllOpenOrders ' + this.exchange + ' ', 'color:pink');
      this.downloadAllOpenOrders().subscribe(res => {
        console.log( this.exchange + ' open orders ', res)
       /* if(res.length) {
          this.refreshOrdersTimeout = setTimeout(() => {
            this._refreshAllOpenOrders();
          }, 25000);
        }*/
        this._openOrdersAll$.next(res);
        resolve(res);
      }, err => {
        reject(err);
        this.refreshOrdersTimeout = setTimeout(() => {
          this._refreshAllOpenOrders();
        }, 5000);
        /* this.refreshOrdersTimeout = setTimeout(() => {
           this.refreshAllOpenOrders();
         }, 50000);*/
      });    //
    })

  }






  //////////////////////////////////////////////////////////////////////////////////
  allOrdersSub = new BehaviorSubject(null);
  private progressOrdersHistory;
  private refreshOrdersHistoryMarkets(markets: string[]) {
    const market = markets.shift();
    if(!market) {
      this.progressOrdersHistory = null;
      return;
    }
    const now = moment().valueOf();
    const from = moment().subtract(1, 'day').valueOf();
    const bs: BehaviorSubject<VOOrder[]> = this._ordersHistory[market];
    this.progressOrdersHistory = setTimeout(() =>this.refreshOrdersHistoryMarkets(markets), 10000);

    this.downloadOrdersHistory(market, from, now).subscribe(orders => {
      orders = orders.map(function (item: any) {
        item.orderType = item.action;
        return new MyOrder(item)
      });
      bs.next(orders);
    });
  }

  refreshAllOrdersHistoryNow() {
    if(this.progressOrdersHistory) return null;
    for(let str in this._ordersHistory) {
      const bs: BehaviorSubject<VOOrder[]> = this._ordersHistory[str];
      if(bs.observers.length === 0) delete  this._ordersHistory[str];
    }
    const markets = Object.keys(this._ordersHistory);
    this.refreshOrdersHistoryMarkets(markets);
    return  markets;
  }
  private _ordersHistory: {[market: string]: BehaviorSubject<VOOrder[]>} = {};

  ordersHistory$(market: string) {
    if(!this._ordersHistory[market]) this._ordersHistory[market] = new BehaviorSubject(null);
    return this._ordersHistory[market].pipe(filter(v => !!v));
  }

  allOrders$(base: string, coin: string) {
    const sub: Subject<VOOrder[]> = new Subject<VOOrder[]>();
    this.allOrdersSub.subscribe(res => {
      // console.warn(res);
      if (!res) return;
      const orders: VOOrder[] = res.filter(function (item: VOOrder) {
        return item.base === base && item.coin === coin;
      });
      setTimeout(() => sub.next(orders), 20);
    })
    return sub.asObservable()
  }

  refreshAllOrders(base: string, coin: string, from: number, to: number) {
    this.getAllOrders(base, coin, from, to).subscribe(res => this.allOrdersSub.next(res));
  }


  balances$() {
    if (!this.balancesSub) {
      this.balancesSub = new BehaviorSubject(null);
      this.refreshBalances();
    }
    return this.balancesSub.pipe(filter(res => !!res));
  }

  balance$(symbol: string): Observable<VOBalance> {
    const sub: Subject<VOBalance> = new Subject<VOBalance>();
    this.balancesSub.asObservable().subscribe(balances => {
      if (balances) {
        //  console.log(balances);
        setTimeout(() => sub.next(_.find(balances, {symbol: symbol})), 20);
      } else this.refreshBalances();
    });
    return sub;

  }


  async getBalance(symbol: string): Promise<VOBalance> {
    if (this.balancesSub.getValue()) {
      const bal = _.find(this.balancesSub.getValue(), {symbol: symbol});
      return Promise.resolve(bal)
    }
    return new Promise<VOBalance>((resolve, reject) => {
      this.downloadBalances().subscribe(bals => {
        resolve(_.find(bals, {symbol: symbol}));
        this.balancesSub.next(bals);
      }, reject);
    });
  }

  sellLimit2(market: string, quantity: number, rate: number): Promise<VOOrder> {
    const ar = market.split('_');
    return new Promise((resolve, reject) => {
      this.sellLimit(ar[0], ar[1], quantity, rate).then(order => {
        resolve(order);
        // this.refreshAllOpenOrders();
        //this.refreshBalances();
      }, reject);
    })
  }

  buyLimit2(market: string, quantity: number, rate: number): Promise<VOOrder> {
    const ar = market.split('_');
    return new Promise((resolve, reject) => {
      this.buyLimit(ar[0], ar[1], quantity, rate).then(order => {
        resolve(order);
        // this.refreshBalances();
       //  this.refreshOpenOrdersNow();
      }, reject);
    })
  }

  async stopLoss(market: string, quantity: number, stopPrice: number, sellPrice: number) {
    return this._stopLoss(market, quantity, stopPrice, sellPrice).then(res => {
    //   this.refreshBalances();
     //  this.refreshOpenOrdersNow();

      return res;
    });

  }

  async _stopLoss(market: string, quantity: number, stopPrice: number, sellPrice: number) {

    return null;
  }

  takeProfit(market: string, quantity: number, stopPrice: number) {

  }

  abstract downloadBalances(): Observable<VOBalance[]>;


  abstract async sellLimit(base: string, coin: string, quantity: number, rate: number): Promise<VOOrder>

  abstract async buyLimit(base: string, coin: string, quantity: number, rate: number): Promise<VOOrder>

  resetCredetials() {
    this.credentials = null;
  }

  getCredentials(): { apiKey: string, password: string } {
    return this.credentials;
  }

  getOpenOrders2(market: string): Promise<VOOrder[]> {
    const ar = market.split('_');
    return new Promise((resolve, reject) => {
      this.getOpenOrders(ar[0], ar[1]).subscribe(orders => {
        resolve(orders);
      }, reject);
    })


  }

  getOpenOrders(base: string, coin: string): Observable<VOOrder[]> {

    return null;
  }

  downloadAllOpenOrders(): Observable<VOOrder[]> {
    return null;
  }

  downloadOrdersHistory(market: string, from: number, to: number) {
    const ar = market.split('_');
    return this.getAllOrders(ar[0], ar[1], from, to);
  }

  getAllOrders(base: string, coin: string, from: number, to: number): Observable<VOOrder[]> {

    return null;
  }

  createLogin() {
    return this.userLogin.getExchangeCredentials(this.exchange).then(str => {
      this.credentials = JSON.parse(str);
      return this.credentials;
    })
  }
}
