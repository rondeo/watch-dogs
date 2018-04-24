import {VOBalance, VOOrder} from "../../models/app-models";
import {Observable} from "rxjs/Observable";
import {StorageService} from "../../services/app-storage.service";
import {reject} from "q";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Subject} from "rxjs/Subject";
import {VOProcessCoin} from "../../my-bot/services/bot-sell-coin.service";

export abstract class ApiPrivateAbstaract {

  exchange: string;
  /* credetialsSub:BehaviorSubject<{apiKey:string, password: string}> = new BehaviorSubject(null);
   credentials$(){

     return this.credetialsSub.asObservable();
   }

   */
  private credentials: { apiKey: string, password: string };
  constructor(private storage: StorageService) {

  }

  abstract  getOrder(orderId):Observable<VOOrder>;
  abstract sellCoin(coin:VOProcessCoin):Observable<VOProcessCoin>;
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

    return new BehaviorSubject(this.credentials).asObservable()
  }
}
