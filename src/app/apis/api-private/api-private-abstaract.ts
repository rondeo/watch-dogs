import {VOBalance, VOOrder} from '../../models/app-models';
import {Observable} from 'rxjs/Observable';
import {StorageService} from '../../services/app-storage.service';
import {reject} from 'q';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {UtilsBooks} from '../../com/utils-books';
import {LoginStatus, UserLoginService} from '../../services/user-login.service';
import {WatchDog} from '../../models/watch-dog';
import * as _ from 'lodash';
import * as moment from 'moment';
import {BehaviorSubjectMy} from '../../com/behavior-subject-my';

export abstract class ApiPrivateAbstaract {

  abstract exchange: string;
  // balances: VOBalance[];


  apiPublic: any;

  /* credetialsSub:BehaviorSubject<{apiKey:string, password: string}> = new BehaviorSubject(null);
   credentials$(){

     return this.credetialsSub.asObservable();
   }

   */


  loginSub: Subject<boolean> = new Subject()

  userLogin$() {
    return this.loginSub.asObservable();  // TOD dipatch  call after user login this.userLogin.exchangeLogin$();
  }

  private credentials: { apiKey: string, password: string };

  constructor(private userLogin: UserLoginService) {

  }

  /* sellCoin(sellCoin: WatchDog): Observable<WatchDog> {
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
  cancelOrder2(orderId: string, market: string): Promise<VOOrder> {
    return new Promise<VOOrder>((resolve, reject) => {
      const ar = market.split('_');
      this.cancelOrder(orderId, ar[0], ar[1]).subscribe(order => {
        this.refreshBalances();
        this.refreshAllOpenOrders();
      }, reject)
    })
  }

  abstract cancelOrder(orderId, base?: string, coin?: string): Observable<VOOrder>;

  abstract getOrder(orderId, base: string, coin: string): Observable<VOOrder>;


  stopRefreshInterval() {
    clearInterval(this.refreshBalancesInterval);
    this.refreshBalancesInterval = null;
  }

  refreshBalancesInterval;

  startRefreshBalances(delay?: number) {
    if (!delay) delay = 10;
    if (this.refreshBalancesInterval) return;
    this.refreshBalancesInterval = setInterval(() => this.refreshBalances(), delay * 1000);
  }

  balancesSub: BehaviorSubject<VOBalance[]> = new BehaviorSubject(null);
  isLoadingBalances: boolean;

  refreshBalances() {
    if (!this.isLoadingBalances) {
      this.downloadBalances().subscribe(balances => {
        this.isLoadingBalances = false;
        // console.log('balances ' + this.exchange)
        //console.log(moment().format('HH:mm a') + ' new balances ', balances);
        this.balancesSub.next(balances)
      }, error => {
        this.isLoadingBalances = false;
      })
    }
  }

  openOrdersSub = new BehaviorSubject(null);

  openOrders$(base: string, coin: string) {
    const sub: Subject<VOOrder[]> = new Subject<VOOrder[]>();
    this.openOrdersSub.subscribe(res => {
      if (!res) return;
      const orders: VOOrder[] = res.filter(function (item: VOOrder) {
        return item.base === base && item.coin === coin;
      });
      setTimeout(() => sub.next(orders), 20);
    })
    /* this.getOpenOrders(base, coin).subscribe(res =>{
       console.warn(res);
     })*/
    return sub.asObservable()
  }

  refreshOrdersTimeout;
  isRefershOpenOrders;

  refreshAllOpenOrders() {
   //  console.log(' refreshAllOpenOrders  ' + this.isRefershOpenOrders);
    if (this.isRefershOpenOrders) {
      console.warn(' refreshing ')
      return;
    }
    this.isRefershOpenOrders = true;
    this.getAllOpenOrders().subscribe(res => {
      this.isRefershOpenOrders = false;
      if (res.length) {
        clearTimeout(this.refreshOrdersTimeout);
        this.refreshOrdersTimeout = setTimeout(() => {
         // console.log(' refreshAllOpenOrders by timeout  ');
          this.refreshAllOpenOrders()
        }, 30000);
      }
      else console.log(' stop refreshing open orders ');
      // const old: VOOrder[] = this.openOrdersSub.getValue();
      //if(!old  || old.length !== res.length) this.ref
      this.openOrdersSub.next(res);
    }, err => {
      this.isRefershOpenOrders = false;
    });
  }

  allOrdersSub = new BehaviorSubject(null);

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
      this.sellLimit(ar[0], ar[1], quantity, rate).subscribe(order => {
        resolve(order);
        this.refreshAllOpenOrders();
        this.refreshBalances();
      }, reject);
    })
  }

  buyLimit2(market: string, quantity: number, rate: number): Promise<VOOrder> {
    const ar = market.split('_');
    return new Promise((resolve, reject) => {
      this.buyLimit(ar[0], ar[1], quantity, rate).subscribe(order => {
        resolve(order);
        this.refreshAllOpenOrders();
        this.refreshBalances();
      }, reject);
    })
  }


  async stopLoss2(market: string, quantity: number, stopPrice: number, percent:number) {
    return this.stopLoss(market, quantity, stopPrice, percent).then(res =>{
      this.refreshAllOpenOrders();
      this.refreshBalances();
      return res;
    })

  }

  async stopLoss(market: string, quantity: number, stopPrice: number, percent:number) {

    return null;
  }


  takeProfit(market: string, quantity: number, stopPrice: number) {

  }

  abstract downloadBalances(): Observable<VOBalance[]>;


  abstract sellLimit(base: string, coin: string, quantity: number, rate: number): Observable<VOOrder>

  abstract buyLimit(base: string, coin: string, quantity: number, rate: number): Observable<VOOrder>

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

  getAllOpenOrders(): Observable<VOOrder[]> {
    return null;
  }

  getAllOrders2(market: string, from: number, to: number) {
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
