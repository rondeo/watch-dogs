import {VOBalance, VOOrder} from '../../models/app-models';
import {Observable} from 'rxjs/Observable';
import {StorageService} from '../../services/app-storage.service';
import {reject} from 'q';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {UtilsBooks} from '../../com/utils-books';
import {LoginStatus, UserLoginService} from '../../services/user-login.service';
import {WatchDog} from '../../models/watch-dog';

export abstract class ApiPrivateAbstaract {

  abstract exchange: string;


  apiPublic: any;

  /* credetialsSub:BehaviorSubject<{apiKey:string, password: string}> = new BehaviorSubject(null);
   credentials$(){

     return this.credetialsSub.asObservable();
   }

   */


  loginSub:Subject<boolean> = new Subject()
  userLogin$() {
    return  this.loginSub.asObservable();  // TOD dipatch  call after user login this.userLogin.exchangeLogin$();
  }

  private credentials: { apiKey: string, password: string };

  constructor(private userLogin: UserLoginService) {

  }

  sellCoin(sellCoin: WatchDog): Observable<WatchDog> {
    if (!sellCoin.coinUS) throw new Error(' need coin price')
    return this.downloadBalance(sellCoin.coin).switchMap(balance => {
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

  }

  abstract cancelOrder(orderId, base?: string, coin?: string): Observable<VOOrder>;

  abstract getOrder(orderId, base: string, coin: string): Observable<VOOrder>;

  abstract downloadBalance(symbol: string): Observable<VOBalance>;

  abstract downloadBalances(): Observable<VOBalance[]>;

  abstract sellLimit(base: string, coin: string, quantity: number, rate: number): Observable<VOOrder>

  abstract buyLimit(base: string, coin: string, quantity: number, rate: number): Observable<VOOrder>


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
}
