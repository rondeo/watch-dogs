import {VOOrder} from "../../models/app-models";
import {Observable} from "rxjs/Observable";
import {StorageService} from "../../services/app-storage.service";
import {reject} from "q";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Subject} from "rxjs/Subject";

export abstract class ApiPrivateAbstaract {

  exchange:string;
 /* credetialsSub:BehaviorSubject<{apiKey:string, password: string}> = new BehaviorSubject(null);
  credentials$(){

    return this.credetialsSub.asObservable();
  }

  */
  private credentials: {apiKey: string, password: string};
  constructor(private storage:StorageService){

  }
  abstract  sellLimit(base: string, coin:string, quantity: number, rate: number): Observable<VOOrder>
  abstract  sellLimit(base: string, coin:string, quantity: number, rate: number): Observable<VOOrder>

  protected getCredentials():Observable<{apiKey:string, password: string}>{
    if(this.credentials) return Observable.of(this.credentials);
    const sub = new Subject<{apiKey:string, password: string}>();

    let str = this.storage.getItem(this.exchange + '-credentials', true);
    //console.warn('autoLogin ', str);
    if (str) {
      let credentials: { apiKey: string, password: string } = JSON.parse(str);
      // console.log(credentials);
      if (credentials && credentials.apiKey && credentials.password) {
        this.credentials = credentials;
        sub.next({apiKey:credentials.apiKey, password:credentials.password});
      }else sub.next(null)
    }else sub.next(null)


    return sub.asObservable();
  }
}
