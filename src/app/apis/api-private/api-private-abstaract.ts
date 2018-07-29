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

  abstract cancelOrder(orderId, base?: string, coin?: string): Observable<VOOrder>;

  abstract getOrder(orderId, base: string, coin: string): Observable<VOOrder>;

  isTickBalance = false;
  tickRefreshBalance(){
    if(this.isTickBalance) return;
    this.isTickBalance = true;
    setTimeout(() => {
      this.isTickBalance = false;
      this.refreshBalances();
    }, 5 * 60 * 1000);
  }

  balancesSub: BehaviorSubject<VOBalance[]> = new BehaviorSubject(null);
  isLoadingBalances: boolean;
  refreshBalances() {
    if (!this.isLoadingBalances) {
      this.downloadBalances().subscribe(balances => {
        this.isLoadingBalances = false;
        console.log('balances ' + this.exchange)
        //console.log(moment().format('HH:mm a') + ' new balances ', balances);
        this.balancesSub.next(balances)
      }, error => {
        this.isLoadingBalances = false;
      })
    }
  }

  balance$(symbol: string): Observable<VOBalance> {
    console.log(symbol);
    const sub: Subject<VOBalance> = new Subject<VOBalance>();
    this.balancesSub.asObservable().subscribe(balances => {
      if (balances) {
        //  console.log(balances);
        sub.next(_.find(balances, {symbol: symbol}));
      } else this.refreshBalances();
    })

    return sub;

  }

  async getBalance(symbol: string, isRefresh = false): Promise<VOBalance> {
    if (!isRefresh && this.balancesSub.getValue()) {
      const bal = _.find(this.balancesSub.getValue(), {symbol: symbol});
      return Promise.resolve(bal)
    }

    return this.downloadBalances().toPromise().then(bals => {
      this.balancesSub.next(bals);
      return _.find(bals, {symbol: symbol})
    });
  }

  abstract downloadBalances(): Observable<VOBalance[]>;

  abstract sellLimit(base: string, coin: string, quantity: number, rate: number): Observable<VOOrder>

  abstract buyLimit(base: string, coin: string, quantity: number, rate: number): Observable<VOOrder>

  resetCredetials(){
    this.credentials = null;
  }

  protected getCredentials(): { apiKey: string, password: string } {
    if (!!this.credentials) return this.credentials;
    this.userLogin.getExchangeCredentials(this.exchange).then(str => {
      if (str) {
        let cred: { apiKey: string, password: string } = JSON.parse(str);
        if (cred && cred.apiKey && cred.password) {
          this.credentials = cred;
          this.loginSub.next(true);

        } else this.userLogin.onLoginError(this.exchange, LoginStatus.EXCHANGE_LOGIN_REQIRED);
      } else this.userLogin.onLoginError(this.exchange, LoginStatus.EXCHANGE_LOGIN_REQIRED);
    });

    return null
  }

  getOpenOrders(base: string, coin: string): Observable<VOOrder[]> {

    return null;
  }

  getAllOrderes(base: string, coin: string): Observable<VOOrder[]> {
    return null;
  }


  createLogin(){
    this.userLogin.createExchangeLogin(this.exchange);
  }
}
