import {VOBalance, VOOrder} from "../../models/app-models";
import {Observable} from "rxjs/Observable";
import {StorageService} from "../../services/app-storage.service";
import {reject} from "q";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Subject} from "rxjs/Subject";
import {UtilsBooks} from "../../com/utils-books";
import {WatchDog} from "../../my-bot/services/watch-dog";

export abstract class ApiPrivateAbstaract {

  exchange: string;
  apiPublic:any;
  /* credetialsSub:BehaviorSubject<{apiKey:string, password: string}> = new BehaviorSubject(null);
   credentials$(){

     return this.credetialsSub.asObservable();
   }

   */
  private credentials: { apiKey: string, password: string };
  constructor(private storage: StorageService) {

  }

  sellCoin(sellCoin:WatchDog):Observable<WatchDog>{
    if(!sellCoin.coinUS) throw new Error(' need coin price')
    return this.downloadBalance(sellCoin.coin).switchMap(balance =>{
      // console.log(balance);
      if(balance.balance * sellCoin.coinUS < 10) {
        sellCoin.balanceCoin = 0;
      }else sellCoin.balanceCoin = balance.balance;

      if(!sellCoin.balanceCoin) {
        sellCoin.balanceCoin = 0;
        return Observable.of(sellCoin);
      }

      return this.apiPublic.downloadBooks(sellCoin.base, sellCoin.coin).switchMap(books => {
        // console.log(books);

        let rate = UtilsBooks.getRateForAmountCoin(books.buy, sellCoin.balanceCoin);
        const myCoinprice = sellCoin.baseUS * rate;
        sellCoin.booksDelta = +(100*(myCoinprice - sellCoin.coinUS)/sellCoin.coinUS).toPrecision(2);
        rate = +(rate - (rate* 0.01)).toFixed(8);
        return this.sellLimit(sellCoin.base, sellCoin.coin, sellCoin.balanceCoin, rate).switchMap(order =>{
          console.log(order);
          if(order.uuid){
            sellCoin.uuid = order.uuid;
            return this.getOrder(order.uuid).switchMap(order =>{

              return Observable.of(sellCoin)
            })

          }else throw new Error(order.message)



        })


      })


    })

  }

  abstract  getOrder(orderId):Observable<VOOrder>;
  abstract downloadBalance(symbol: string): Observable<VOBalance>;
  abstract downloadBalances(): Observable<VOBalance[]>;
  abstract sellLimit(base: string, coin: string, quantity: number, rate: number): Observable<VOOrder>
  abstract sellLimit(base: string, coin: string, quantity: number, rate: number): Observable<VOOrder>


  protected getCredentials(): Observable<{ apiKey: string, password: string }> {
    if (!!this.credentials) return Observable.of(this.credentials);
    let credentials = null;
    const sub = new Subject<{ apiKey: string, password: string }>();

    let str = this.storage.getItem(this.exchange + '-credentials', true);
    if (str) {
      let credentials: { apiKey: string, password: string } = JSON.parse(str);
      if (credentials && credentials.apiKey && credentials.password) {
        this.credentials = credentials;
      }
    }

    return Observable.of(this.credentials);
  }
}
